import "dotenv/config";

import { App } from "aws-cdk-lib";

import { readDeploymentConfig } from "../config/env";
import { AuthStack } from "../lib/auth-stack";
import { ComputeStack } from "../lib/compute-stack";
import { DataStack } from "../lib/data-stack";
import { NetworkStack } from "../lib/network-stack";
import { ObservabilityStack } from "../lib/observability-stack";
import { WebStack } from "../lib/web-stack";

const app = new App();
const config = readDeploymentConfig();

const stackEnv = {
  account: config.account,
  region: config.region
};

const network = new NetworkStack(app, `${config.appPrefix}-network-${config.envName}`, {
  env: stackEnv
});

const data = new DataStack(app, `${config.appPrefix}-data-${config.envName}`, {
  env: stackEnv,
  vpc: network.vpc
});

const auth = new AuthStack(app, `${config.appPrefix}-auth-${config.envName}`, {
  env: stackEnv,
  domainPrefix: config.cognitoDomainPrefix
});

new ComputeStack(app, `${config.appPrefix}-compute-${config.envName}`, {
  env: stackEnv,
  vpc: network.vpc,
  appSecurityGroup: data.appSecurityGroup,
  dbSecret: data.dbSecret,
  auth
});

new WebStack(app, `${config.appPrefix}-web-${config.envName}`, {
  env: stackEnv
});

new ObservabilityStack(app, `${config.appPrefix}-observability-${config.envName}`, {
  env: stackEnv
});
