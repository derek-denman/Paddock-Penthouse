import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_MODE: z.enum(["local", "cognito"]).default("local"),
  LOCAL_JWT_SECRET: z.string().min(12).default("local-dev-secret-change-me"),
  OWNER_EMAIL: z.string().email().default("owner@example.com")
});

export type ApiEnv = z.infer<typeof envSchema>;

export const readApiEnv = (): ApiEnv => envSchema.parse(process.env);
