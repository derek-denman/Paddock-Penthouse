export type DeploymentEnv = "dev" | "prod";

export type DeploymentConfig = {
  envName: DeploymentEnv;
  account?: string;
  region: string;
  appPrefix: string;
  cognitoDomainPrefix: string;
  googleClientIdSecretArn?: string;
  googleClientSecretArn?: string;
};

export const readDeploymentConfig = (): DeploymentConfig => {
  const envName = process.env.DEPLOY_ENV === "prod" ? "prod" : "dev";

  return {
    envName,
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
    appPrefix: process.env.APP_PREFIX ?? "paddock-penthouse",
    cognitoDomainPrefix:
      process.env.COGNITO_DOMAIN_PREFIX ?? `paddock-penthouse-${envName}-${Date.now().toString().slice(-6)}`,
    googleClientIdSecretArn: process.env.GOOGLE_CLIENT_ID_SECRET_ARN,
    googleClientSecretArn: process.env.GOOGLE_CLIENT_SECRET_ARN
  };
};
