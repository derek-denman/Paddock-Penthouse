import type { RaceProvider } from "./provider";

const notImplemented = async () => {
  throw new Error("IndyCar provider is a stub in Season 0");
};

export const indyProviderStub: RaceProvider = {
  key: "INDY_STUB",
  healthCheck: async () => false,
  start: notImplemented,
  stop: async () => undefined
};
