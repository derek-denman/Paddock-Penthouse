import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class PaddockStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webBucket = new Bucket(this, "WebBucket", {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true
    });

    new CfnOutput(this, "WebBucketName", {
      value: webBucket.bucketName
    });
  }
}
