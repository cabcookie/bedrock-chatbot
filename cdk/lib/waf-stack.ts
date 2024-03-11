import * as cdk from "aws-cdk-lib";
import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

interface WafStackProps extends StackProps {
  readonly allowedIpV4AddressRanges: string[];
  readonly allowedIpV6AddressRanges: string[];
  readonly environmentName: string;
}

/**
 * Frontend WAF
 */
export class WafStack extends Stack {
  /**
   * Web ACL ARN
   */
  public readonly webAclArn: CfnOutput;

  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    // create Ipset for ACL
    const ipV4SetReferenceStatement = new wafv2.CfnIPSet(
      this,
      `${props.environmentName}IpV4Set`,
      {
        ipAddressVersion: "IPV4",
        scope: "CLOUDFRONT",
        addresses: props.allowedIpV4AddressRanges,
      }
    );
    const ipV6SetReferenceStatement = new wafv2.CfnIPSet(
      this,
      `${props.environmentName}IpV6Set`,
      {
        ipAddressVersion: "IPV6",
        scope: "CLOUDFRONT",
        addresses: props.allowedIpV6AddressRanges,
      }
    );

    const webAcl = new wafv2.CfnWebACL(this, `${props.environmentName}WebAcl`, {
      defaultAction: { block: {} },
      name: `${props.environmentName}WebAcl`,
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${props.environmentName}WebAcl`,
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          priority: 0,
          name: `${props.environmentName}WebAclIpV4RuleSet`,
          action: { allow: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${props.environmentName}WebAcl`,
            sampledRequestsEnabled: true,
          },
          statement: {
            ipSetReferenceStatement: { arn: ipV4SetReferenceStatement.attrArn },
          },
        },
        {
          priority: 1,
          name: `${props.environmentName}WebAclIpV6RuleSet`,
          action: { allow: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${props.environmentName}WebAcl`,
            sampledRequestsEnabled: true,
          },
          statement: {
            ipSetReferenceStatement: { arn: ipV6SetReferenceStatement.attrArn },
          },
        },
      ],
    });

    this.webAclArn = new cdk.CfnOutput(this, "WebAclId", {
      value: webAcl.attrArn,
    });
  }
}
