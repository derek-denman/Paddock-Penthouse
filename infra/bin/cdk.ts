import "dotenv/config";

import { App } from "aws-cdk-lib";

import { readDeploymentEnv } from "../config/env";
import { PaddockStack } from "../lib/p2p-stack";

const app = new App();
const deployEnv = readDeploymentEnv();

new PaddockStack(app, `PaddockToPenthouse-${deployEnv}`, {
  description: "Paddock to Penthouse foundational infrastructure stack"
});
