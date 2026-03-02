import type { NormalizedEvent } from "@p2p/common";

import type { RaceProvider } from "../providers/provider";

let timer: NodeJS.Timeout | null = null;
let lap = 0;

const readTickMs = (): number => {
  const parsed = Number(process.env.WORKER_TICK_MS ?? "3000");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
};

export const simProvider: RaceProvider = {
  key: "SIM",
  start: async (eventId, emit) => {
    if (timer) {
      return;
    }

    lap = 0;
    const tickMs = readTickMs();

    timer = setInterval(() => {
      lap += 1;

      const event: NormalizedEvent = {
        id: crypto.randomUUID(),
        eventId,
        series: "F1",
        type: "LAP_COMPLETED",
        timestamp: new Date().toISOString(),
        payload: { lap }
      };

      emit(event);
    }, tickMs);
  },
  stop: async () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    lap = 0;
  }
};
