import { Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import {
  Bucket,
  BlockPublicAccess,
  BucketEncryption,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { CustomDomain, CustomDomainProps } from "./constructs/custom-domain";
import { Frontend } from "./constructs/frontend";

interface InfrastructureStackProps extends StackProps {
  readonly environmentName: string;
  readonly customDomain?: CustomDomainProps;
  readonly webAclId: string;
}

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    let customDomain: CustomDomain | undefined;
    if (props.customDomain)
      customDomain = new CustomDomain(
        this,
        `${props.environmentName}FrontendDomain`,
        { ...props.customDomain, environmentName: props.environmentName }
      );

    const accessLogBucket = new Bucket(
      this,
      `${props.environmentName}FrontendAccessLog`,
      {
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: RemovalPolicy.DESTROY,
        objectOwnership: ObjectOwnership.OBJECT_WRITER,
        autoDeleteObjects: true,
      }
    );

    const frontend = new Frontend(this, `${props.environmentName}Frontend`, {
      customDomain: customDomain?.customDomainProps,
      accessLogBucket,
      webAclId: props.webAclId,
      environmentName: props.environmentName,
    });

    new CfnOutput(this, "FrontendUrl", {
      value: frontend.frontEndUrl,
    });
  }
}
