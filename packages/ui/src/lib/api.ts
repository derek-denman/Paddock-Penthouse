import { appConfig } from "./config";

export type ApiHealth = {
  ok: boolean;
  service: string;
  timestamp: string;
};

export const fetchHealth = async (): Promise<ApiHealth> => {
  const response = await fetch(`${appConfig.apiOrigin}/health`);
  if (!response.ok) {
    throw new Error("API unavailable");
  }

  return response.json() as Promise<ApiHealth>;
};
