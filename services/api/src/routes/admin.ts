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
}
