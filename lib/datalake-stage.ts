import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';

import { DatalakeCdkStack } from './stacks/datalake-cdk-stack';
import { PinpointAnalyticsStack } from './stacks/pinpoint-analytics-stack';
import { DataStack } from './stacks/data-stack';
import { GlueDatabase } from './constructs/glue-database';

export interface DataLakeStageProps extends cdk.StageProps {}

export class DataLakeStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props: DataLakeStageProps) {
    super(scope, id, props);

    const athenaStack = new cdk.Stack(this, 'AthenaStack', { env: props?.env });
    new s3.Bucket(athenaStack, 'QueryResults', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    const lakeStack = new DatalakeCdkStack(this, 'DatalakeCdkStack', { env: props?.env });

    new PinpointAnalyticsStack(this, 'PinpointAnalytics', {
      crossAccountRole: lakeStack.crossAccountRole,
      customResourceExecutionRole: lakeStack.lambdaExecutionRole,
    });

    // create another data lake location
    const dataStack = new DataStack(this, 'AnotherS3DataStack', {
      customResourceExecutionRole: lakeStack.lambdaExecutionRole
    });

    new GlueDatabase(dataStack, 'DataStackDatabase', {
      name: 'AnotherDatabase'
    });
  }
}

