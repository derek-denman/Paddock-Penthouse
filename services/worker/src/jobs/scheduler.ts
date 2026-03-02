import type { NormalizedEvent } from "@p2p/common";

import { simProvider } from "../sim/sim-provider";

export const startScheduler = async () => {
  const eventId = "00000000-0000-0000-0000-000000000001";

  await simProvider.start(eventId, (event: NormalizedEvent) => {
    // Milestone 0: basic visibility; future milestones publish to websocket/queue.
    process.stdout.write(`[sim-event] ${event.type} lap=${String(event.payload.lap)}\n`);
  });
};
