import * as cdk from '@aws-cdk/core';
import * as glue from '@aws-cdk/aws-glue';
import * as iam from '@aws-cdk/aws-iam';
import * as lake from '@aws-cdk/aws-lakeformation';

export interface GlueDatabaseProps {
  name: string;
}

export class GlueDatabase extends cdk.Construct {
  public readonly database: glue.IDatabase;

  constructor(scope: cdk.Construct, id: string, props: GlueDatabaseProps) {
    super(scope, id);

    this.database = new glue.Database(this, 'Database', {
      databaseName: props.name,
    });
  }

  public grantAccess(role: iam.IRole) {
    new lake.CfnPermissions(this, 'Permission', {
      resource: {
        databaseResource: {
          name: this.database.databaseName
        }
      },
      dataLakePrincipal: {
        dataLakePrincipalIdentifier: role.roleArn
      },
      permissions: ['ALL'] // for list of values see https://docs.aws.amazon.com/cli/latest/reference/lakeformation/grant-permissions.html
    });
  }

}
