import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../db/prisma";
import { authenticate } from "../middleware/auth";

const eventIdSchema = z.object({
  eventId: z.string().uuid()
});

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
        preRacePicks: true
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

    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: { id: true, name: true, key: true, status: true }
    });

    if (!event) {
      return reply.notFound("event not found");
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
  });
}
