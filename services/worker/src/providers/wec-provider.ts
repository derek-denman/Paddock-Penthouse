import type { RaceProvider } from "./provider";

const notImplemented = async () => {
  throw new Error("WEC provider is a stub in Season 0");
};

export const wecProviderStub: RaceProvider = {
  key: "WEC_STUB",
  healthCheck: async () => false,
  start: notImplemented,
  stop: async () => undefined
};
