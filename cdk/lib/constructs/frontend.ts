import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  IBucket,
} from "aws-cdk-lib/aws-s3";
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
  ViewerCertificate,
} from "aws-cdk-lib/aws-cloudfront";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { NodejsBuild } from "deploy-time-build";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CustomDomainProps } from "./custom-domain";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

export interface FrontendDomainProps extends CustomDomainProps {
  readonly certificate: Certificate;
  readonly hostedZone?: HostedZone;
}

export interface FrontendProps {
  readonly customDomain?: FrontendDomainProps;
  readonly webAclId: string;
  readonly accessLogBucket: IBucket;
  readonly environmentName: string;
}

export class Frontend extends Construct {
  readonly frontEndUrl: string;

  constructor(scope: Construct, id: string, props: FrontendProps) {
    super(scope, id);

    const assetBucket = new Bucket(this, `${props.environmentName}Frontend`, {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      `${props.environmentName}FrontendOAI`
    );

    let viewerCertificate: ViewerCertificate | undefined;
    if (props.customDomain?.certificate)
      viewerCertificate = ViewerCertificate.fromAcmCertificate(
        props.customDomain.certificate,
        { aliases: [props.customDomain.name] }
      );

    const distribution = new CloudFrontWebDistribution(
      this,
      `${props.environmentName}FrontendCdn`,
      {
        viewerCertificate,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: assetBucket,
              originAccessIdentity,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: "/",
          },
          {
            errorCode: 403,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: "/",
          },
        ],
        loggingConfig: {
          bucket: props.accessLogBucket,
          prefix: "Frontend/",
        },
        webACLId: props.webAclId,
      }
    );

    new NodejsBuild(this, `${props.environmentName}FrontendBuild`, {
      assets: [
        {
          path: "../frontend",
          exclude: ["node_modules", "build"],
          commands: ["npm ci"],
        },
      ],
      buildCommands: ["npm run build"],
      buildEnvironment: {
        REACT_APP_ENVIRONMENT: props.environmentName,
      },
      destinationBucket: assetBucket,
      distribution,
      outputSourceDirectory: "build",
    });

    this.frontEndUrl = distribution.distributionDomainName;
    if (props.customDomain) {
      this.frontEndUrl = `https://${props.customDomain.name}`;
      if (props.customDomain.hostedZone)
        new ARecord(this, `${props.environmentName}FrontendAlias`, {
          zone: props.customDomain.hostedZone,
          recordName: props.customDomain.name,
          target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        });
    }
  }
}
