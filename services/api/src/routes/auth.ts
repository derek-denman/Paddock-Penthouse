import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { signLocalToken } from "../auth/local-token";
import { syncUserFromIdentity } from "../auth/user-sync";
import { readApiEnv } from "../config/env";
import { authenticate } from "../middleware/auth";

const localLoginSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(80).default("Local Player")
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/local/login", async (request, reply) => {
    const env = readApiEnv();

    if (env.AUTH_MODE !== "local") {
      return reply.forbidden("local auth is disabled");
    }

    const body = localLoginSchema.parse(request.body ?? {});

    const identity = {
      subject: crypto.randomUUID(),
      email: body.email,
      displayName: body.displayName,
      provider: "local" as const
    };

    const user = await syncUserFromIdentity(identity, env);

    const token = await signLocalToken(
      {
        sub: user.userId,
        email: user.email,
        name: body.displayName,
        role: user.role,
        provider: "local"
      },
      env.LOCAL_JWT_SECRET
    );

    return {
      token,
      user
    };
  });

  app.post("/auth/local/logout", async (_request, reply) => {
    const env = readApiEnv();
    if (env.AUTH_MODE !== "local") {
      return reply.forbidden("local auth is disabled");
    }

    return reply.code(204).send();
  });

  app.get("/auth/me", { preHandler: [authenticate] }, async (request) => {
    if (!request.auth) {
      throw app.httpErrors.unauthorized("not authenticated");
    }

    return request.auth;
  });
}
