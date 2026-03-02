export const finishPositionPoints: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1
};

export const scoringBonuses = {
  pole: 3,
  fastestLap: 2,
  podium: 2,
  cleanRace: 1
} as const;

export const scoringPenalties = {
  dnf: -5,
  majorPenalty: -3,
  disqualification: -10
} as const;

export const crownJewelMultipliers: Record<string, number> = {
  "monaco-gp": 1.25,
  "indy-500": 1.25,
  "daytona-500": 1.25,
  "le-mans-24": 1.5
};
