import { z } from "zod";

const workerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  RACE_DATA_MODE: z.enum(["SIM", "LIVE_WITH_SIM_FALLBACK"]).default("SIM"),
  WORKER_TICK_MS: z.coerce.number().default(3000),
  ENABLE_F1_LIVE: z.coerce.boolean().default(false),
  F1_API_BASE: z.string().url().default("https://api.openf1.org/v1"),
  F1_SESSION_KEY: z.string().optional()
});

export const readWorkerEnv = () => workerEnvSchema.parse(process.env);
