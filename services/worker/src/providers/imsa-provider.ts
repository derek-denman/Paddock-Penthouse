import type { RaceProvider } from "./provider";

const notImplemented = async () => {
  throw new Error("IMSA provider is a stub in Season 0");
};

export const imsaProviderStub: RaceProvider = {
  key: "IMSA_STUB",
  healthCheck: async () => false,
  start: notImplemented,
  stop: async () => undefined
};
