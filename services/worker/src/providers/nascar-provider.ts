import type { RaceProvider } from "./provider";

const notImplemented = async () => {
  throw new Error("NASCAR provider is a stub in Season 0");
};

export const nascarProviderStub: RaceProvider = {
  key: "NASCAR_STUB",
  healthCheck: async () => false,
  start: notImplemented,
  stop: async () => undefined
};
