import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_MODE: z.enum(["local", "cognito"]).default("local"),
  RACE_DATA_MODE: z.enum(["SIM", "LIVE_WITH_SIM_FALLBACK"]).default("SIM"),
  AI_PROVIDER: z.enum(["local", "openai"]).default("local")
});

export const readCommonEnv = () => envSchema.parse(process.env);
