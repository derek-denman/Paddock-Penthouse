import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { runTeamAssistant } from "../ai/service";
import { readApiEnv } from "../config/env";
import { prisma } from "../db/prisma";
import { authenticate } from "../middleware/auth";
import { enforceFixedWindowRateLimit } from "../utils/rate-limit";

const chatSchema = z.object({
  message: z.string().min(1).max(1500)
});

export async function aiRoutes(app: FastifyInstance) {
  app.post("/ai/chat", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const env = readApiEnv();
    const rateLimit = enforceFixedWindowRateLimit(
      `ai:${request.auth.userId}`,
      env.AI_RATE_LIMIT_PER_MINUTE,
      60_000
    );

    if (!rateLimit.ok) {
      reply.header("retry-after", String(Math.ceil(rateLimit.retryAfterMs / 1000)));
      return reply.code(429).send({ error: "rate limit exceeded" });
    }

    const body = chatSchema.parse(request.body ?? {});

    const aiResponse = await runTeamAssistant(request.auth.userId, body.message);

    await prisma.$transaction([
      prisma.teamAiMessage.create({
        data: {
          userId: request.auth.userId,
          role: "USER",
          content: body.message
        }
      }),
      prisma.teamAiMessage.create({
        data: {
          userId: request.auth.userId,
          role: "ASSISTANT",
          content: aiResponse.message,
          actions: aiResponse.actions as Prisma.InputJsonValue
        }
      })
    ]);

    return aiResponse;
  });

  app.get("/ai/history", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const messages = await prisma.teamAiMessage.findMany({
      where: {
        userId: request.auth.userId
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 100
    });

    return { messages };
  });
}
