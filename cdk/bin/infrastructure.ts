#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfrastructureStack } from "../lib/infrastructure-stack";
import { WafStack } from "../lib/waf-stack";

const app = new cdk.App();

const environmentName = app.node.tryGetContext("env") || "dev";
const { CDK_DEFAULT_REGION, CDK_DEFAULT_ACCOUNT } = process.env;
const ALLOWED_IP_V4_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV4AddressRanges"
);
const ALLOWED_IP_V6_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV6AddressRanges"
);

console.log("============================================================");
console.log(`Deploy infrastructure in "${environmentName}" environment`);
console.log(`Account: ${CDK_DEFAULT_ACCOUNT}`);
console.log(`Region: ${CDK_DEFAULT_REGION}`);
// console.log(`Domain: ${domainAlias}.${hostedByRoute53}`);
console.log("============================================================");

const waf = new WafStack(app, `WafStack-${environmentName}`, {
  env: {
    region: "us-east-1",
    account: CDK_DEFAULT_ACCOUNT,
  },
  allowedIpV4AddressRanges: ALLOWED_IP_V4_ADDRESS_RANGES,
  allowedIpV6AddressRanges: ALLOWED_IP_V6_ADDRESS_RANGES,
  environmentName,
});

new InfrastructureStack(app, `InfrastructureStack-${environmentName}`, {
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT,
  },
  crossRegionReferences: true,
  environmentName,
  webAclId: waf.webAclArn.value,
});

app.synth();
