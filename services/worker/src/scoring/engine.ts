import type { PlayerTeam } from "@prisma/client";

import { crownJewelMultipliers, finishPositionPoints, scoringBonuses, scoringPenalties } from "./rules";

export type OfficialScoreInput = {
  position: number;
  eventKey: string;
  hasPole?: boolean;
  hasFastestLap?: boolean;
  hadCleanRace?: boolean;
  hadDnf?: boolean;
  hadMajorPenalty?: boolean;
  wasDisqualified?: boolean;
};

export const calculateOfficialScore = (input: OfficialScoreInput): number => {
  const basePosition = finishPositionPoints[input.position] ?? 0;

  let subtotal = basePosition;

  if (input.hasPole) {
    subtotal += scoringBonuses.pole;
  }
  if (input.hasFastestLap) {
    subtotal += scoringBonuses.fastestLap;
  }
  if (input.position <= 3) {
    subtotal += scoringBonuses.podium;
  }
  if (input.hadCleanRace !== false) {
    subtotal += scoringBonuses.cleanRace;
  }
  if (input.hadDnf) {
    subtotal += scoringPenalties.dnf;
  }
  if (input.hadMajorPenalty) {
    subtotal += scoringPenalties.majorPenalty;
  }
  if (input.wasDisqualified) {
    subtotal += scoringPenalties.disqualification;
  }

  const multiplier = crownJewelMultipliers[input.eventKey] ?? 1;

  return Math.round(subtotal * multiplier);
};

export const calculateProvisionalLapTick = (): number => {
  return 1;
};

export type TeamSettlement = {
  teamId: string;
  position: number;
  points: number;
};

export const buildDeterministicSettlement = (teams: PlayerTeam[], eventKey: string): TeamSettlement[] => {
  const rankedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return rankedTeams.map((team, index) => {
    const position = index + 1;
    const points = calculateOfficialScore({
      position,
      eventKey,
      hasPole: position === 1,
      hasFastestLap: position === 1,
      hadCleanRace: true
    });

    return {
      teamId: team.id,
      position,
      points
    };
  });
};
