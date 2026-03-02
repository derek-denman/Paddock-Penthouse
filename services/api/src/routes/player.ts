import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../db/prisma";
import { authenticate } from "../middleware/auth";

const staffHireSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(2).max(80),
  role: z.enum([
    "TEAM_PRINCIPAL",
    "RACE_ENGINEER",
    "STRATEGIST",
    "PIT_CREW_COACH",
    "TALENT_SCOUT",
    "LEGAL_COMPLIANCE"
  ]),
  salary: z.coerce.number().int().positive()
});

const driverSignSchema = z.object({
  teamId: z.string().uuid(),
  driverName: z.string().min(2).max(80),
  series: z.enum(["F1", "NASCAR", "INDYCAR", "WEC", "IMSA"]),
  salary: z.coerce.number().int().positive(),
  buyoutFee: z.coerce.number().int().nonnegative().optional()
});

const teamQuerySchema = z.object({
  leagueId: z.string().uuid().optional()
});

const rosterItemSchema = z.object({
  slot: z.enum(["STARTER", "BENCH", "RESERVE"]),
  driverName: z.string().min(2).max(80),
  salary: z.coerce.number().int().positive()
});

const submitRosterSchema = z.object({
  teamId: z.string().uuid(),
  eventId: z.string().uuid(),
  salaryCap: z.coerce.number().int().positive(),
  items: z.array(rosterItemSchema).min(3)
});

const submitPicksSchema = z.object({
  teamId: z.string().uuid(),
  eventId: z.string().uuid(),
  picks: z
    .array(
      z.object({
        pickType: z.string().min(2).max(60),
        pickValue: z.string().min(1).max(120),
        confidence: z.coerce.number().int().min(1).max(5).default(1)
      })
    )
    .min(1)
});

const ensureTeamOwnership = async (teamId: string, userId: string) => {
  const team = await prisma.playerTeam.findUnique({
    where: { id: teamId }
  });

  if (!team || team.userId !== userId) {
    throw new Error("TEAM_ACCESS_DENIED");
  }

  return team;
};

export async function playerRoutes(app: FastifyInstance) {
  app.get("/player/state", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const user = await prisma.user.findUnique({
      where: { id: request.auth.userId },
      include: {
        memberships: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        teams: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return reply.notFound("user not found");
    }

    return {
      profile: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      },
      memberships: user.memberships,
      teams: user.teams
    };
  });

  app.get("/player/team", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const query = teamQuerySchema.parse(request.query ?? {});

    const team = await prisma.playerTeam.findFirst({
      where: {
        userId: request.auth.userId,
        ...(query.leagueId ? { leagueId: query.leagueId } : {})
      },
      include: {
        staffMembers: true,
        driverContracts: true,
        upgrades: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (!team) {
      return reply.notFound("team not found");
    }

    return team;
  });

  app.post("/player/team/staff/hire", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const body = staffHireSchema.parse(request.body ?? {});

    let team;
    try {
      team = await ensureTeamOwnership(body.teamId, request.auth.userId);
    } catch {
      return reply.forbidden("cannot modify this team");
    }

    if (team.funds < body.salary) {
      return reply.badRequest("insufficient funds");
    }

    const [staffMember] = await prisma.$transaction([
      prisma.staffMember.create({
        data: {
          teamId: team.id,
          name: body.name,
          role: body.role,
          salary: body.salary
        }
      }),
      prisma.playerTeam.update({
        where: { id: team.id },
        data: {
          funds: {
            decrement: body.salary
          }
        }
      })
    ]);

    return reply.code(201).send(staffMember);
  });

  app.post("/player/team/drivers/sign", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const body = driverSignSchema.parse(request.body ?? {});

    let team;
    try {
      team = await ensureTeamOwnership(body.teamId, request.auth.userId);
    } catch {
      return reply.forbidden("cannot modify this team");
    }

    if (team.funds < body.salary) {
      return reply.badRequest("insufficient funds");
    }

    const [contract] = await prisma.$transaction([
      prisma.driverContract.create({
        data: {
          teamId: team.id,
          driverName: body.driverName,
          series: body.series,
          salary: body.salary,
          buyoutFee: body.buyoutFee,
          status: "ACTIVE"
        }
      }),
      prisma.playerTeam.update({
        where: { id: team.id },
        data: {
          funds: {
            decrement: body.salary
          }
        }
      })
    ]);

    return reply.code(201).send(contract);
  });

  app.post("/player/roster/submit", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const body = submitRosterSchema.parse(request.body ?? {});

    let team;
    try {
      team = await ensureTeamOwnership(body.teamId, request.auth.userId);
    } catch {
      return reply.forbidden("cannot modify this team");
    }

    const event = await prisma.event.findUnique({
      where: { id: body.eventId }
    });

    if (!event) {
      return reply.notFound("event not found");
    }

    if (event.startsAt <= new Date()) {
      return reply.badRequest("roster lock has passed");
    }

    const reserveCount = body.items.filter((item) => item.slot === "RESERVE").length;
    if (reserveCount !== 1) {
      return reply.badRequest("roster must include exactly one reserve");
    }

    const totalSalary = body.items.reduce((sum, item) => sum + item.salary, 0);
    if (totalSalary > body.salaryCap) {
      return reply.badRequest("salary cap exceeded");
    }

    const existing = await prisma.rosterSubmission.findUnique({
      where: {
        teamId_eventId: {
          teamId: team.id,
          eventId: event.id
        }
      }
    });

    const rosterSubmission = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.rosterItem.deleteMany({
          where: { submissionId: existing.id }
        });

        return tx.rosterSubmission.update({
          where: { id: existing.id },
          data: {
            salaryCap: body.salaryCap,
            submittedAt: new Date(),
            rosterItems: {
              create: body.items.map((item) => ({
                slot: item.slot,
                driverName: item.driverName,
                salary: item.salary
              }))
            }
          },
          include: {
            rosterItems: true
          }
        });
      }

      return tx.rosterSubmission.create({
        data: {
          teamId: team.id,
          eventId: event.id,
          salaryCap: body.salaryCap,
          rosterItems: {
            create: body.items.map((item) => ({
              slot: item.slot,
              driverName: item.driverName,
              salary: item.salary
            }))
          }
        },
        include: {
          rosterItems: true
        }
      });
    });

    return reply.code(201).send(rosterSubmission);
  });

  app.post("/player/picks/submit", { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.auth) {
      return reply.unauthorized("not authenticated");
    }

    const body = submitPicksSchema.parse(request.body ?? {});

    let team;
    try {
      team = await ensureTeamOwnership(body.teamId, request.auth.userId);
    } catch {
      return reply.forbidden("cannot modify this team");
    }

    const event = await prisma.event.findUnique({
      where: { id: body.eventId }
    });

    if (!event) {
      return reply.notFound("event not found");
    }

    if (event.startsAt <= new Date()) {
      return reply.badRequest("pre-race picks are locked");
    }

    const result = await prisma.$transaction(async (tx) => {
      const submissions = [];
      for (const pick of body.picks) {
        const created = await tx.preRacePick.upsert({
          where: {
            teamId_eventId_pickType: {
              teamId: team.id,
              eventId: event.id,
              pickType: pick.pickType
            }
          },
          update: {
            pickValue: pick.pickValue,
            confidence: pick.confidence
          },
          create: {
            teamId: team.id,
            eventId: event.id,
            pickType: pick.pickType,
            pickValue: pick.pickValue,
            confidence: pick.confidence
          }
        });
        submissions.push(created);
      }

      return submissions;
    });

    return reply.code(201).send({ picks: result });
  });
}
