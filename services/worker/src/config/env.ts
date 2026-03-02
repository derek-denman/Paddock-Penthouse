import { z } from "zod";

const workerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  RACE_DATA_MODE: z.enum(["SIM", "LIVE_WITH_SIM_FALLBACK"]).default("SIM"),
  WORKER_TICK_MS: z.coerce.number().default(3000)
});

export const readWorkerEnv = () => workerEnvSchema.parse(process.env);
