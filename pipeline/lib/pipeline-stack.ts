import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";

interface PipelineStackProps extends cdk.StackProps {
  branch: string;
  environmentName: string;
  repoName: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "BedrockChatbotPipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(props.repoName, props.branch),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });
  }
}
