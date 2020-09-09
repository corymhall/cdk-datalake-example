import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as glue from '@aws-cdk/aws-glue';

export interface GlueCrawlerProps {
  bucketPath: string;
  glueRole: iam.IRole;
  database: glue.IDatabase;
  tablePrefix?: string;
}

export class GlueCrawler extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: GlueCrawlerProps) {
    super(scope, id);

    new glue.CfnCrawler(this, 'Crawler', {
      role: props.glueRole.roleArn,
      schedule: {
        scheduleExpression: 'cron(0 22 ? * MON-FRI *)' // run at 6pm EST every Monday through Friday
      },
      targets: {
        s3Targets: [
          {
            path: props.bucketPath
          }
        ]
      },
      databaseName: props.database.databaseName,
      tablePrefix: props.tablePrefix,
      configuration: "{\"Version\":1.0,\"CrawlerOutput\":{\"Partitions\":{\"AddOrUpdateBehavior\":\"InheritFromTable\"},\"Tables\":{\"AddOrUpdateBehavior\":\"MergeNewColumns\"}}}"
    });
  }
}
