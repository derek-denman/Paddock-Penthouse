import { describe, expect, it } from "vitest";

import { buildDeterministicSettlement, calculateOfficialScore } from "./engine";

describe("calculateOfficialScore", () => {
  it("applies base points with podium bonus and clean race", () => {
    const points = calculateOfficialScore({
      position: 2,
      eventKey: "regular-race",
      hadCleanRace: true
    });

    expect(points).toBe(21);
  });

  it("applies crown jewel multiplier", () => {
    const points = calculateOfficialScore({
      position: 1,
      eventKey: "monaco-gp",
      hasPole: true,
      hasFastestLap: true,
      hadCleanRace: true
    });

    expect(points).toBe(41);
  });

  it("applies penalties", () => {
    const points = calculateOfficialScore({
      position: 8,
      eventKey: "regular-race",
      hadCleanRace: false,
      hadDnf: true,
      hadMajorPenalty: true
    });

    expect(points).toBe(-4);
  });
});

describe("buildDeterministicSettlement", () => {
  it("ranks teams by name and returns positions", () => {
    const settlements = buildDeterministicSettlement(
      [
        { id: "team-2", name: "Bravo", userId: "u2", leagueId: "l1", funds: 0, strategyTokens: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: "team-1", name: "Alpha", userId: "u1", leagueId: "l1", funds: 0, strategyTokens: 0, createdAt: new Date(), updatedAt: new Date() }
      ],
      "regular-race"
    );

    expect(settlements[0]).toMatchObject({ teamId: "team-1", position: 1 });
    expect(settlements[1]).toMatchObject({ teamId: "team-2", position: 2 });
  });
});
