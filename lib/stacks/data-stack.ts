import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import { LakeFormationResource } from '../constructs/lakeformation-resources';
import { GlueDatabase } from '../constructs/glue-database';
import { GlueCrawler } from '../constructs/glue';

export interface DataStackProps extends cdk.StackProps {
  customResourceExecutionRole: iam.IRole;
}

export class DataStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const s3Location = new s3.Bucket(this, 'S3Location', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    new LakeFormationResource( this, 'Resource', {
      resourceArn: s3Location.bucketArn,
      customResourceExecutionRole: props.customResourceExecutionRole,
    });
  }
}

