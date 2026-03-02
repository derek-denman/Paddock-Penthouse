export type DeploymentEnv = "dev" | "prod";

export const readDeploymentEnv = (): DeploymentEnv => {
  const env = process.env.DEPLOY_ENV;
  if (env === "prod") {
    return "prod";
  }

  return "dev";
};
