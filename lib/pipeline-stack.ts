import * as cdk from '@aws-cdk/core';
import * as pipelines from '@aws-cdk/pipelines'
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as actions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as iam from '@aws-cdk/aws-iam';

export interface PipelineStackProps extends cdk.StackProps {
  name: string;
}

export class PipelineStack extends cdk.Stack {
  public readonly pipeline: pipelines.CdkPipeline;

  constructor(scope: cdk.Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    this.pipeline = new pipelines.CdkPipeline(this, 'Pipeline', {
      pipelineName: `${props.name}-DeliveryPipeline`,
      cloudAssemblyArtifact,
      sourceAction: new actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: cdk.SecretValue.secretsManager('corymhall-github-token'),
        trigger: actions.GitHubTrigger.WEBHOOK,
        owner: 'corymhall',
        repo: 'cdk-datalake-example',
        branch: 'main'
      }),
      synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
        rolePolicyStatements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              "ssm:GetParameter",
              "ssm:GetParameters"
            ],
            resources: [
              this.formatArn({
                service: 'ssm',
                resource: 'parameter',
                sep: '/',
                region: this.region,
                account: this.account,
                resourceName: 'accounts/*'
              })
            ]
          })
        ],
        sourceArtifact,
        cloudAssemblyArtifact,
        environmentVariables: {
          'DATA_LAKE_ACCOUNT': {
            value: '/accounts/data-lake',
            type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE
          },
          'SHARED_SERVICES_ACCOUNT': {
            value: '/accounts/shared-services',
            type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE
          },
          'SANDBOX_ACCOUNT': {
            value: '/accounts/sandbox',
            type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE
          },
        },
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_3_0,
          privileged: true,
        },
      })
    });
  }
}
