import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../db/prisma";
import { authenticate } from "../middleware/auth";

const createLeagueSchema = z.object({
  name: z.string().min(3).max(80),
  code: z.string().min(4).max(16).regex(/^[A-Z0-9_-]+$/)
});

const joinLeagueSchema = z.object({
  code: z.string().min(4).max(16).regex(/^[A-Z0-9_-]+$/)
});

export async function leagueRoutes(app: FastifyInstance) {
  app.post("/leagues", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const body = createLeagueSchema.parse(request.body ?? {});

    const league = await prisma.league.create({
      data: {
        name: body.name,
        code: body.code.toUpperCase(),
        ownerId: request.auth.userId,
        memberships: {
          create: {
            userId: request.auth.userId,
            role: "OWNER"
          }
        },
        teams: {
          create: {
            userId: request.auth.userId,
            name: `${request.auth.email.split("@")[0]} Racing`
          }
        }
      }
    });

    return reply.code(201).send(league);
  });

  app.post("/leagues/join", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const body = joinLeagueSchema.parse(request.body ?? {});

    const league = await prisma.league.findUnique({
      where: { code: body.code.toUpperCase() }
    });

    if (!league) {
      return reply.notFound("league not found");
    }

    await prisma.leagueMembership.upsert({
      where: {
        leagueId_userId: {
          leagueId: league.id,
          userId: request.auth.userId
        }
      },
      update: {},
      create: {
        leagueId: league.id,
        userId: request.auth.userId,
        role: "MEMBER"
      }
    });

    await prisma.playerTeam.upsert({
      where: {
        leagueId_userId: {
          leagueId: league.id,
          userId: request.auth.userId
        }
      },
      update: {},
      create: {
        leagueId: league.id,
        userId: request.auth.userId,
        name: `${request.auth.email.split("@")[0]} Racing`
      }
    });

    return { joined: true, leagueId: league.id };
  });

  app.get("/leagues/:leagueId", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const params = z.object({ leagueId: z.string().uuid() }).parse(request.params);

    const membership = await prisma.leagueMembership.findUnique({
      where: {
        leagueId_userId: {
          leagueId: params.leagueId,
          userId: request.auth.userId
        }
      }
    });

    if (!membership) {
      return reply.forbidden("not a league member");
    }

    const league = await prisma.league.findUnique({
      where: { id: params.leagueId },
      include: {
        memberships: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true }
            }
          }
        },
        teams: true
      }
    });

    if (!league) {
      return reply.notFound("league not found");
    }

    return league;
  });

  app.get("/leagues/:leagueId/standings", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const params = z.object({ leagueId: z.string().uuid() }).parse(request.params);

    const membership = await prisma.leagueMembership.findUnique({
      where: {
        leagueId_userId: {
          leagueId: params.leagueId,
          userId: request.auth.userId
        }
      }
    });

    if (!membership) {
      return reply.forbidden("not a league member");
    }

    const totals = await prisma.scoreLedger.groupBy({
      by: ["teamId"],
      _sum: { points: true },
      where: {
        team: {
          leagueId: params.leagueId
        }
      }
    });

    const teams = await prisma.playerTeam.findMany({
      where: { leagueId: params.leagueId },
      include: { user: { select: { email: true, displayName: true } } }
    });

    const standings = teams
      .map((team) => {
        const sum = totals.find((entry) => entry.teamId === team.id)?._sum.points ?? 0;
        return {
          teamId: team.id,
          teamName: team.name,
          manager: team.user.displayName,
          email: team.user.email,
          points: sum
        };
      })
      .sort((a, b) => b.points - a.points);

    return { standings };
  });
}
