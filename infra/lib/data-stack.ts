import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  IVpc,
  Peer,
  Port,
  SecurityGroup,
  SubnetType
} from "aws-cdk-lib/aws-ec2";
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
  StorageType
} from "aws-cdk-lib/aws-rds";
import { CfnReplicationGroup } from "aws-cdk-lib/aws-elasticache";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export type DataStackProps = StackProps & {
  vpc: IVpc;
};

export class DataStack extends Stack {
  readonly databaseSecurityGroup: SecurityGroup;
  readonly redisSecurityGroup: SecurityGroup;
  readonly appSecurityGroup: SecurityGroup;
  readonly dbSecret: Secret;
  readonly dbInstance: DatabaseInstance;
  readonly redisCluster: CfnReplicationGroup;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    this.appSecurityGroup = new SecurityGroup(this, "AppSecurityGroup", {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: "Application services SG"
    });

    this.databaseSecurityGroup = new SecurityGroup(this, "DatabaseSecurityGroup", {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: "Database SG"
    });

    this.redisSecurityGroup = new SecurityGroup(this, "RedisSecurityGroup", {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: "Redis SG"
    });

    this.databaseSecurityGroup.addIngressRule(this.appSecurityGroup, Port.tcp(5432));
    this.redisSecurityGroup.addIngressRule(this.appSecurityGroup, Port.tcp(6379));

    this.dbSecret = new Secret(this, "PostgresSecret", {
      secretName: `${id.toLowerCase()}-postgres`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "appuser" }),
        generateStringKey: "password",
        excludePunctuation: true
      }
    });

    this.dbInstance = new DatabaseInstance(this, "Postgres", {
      vpc: props.vpc,
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16_4
      }),
      credentials: Credentials.fromSecret(this.dbSecret),
      allocatedStorage: 20,
      maxAllocatedStorage: 200,
      storageType: StorageType.GP3,
      multiAz: false,
      backupRetention: Duration.days(7),
      publiclyAccessible: false,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [this.databaseSecurityGroup],
      removalPolicy: RemovalPolicy.SNAPSHOT,
      deletionProtection: false,
      databaseName: "paddock"
    });

    this.redisCluster = new CfnReplicationGroup(this, "Redis", {
      replicationGroupDescription: "Paddock to Penthouse redis",
      engine: "redis",
      cacheNodeType: "cache.t4g.small",
      numNodeGroups: 1,
      replicasPerNodeGroup: 0,
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      securityGroupIds: [this.redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: undefined
    });

    this.appSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(4000));
  }
}
