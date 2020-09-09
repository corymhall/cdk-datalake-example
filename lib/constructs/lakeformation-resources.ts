import * as cdk from '@aws-cdk/core';
import * as lake from '@aws-cdk/aws-lakeformation';
import * as iam from '@aws-cdk/aws-iam';
import * as custom from '@aws-cdk/custom-resources';

export interface LakeFormationResourceProps {
  /**
   * ARN of the resource to add as a lakeformation resource
   */
  resourceArn: string;

  /**
   * If the resource is in a different account
   * then provide an IAM role to use instead of the
   * default service role
   *
   * @default - use LakeFormation service role
   */
  crossAccountRole?: iam.IRole;

  /**
   * An IAM role for the Custom Resource that
   * grants permissions to the LakeFormation data location.
   * The IAM role should have sufficient LakeFormation access
   */
  customResourceExecutionRole: iam.IRole;
}

export class LakeFormationResource extends cdk.Construct {
  public readonly resourceArn: string;
  public readonly crossAccount: boolean;

  private readonly resourceId: string;
  private readonly resource: lake.CfnResource;

  constructor(scope: cdk.Construct, id: string, props: LakeFormationResourceProps) {
    super(scope, id);

    this.resourceArn = props.resourceArn;
    this.crossAccount = props.crossAccountRole ? true : false;

    this.resource = new lake.CfnResource(this, 'LakeResource', {
      resourceArn: props.resourceArn,
      useServiceLinkedRole: props.crossAccountRole ? false : true,
      roleArn: props.crossAccountRole ? props.crossAccountRole.roleArn : undefined
    });

    this.resourceId = this.resource.logicalId;

    // If the resource (s3 bucket) exists in another account then we need to
    // to use a special cross account role to access the bucket.
    // if the resource is in the data lake account then we use the default service-linked
    // role which will automatically get updated with the necessary permissions
    if (props.crossAccountRole) {
      this.grantLocationAccess(props.crossAccountRole, props.customResourceExecutionRole);

      props.crossAccountRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:GetObject',
          's3:DeleteObject'
        ],
        resources: [
          `${props.resourceArn}/*`
        ]
      }));

      props.crossAccountRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:ListBucket'
        ],
        resources: [
          `${props.resourceArn}`
        ]
      }));
    } else {
      const role = iam.Role.fromRoleArn(this, 'LakeFormationServiceRole', cdk.Stack.of(this).formatArn({
        service: 'iam',
        resource: 'role',
        region: '',
        account: cdk.Stack.of(this).account,
        resourceName: 'aws-service-role/lakeformation.amazonaws.com/AWSServiceRoleForLakeFormationDataAccess'
      }));
      this.grantLocationAccess(role, props.customResourceExecutionRole);

    }
  }

  // Granting permissions to DataLocation is not currently available in CloudFormation
  // We get around that limitation by using a Custom Resource
  private grantLocationAccess(role: iam.IRole, executionRole: iam.IRole) {
    const customResource = new custom.AwsCustomResource(this, 'LocationPermission', {
      onUpdate: {
        service: 'LakeFormation',
        action: 'grantPermissions',
        parameters: {
          Principal: {
            DataLakePrincipalIdentifier: role.roleArn
          },
          Resource: {
            DataLocation: {
              ResourceArn: this.resourceArn,
              CatalogId: cdk.Stack.of(this).account
            }
          },
          Permissions: ['DATA_LOCATION_ACCESS'],
          PermissionsWithGrantOption: ['DATA_LOCATION_ACCESS']
        },
        physicalResourceId: custom.PhysicalResourceId.of(this.resourceId)
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: custom.AwsCustomResourcePolicy.ANY_RESOURCE
      }),
      role: executionRole
    });

    customResource.node.addDependency(this.resource);
  }
}
