import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { LakeFormationResource } from '../constructs/lakeformation-resources';
import { GlueDatabase } from '../constructs/glue-database';
import { GlueCrawler } from '../constructs/glue';

export interface PinpointAnalyticsStackProps extends cdk.StackProps {
  crossAccountRole: iam.IRole;
  customResourceExecutionRole: iam.IRole;
}

export class PinpointAnalyticsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: PinpointAnalyticsStackProps) {
    super(scope, id, props);

    const devPinpointResource = new LakeFormationResource( this, 'PinpointAnalytics', {
      resourceArn: 'arn:aws:s3:::my-bucket-in-another-account',
      crossAccountRole: props.crossAccountRole,
      customResourceExecutionRole: props.customResourceExecutionRole,
    });

    const pinpointAnalyticsDb = new GlueDatabase(this, 'PinpointAnalyticsDb', {
      name: `pinpoint-analytics-db`
    });

    pinpointAnalyticsDb.grantAccess(props.crossAccountRole);

    new GlueCrawler(this, 'PinpointAnalyticsCrawler', {
      database: pinpointAnalyticsDb.database,
      glueRole: props.crossAccountRole,
      bucketPath: `s3://${this.parseArn(devPinpointResource.resourceArn).resource}/events/`,
      tablePrefix: 'raw_'
    });
  }
}

