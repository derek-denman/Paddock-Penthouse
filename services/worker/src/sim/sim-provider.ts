import type { NormalizedEvent } from "@p2p/common";

import type { RaceProvider } from "../providers/provider";

let timer: NodeJS.Timeout | null = null;
let lap = 0;

export const simProvider: RaceProvider = {
  key: "SIM",
  start: async (eventId, emit) => {
    if (timer) {
      return;
    }

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
    }, 3000);
  },
  stop: async () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
};
