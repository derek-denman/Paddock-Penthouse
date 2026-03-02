import { createRemoteJWKSet, jwtVerify } from "jose";

import type { ApiEnv } from "../config/env";
import type { VerifiedIdentity } from "./types";

const missingConfigurationError = new Error(
  "cognito configuration missing: COGNITO_REGION, COGNITO_USER_POOL_ID, and COGNITO_APP_CLIENT_ID are required"
);

const getCognitoConfig = (env: ApiEnv) => {
  if (!env.COGNITO_REGION || !env.COGNITO_USER_POOL_ID || !env.COGNITO_APP_CLIENT_ID) {
    throw missingConfigurationError;
  }

  const issuer = `https://cognito-idp.${env.COGNITO_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`;

  return {
    issuer,
    audience: env.COGNITO_APP_CLIENT_ID,
    jwksUri: new URL(`${issuer}/.well-known/jwks.json`)
  };
};

export const verifyCognitoToken = async (token: string, env: ApiEnv): Promise<VerifiedIdentity> => {
  const config = getCognitoConfig(env);

  const { payload } = await jwtVerify(token, createRemoteJWKSet(config.jwksUri), {
    issuer: config.issuer,
    audience: config.audience,
    algorithms: ["RS256"]
  });

  const tokenUse = payload.token_use;
  if (tokenUse !== "id") {
    throw new Error("expected Cognito id token");
  }

  const subject = payload.sub;
  const email = payload.email;
  const displayName = payload.name ?? payload["cognito:username"];

  if (typeof subject !== "string" || typeof email !== "string" || typeof displayName !== "string") {
    throw new Error("invalid Cognito claims");
  }

  return {
    subject,
    email,
    displayName,
    provider: "cognito"
  };
};
