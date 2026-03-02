import type { NormalizedEvent } from "@p2p/common";

import type { RaceProvider } from "./provider";

type OpenF1Lap = {
  lap_number?: number;
  date_start?: string;
};

let timer: NodeJS.Timeout | null = null;
let cursor = 0;
let lapSequence: number[] = [];

const readConfig = () => {
  return {
    apiBase: process.env.F1_API_BASE ?? "https://api.openf1.org/v1",
    sessionKey: process.env.F1_SESSION_KEY,
    tickMs: Number(process.env.WORKER_TICK_MS ?? "3000")
  };
};

const loadLapSequence = async (): Promise<number[]> => {
  const config = readConfig();
  if (!config.sessionKey) {
    throw new Error("F1_SESSION_KEY is required for live provider mode");
  }

  const url = `${config.apiBase}/laps?session_key=${encodeURIComponent(config.sessionKey)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`F1 provider request failed (${String(response.status)})`);
  }

  const laps = (await response.json()) as OpenF1Lap[];
  const unique = [...new Set(laps.map((lap) => lap.lap_number).filter((value): value is number => typeof value === "number"))];

  if (unique.length === 0) {
    throw new Error("F1 provider returned no laps");
  }

  return unique.sort((a, b) => a - b);
};

export const f1Provider: RaceProvider = {
  key: "F1_LIVE",
  healthCheck: async () => {
    const config = readConfig();

    if (!config.sessionKey) {
      return false;
    }

    const response = await fetch(`${config.apiBase}/sessions?session_key=${encodeURIComponent(config.sessionKey)}`);
    return response.ok;
  },
  start: async (eventId, emit) => {
    if (timer) {
      return;
    }

    lapSequence = await loadLapSequence();
    cursor = 0;

    const tickMs = Number.isFinite(readConfig().tickMs) ? readConfig().tickMs : 3000;

    timer = setInterval(() => {
      if (cursor >= lapSequence.length) {
        return;
      }

      const lap = lapSequence[cursor];
      cursor += 1;

      const event: NormalizedEvent = {
        id: crypto.randomUUID(),
        eventId,
        series: "F1",
        type: "LAP_COMPLETED",
        timestamp: new Date().toISOString(),
        payload: {
          lap,
          source: "F1_OPEN_API"
        }
      };

      emit(event);
    }, tickMs);
  },
  stop: async () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    cursor = 0;
    lapSequence = [];
  }
};
