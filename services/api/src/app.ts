import "dotenv/config";

import Fastify from "fastify";

import { readApiEnv } from "./config/env";
import corePlugin from "./plugins/core";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { rootRoutes } from "./routes/root";

export const buildApp = () => {
  const env = readApiEnv();

  const app = Fastify({
    logger: {
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty"
            }
          : undefined
    }
  });

  app.register(corePlugin);
  app.register(rootRoutes);
  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(adminRoutes);

  return app;
};
