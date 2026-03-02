import type { NormalizedEvent } from "@p2p/common";

export type RaceProvider = {
  key: string;
  healthCheck?: () => Promise<boolean>;
  start: (eventId: string, emit: (event: NormalizedEvent) => void) => Promise<void>;
  stop: () => Promise<void>;
};
