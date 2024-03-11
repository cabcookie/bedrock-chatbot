import { HostedZone, PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { FrontendDomainProps } from "./frontend";
import { DomainCertificate } from "./certificate";

export interface CustomDomainProps {
  readonly route53Props?: {
    region: string;
    zoneName: string;
  };
  name: string;
  environmentName: string;
}

export class CustomDomain extends Construct {
  readonly customDomainProps: FrontendDomainProps;

  constructor(scope: Construct, id: string, props: CustomDomainProps) {
    super(scope, id);

    let hostedZone: HostedZone | undefined;
    if (props.route53Props) {
      hostedZone = new PublicHostedZone(
        this,
        `${props.environmentName}FrontendHostedZone`,
        {
          zoneName: props.route53Props.zoneName,
        }
      );
    }
    const certificate = new DomainCertificate(
      this,
      `${props.environmentName}FrontendCertificate`,
      {
        domainAlias: props.name,
        hostedZone,
      }
    );
    this.customDomainProps = {
      ...props,
      certificate: certificate.domainCertificate,
      hostedZone,
    };
  }
}
