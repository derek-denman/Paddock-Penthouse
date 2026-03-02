import { Stack, StackProps } from "aws-cdk-lib";
import { IVpc, IpAddresses, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class NetworkStack extends Stack {
  readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, "AppVpc", {
      maxAzs: 2,
      natGateways: 1,
      ipAddresses: IpAddresses.cidr("10.32.0.0/16"),
      subnetConfiguration: [
        {
          name: "public",
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: "private-app",
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: "private-data",
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ]
    });
  }
}
