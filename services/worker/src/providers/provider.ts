import type { NormalizedEvent } from "@p2p/common";

export type RaceProvider = {
  key: string;
  start: (eventId: string, emit: (event: NormalizedEvent) => void) => Promise<void>;
  stop: () => Promise<void>;
};
