import type { Prisma } from "@prisma/client";
import type { NormalizedEvent } from "@p2p/common";

import { prisma } from "../db/prisma";
import { buildDeterministicSettlement, calculateProvisionalLapTick } from "../scoring/engine";
import { simProvider } from "../sim/sim-provider";

const MAX_SIM_LAPS = 20;
const settledEventIds = new Set<string>();

const persistNormalizedEvent = async (event: NormalizedEvent, sequence: number) => {
  await prisma.normalizedRaceEvent.create({
    data: {
      eventId: event.eventId,
      sequence,
      type: event.type,
      timestamp: new Date(event.timestamp),
      payload: event.payload as Prisma.InputJsonValue
    }
  });
};

const applyProvisionalTick = async (eventId: string, lap: number) => {
  const teams = await prisma.playerTeam.findMany({
    select: { id: true }
  });

  if (teams.length === 0) {
    return;
  }

  const points = calculateProvisionalLapTick();

  await prisma.scoreLedger.createMany({
    data: teams.map((team) => ({
      teamId: team.id,
      eventId,
      points,
      reason: `SIM_LAP_TICK_L${String(lap)}`
    }))
  });
};

const applySettlement = async (eventId: string) => {
  if (settledEventIds.has(eventId)) {
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event || event.status === "FINAL") {
    return;
  }

  const teams = await prisma.playerTeam.findMany();
  const settlements = buildDeterministicSettlement(teams, event.key);

  await prisma.$transaction(async (tx) => {
    for (const settlement of settlements) {
      await tx.scoreLedger.create({
        data: {
          teamId: settlement.teamId,
          eventId,
          points: settlement.points,
          reason: `SETTLEMENT_POSITION_${String(settlement.position)}`
        }
      });
    }

    await tx.event.update({
      where: { id: eventId },
      data: { status: "FINAL" }
    });
  });

  settledEventIds.add(eventId);
  await simProvider.stop();

  process.stdout.write(`[settlement] event=${event.key} finalized teams=${String(settlements.length)}\n`);
};

const handleSimEvent = async (event: NormalizedEvent) => {
  const lap = Number(event.payload.lap ?? 0);
  const sequence = Number.isFinite(lap) && lap > 0 ? lap : Date.now();

  await persistNormalizedEvent(event, sequence);
  await applyProvisionalTick(event.eventId, lap);

  process.stdout.write(`[sim-event] type=${event.type} lap=${String(lap)} event=${event.eventId}\n`);

  if (lap >= MAX_SIM_LAPS) {
    await applySettlement(event.eventId);
  }
};

const getOrStartLiveEvent = async () => {
  const existingLive = await prisma.event.findFirst({
    where: { status: "LIVE" },
    orderBy: { startsAt: "asc" }
  });

  if (existingLive) {
    return existingLive;
  }

  const nextEvent = await prisma.event.findFirst({
    where: { status: "SCHEDULED" },
    orderBy: { startsAt: "asc" }
  });

  if (!nextEvent) {
    return null;
  }

  return prisma.event.update({
    where: { id: nextEvent.id },
    data: { status: "LIVE" }
  });
};

export const startScheduler = async () => {
  const event = await getOrStartLiveEvent();

  if (!event) {
    process.stdout.write("[worker] no scheduled events found, scheduler idle\n");
    return;
  }

  process.stdout.write(`[worker] starting sim stream for event=${event.key}\n`);

  await simProvider.start(event.id, (normalizedEvent: NormalizedEvent) => {
    void handleSimEvent(normalizedEvent);
  });
};
