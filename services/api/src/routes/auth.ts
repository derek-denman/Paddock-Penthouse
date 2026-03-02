import type { FastifyInstance } from "fastify";
import { z } from "zod";

const localLoginSchema = z.object({
  email: z.string().email(),
  role: z.enum(["PLAYER", "ADMIN"]).default("PLAYER")
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/local/login", async (request, reply) => {
    if (process.env.AUTH_MODE !== "local") {
      return reply.forbidden("local auth is disabled");
    }

    const body = localLoginSchema.parse(request.body ?? {});
    const userId = crypto.randomUUID();
    const token = `local:${userId}:${body.email}:${body.role}`;

    return {
      token,
      user: {
        id: userId,
        email: body.email,
        role: body.role
      }
    };
  });

  app.get("/auth/me", async (request, reply) => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer local:")) {
      return reply.unauthorized("not authenticated");
    }

    const token = authorization.replace("Bearer ", "");
    const [, userId, email, role] = token.split(":");

    return {
      id: userId,
      email,
      role: role === "ADMIN" ? "ADMIN" : "PLAYER"
    };
  });
}
