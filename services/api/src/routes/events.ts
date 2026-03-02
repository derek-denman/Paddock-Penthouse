import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../db/prisma";
import { authenticate, authenticateToken } from "../middleware/auth";

const eventIdSchema = z.object({
  eventId: z.string().uuid()
});

const liveStreamQuerySchema = z.object({
  token: z.string().min(10)
});

const pitWallPredictionSchema = z.object({
  teamId: z.string().uuid(),
  predictionType: z.enum([
    "CAUTION_WINDOW",
    "PIT_WINDOW",
    "UNDERCUT",
    "RESTART_LEADER",
    "FASTEST_STOP",
    "PIT_GAINER"
  ]),
  target: z.string().min(1).max(120),
  tokenCost: z.coerce.number().int().min(1).max(2).optional()
});

const predictionTypeCost = (predictionType: string): number => {
  if (predictionType === "UNDERCUT" || predictionType === "RESTART_LEADER") {
    return 2;
  }

  return 1;
};

const getEventLeaderboard = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, name: true, key: true, status: true }
  });

  if (!event) {
    return null;
  }

  const totals = await prisma.scoreLedger.groupBy({
    by: ["teamId"],
    _sum: {
      points: true
    },
    where: {
      eventId: event.id
    }
  });

  const teams = await prisma.playerTeam.findMany({
    where: {
      id: {
        in: totals.map((entry) => entry.teamId)
      }
    },
    include: {
      user: {
        select: {
          displayName: true,
          email: true
        }
      }
    }
  });

  const leaderboard = totals
    .map((entry) => {
      const team = teams.find((candidate) => candidate.id === entry.teamId);
      return {
        teamId: entry.teamId,
        teamName: team?.name ?? "Unknown Team",
        manager: team?.user.displayName ?? "Unknown",
        managerEmail: team?.user.email ?? "unknown@example.com",
        points: entry._sum.points ?? 0
      };
    })
    .sort((a, b) => b.points - a.points);

  return {
    event,
    leaderboard
  };
};

export async function eventRoutes(app: FastifyInstance) {
  app.get("/events", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const events = await prisma.event.findMany({
      orderBy: {
        startsAt: "asc"
      },
      include: {
        season: {
          select: {
            id: true,
            key: true,
            name: true,
            year: true,
            series: true
          }
        }
      }
    });

    return { events };
  });

  app.get("/events/:eventId/weekend", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const params = eventIdSchema.parse(request.params);

    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      include: {
        season: true,
        rosterSubmissions: {
          include: {
            rosterItems: true,
            team: {
              select: {
                id: true,
                name: true,
                leagueId: true
              }
            }
          }
        },
        preRacePicks: true,
        pitWallPredictions: true
      }
    });

    if (!event) {
      return reply.notFound("event not found");
    }

    return event;
  });

  app.get("/events/:eventId/leaderboard", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const params = eventIdSchema.parse(request.params);
    const leaderboard = await getEventLeaderboard(params.eventId);

    if (!leaderboard) {
      return reply.notFound("event not found");
    }

    return leaderboard;
  });

  app.get("/events/:eventId/live-stream", async (request, reply) => {
    const params = eventIdSchema.parse(request.params);
    const query = liveStreamQuerySchema.parse(request.query ?? {});

    try {
      await authenticateToken(query.token);
    } catch {
      return reply.unauthorized("invalid token");
    }

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders();

    const writeEvent = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const emitSnapshot = async () => {
      const leaderboard = await getEventLeaderboard(params.eventId);
      const recentEvents = await prisma.normalizedRaceEvent.findMany({
        where: { eventId: params.eventId },
        orderBy: { sequence: "desc" },
        take: 5
      });

      writeEvent("snapshot", {
        leaderboard,
        recentEvents: [...recentEvents].reverse()
      });
    };

    await emitSnapshot();

    const interval = setInterval(() => {
      void emitSnapshot();
    }, 2000);

    request.raw.on("close", () => {
      clearInterval(interval);
      reply.raw.end();
    });

    return reply;
  });

  app.post("/events/:eventId/pitwall/predict", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const params = eventIdSchema.parse(request.params);
    const body = pitWallPredictionSchema.parse(request.body ?? {});

    const team = await prisma.playerTeam.findUnique({
      where: { id: body.teamId }
    });

    if (!team || team.userId !== request.auth.userId) {
      return reply.forbidden("cannot submit prediction for this team");
    }

    const event = await prisma.event.findUnique({
      where: { id: params.eventId }
    });

    if (!event) {
      return reply.notFound("event not found");
    }

    if (event.status === "FINAL") {
      return reply.badRequest("event is already final");
    }

    const tokenCost = body.tokenCost ?? predictionTypeCost(body.predictionType);
    if (team.strategyTokens < tokenCost) {
      return reply.badRequest("insufficient strategy tokens");
    }

    const prediction = await prisma.$transaction(async (tx) => {
      await tx.playerTeam.update({
        where: { id: team.id },
        data: {
          strategyTokens: {
            decrement: tokenCost
          }
        }
      });

      return tx.pitWallPrediction.create({
        data: {
          teamId: team.id,
          eventId: event.id,
          predictionType: body.predictionType,
          target: body.target,
          tokenCost
        }
      });
    });

    return reply.code(201).send(prediction);
  });

  app.get("/events/:eventId/pitwall/predictions", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const params = eventIdSchema.parse(request.params);

    const predictions = await prisma.pitWallPrediction.findMany({
      where: {
        eventId: params.eventId,
        team: {
          userId: request.auth.userId
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return { predictions };
  });
}
