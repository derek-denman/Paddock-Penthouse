import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyCognitoToken } from "../auth/cognito-token";
import { verifyLocalToken } from "../auth/local-token";
import { syncUserFromIdentity } from "../auth/user-sync";
import { readApiEnv } from "../config/env";

const parseAuthorizationHeader = (request: FastifyRequest): string | null => {
  const header = request.headers.authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = parseAuthorizationHeader(request);
  if (!token) {
    return reply.unauthorized("missing auth token");
  }

  const env = readApiEnv();

  try {
    const identity =
      env.AUTH_MODE === "cognito"
        ? await verifyCognitoToken(token, env)
        : await verifyLocalToken(token, env.LOCAL_JWT_SECRET);

    const user = await syncUserFromIdentity(identity, env);
    request.auth = user;
  } catch (error) {
    request.log.warn({ error }, "authentication failed");
    return reply.unauthorized("invalid auth token");
  }
};

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.auth) {
    return reply.unauthorized("not authenticated");
  }

  if (request.auth.role !== "ADMIN") {
    return reply.forbidden("admin access required");
  }
};
