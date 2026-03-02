import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../db/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";

const createSeasonSchema = z.object({
  key: z.string().min(3).max(50),
  name: z.string().min(3).max(100),
  year: z.coerce.number().int().min(2020).max(2100),
  series: z.enum(["F1", "NASCAR", "INDYCAR", "WEC", "IMSA"])
});

const createEventSchema = z.object({
  seasonId: z.string().uuid(),
  key: z.string().min(3).max(50),
  name: z.string().min(3).max(100),
  series: z.enum(["F1", "NASCAR", "INDYCAR", "WEC", "IMSA"]),
  startsAt: z.string().datetime(),
  isCrownJewel: z.boolean().default(false)
});

const updateUserRoleSchema = z.object({
  role: z.enum(["PLAYER", "ADMIN"])
});

const userIdParamSchema = z.object({
  userId: z.string().uuid()
});

const eventIdParamSchema = z.object({
  eventId: z.string().uuid()
});

const overrideResultsSchema = z.object({
  entries: z.array(
    z.object({
      teamId: z.string().uuid(),
      points: z.coerce.number().int(),
      reason: z.string().min(3).max(120).default("ADMIN_OVERRIDE")
    })
  )
});

export async function adminRoutes(app: FastifyInstance) {
  const adminGuards = { preHandler: [authenticate, requireAdmin] };

  app.get("/admin/health", adminGuards, async () => {
    return {
      ok: true,
      scope: "admin"
    };
  });

  app.post("/admin/seasons", adminGuards, async (request, reply) => {
    const body = createSeasonSchema.parse(request.body ?? {});

    const season = await prisma.season.create({
      data: body
    });

    return reply.code(201).send(season);
  });

  app.post("/admin/events", adminGuards, async (request, reply) => {
    const body = createEventSchema.parse(request.body ?? {});

    const event = await prisma.event.create({
      data: {
        seasonId: body.seasonId,
        key: body.key,
        name: body.name,
        series: body.series,
        startsAt: new Date(body.startsAt),
        isCrownJewel: body.isCrownJewel
      }
    });

    return reply.code(201).send(event);
  });

  app.get("/admin/users", adminGuards, async () => {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    return { users };
  });

  app.post("/admin/users/:userId/role", adminGuards, async (request) => {
    const params = userIdParamSchema.parse(request.params);
    const body = updateUserRoleSchema.parse(request.body ?? {});

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: {
        role: body.role
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    return user;
  });

  app.post("/admin/events/:eventId/rescore", adminGuards, async (request) => {
    const params = eventIdParamSchema.parse(request.params);

    await prisma.$transaction([
      prisma.scoreLedger.deleteMany({
        where: { eventId: params.eventId }
      }),
      prisma.normalizedRaceEvent.deleteMany({
        where: { eventId: params.eventId }
      }),
      prisma.event.update({
        where: { id: params.eventId },
        data: { status: "SCHEDULED" }
      })
    ]);

    return {
      rescoreQueued: true,
      eventId: params.eventId
    };
  });

  app.post("/admin/events/:eventId/override-results", adminGuards, async (request) => {
    const params = eventIdParamSchema.parse(request.params);
    const body = overrideResultsSchema.parse(request.body ?? {});

    await prisma.$transaction(async (tx) => {
      for (const entry of body.entries) {
        await tx.scoreLedger.create({
          data: {
            eventId: params.eventId,
            teamId: entry.teamId,
            points: entry.points,
            reason: `ADMIN_OVERRIDE:${entry.reason}`
          }
        });
      }

      await tx.event.update({
        where: { id: params.eventId },
        data: { status: "FINAL" }
      });
    });

    return {
      overridden: true,
      eventId: params.eventId,
      entries: body.entries.length
    };
  });
}
