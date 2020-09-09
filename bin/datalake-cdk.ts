#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/pipeline-stack';
import { DataLakeStage } from '../lib/datalake-stage';


const env = {
  account: process.env.DATA_LAKE_ACCOUNT,
  region: 'us-east-2'
}

const app = new cdk.App();


const delivery = new PipelineStack(app, 'DataLake-DeliveryPipeline', {
  env: {
    region: 'us-east-2',
    account: process.env.SHARED_SERVICES_ACCOUNT
  },
  name: 'DataLake'
});

const prod = new DataLakeStage(app, 'prodDataLake', {
  env,
});

delivery.pipeline.addApplicationStage(prod)

