import { Stack, StackProps } from "aws-cdk-lib";
import { IVpc, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  Secret as EcsSecret
} from "aws-cdk-lib/aws-ecs";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

import { AuthStack } from "./auth-stack";

export type ComputeStackProps = StackProps & {
  vpc: IVpc;
  appSecurityGroup: SecurityGroup;
  dbSecret: ISecret;
  auth: AuthStack;
};

export class ComputeStack extends Stack {
  readonly cluster: Cluster;
  readonly apiService: FargateService;
  readonly workerService: FargateService;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    this.cluster = new Cluster(this, "Cluster", {
      vpc: props.vpc,
      containerInsights: true
    });

    const apiTask = new FargateTaskDefinition(this, "ApiTask", {
      cpu: 512,
      memoryLimitMiB: 1024
    });

    apiTask.addContainer("ApiContainer", {
      image: ContainerImage.fromRegistry("public.ecr.aws/docker/library/node:22-alpine"),
      command: ["sh", "-lc", "node --version && sleep infinity"],
      logging: LogDrivers.awsLogs({ streamPrefix: "api" }),
      environment: {
        AUTH_MODE: "cognito",
        AI_PROVIDER: "local",
        COGNITO_USER_POOL_ID: props.auth.userPool.userPoolId,
        COGNITO_APP_CLIENT_ID: props.auth.userPoolClient.userPoolClientId
      },
      secrets: {
        DB_SECRET_JSON: EcsSecret.fromSecretsManager(props.dbSecret)
      }
    });

    this.apiService = new FargateService(this, "ApiService", {
      cluster: this.cluster,
      taskDefinition: apiTask,
      desiredCount: 1,
      assignPublicIp: false,
      securityGroups: [props.appSecurityGroup],
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      }
    });

    const workerTask = new FargateTaskDefinition(this, "WorkerTask", {
      cpu: 512,
      memoryLimitMiB: 1024
    });

    workerTask.addContainer("WorkerContainer", {
      image: ContainerImage.fromRegistry("public.ecr.aws/docker/library/node:22-alpine"),
      command: ["sh", "-lc", "node --version && sleep infinity"],
      logging: LogDrivers.awsLogs({ streamPrefix: "worker" }),
      environment: {
        RACE_DATA_MODE: "SIM"
      },
      secrets: {
        DB_SECRET_JSON: EcsSecret.fromSecretsManager(props.dbSecret)
      }
    });

    this.workerService = new FargateService(this, "WorkerService", {
      cluster: this.cluster,
      taskDefinition: workerTask,
      desiredCount: 1,
      assignPublicIp: false,
      securityGroups: [props.appSecurityGroup],
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      }
    });
  }
}
