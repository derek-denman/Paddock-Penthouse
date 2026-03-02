import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class WebStack extends Stack {
  readonly webBucket: Bucket;
  readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.webBucket = new Bucket(this, "WebBucket", {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN
    });

    this.distribution = new Distribution(this, "WebDistribution", {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(this.webBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    });
  }
}
