import * as cdk from '@aws-cdk/core';
import * as lake from '@aws-cdk/aws-lakeformation';
import * as iam from '@aws-cdk/aws-iam';

export class DatalakeCdkStack extends cdk.Stack {
  public readonly crossAccountRole: iam.IRole;
  public readonly lambdaExecutionRole: iam.IRole;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.crossAccountRole = new iam.Role(this, 'LakeCrossAccountRole', {
      roleName: 'data-lake-cross-account-role',
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('glue.amazonaws.com'),
        new iam.ServicePrincipal('lakeformation.amazonaws.com')
      )
    });
    this.crossAccountRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));

    this.lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    const synthesizer = this.synthesizer as cdk.DefaultStackSynthesizer;

    new lake.CfnDataLakeSettings(this, 'LakeSettings', {
      admins: [
        {
          dataLakePrincipalIdentifier: this.formatArn({
            service: 'iam',
            resource: 'role',
            region: '',
            account: this.account,
            resourceName: 'aws-reserved/sso.amazonaws.com/AWSReservedSSO_AWSAdministratorAccess_ed24de19f3e01636'
          }) // SSO AdminUser
        },
        {
          // The CDK cloudformation execution role.
          dataLakePrincipalIdentifier: synthesizer.cloudFormationExecutionRoleArn.replace('${AWS::Partition}', 'aws')
        },
        {
          // the lambda execution role that will be used by custom resources to perform actions
          // against LakeFormation
          dataLakePrincipalIdentifier: this.lambdaExecutionRole.roleArn
        }
      ]
    });
  }
}
