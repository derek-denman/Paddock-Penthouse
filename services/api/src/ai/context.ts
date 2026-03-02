import { prisma } from "../db/prisma";

import type { TeamAiContext } from "./types";

export const loadTeamAiContext = async (userId: string): Promise<TeamAiContext> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teams: {
        include: {
          staffMembers: true,
          driverContracts: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  });

  if (!user) {
    throw new Error("user not found");
  }

  const team = user.teams[0] ?? null;

  const upcomingEvent = await prisma.event.findFirst({
    where: {
      startsAt: {
        gte: new Date()
      }
    },
    orderBy: {
      startsAt: "asc"
    }
  });

  return {
    userId,
    displayName: user.displayName,
    funds: team?.funds ?? 0,
    strategyTokens: team?.strategyTokens ?? 0,
    staffCount: team?.staffMembers.length ?? 0,
    driverCount: team?.driverContracts.length ?? 0,
    latestTeamName: team?.name ?? null,
    upcomingEvent: upcomingEvent
      ? {
          id: upcomingEvent.id,
          key: upcomingEvent.key,
          name: upcomingEvent.name,
          status: upcomingEvent.status,
          startsAt: upcomingEvent.startsAt.toISOString()
        }
      : null
  };
};
