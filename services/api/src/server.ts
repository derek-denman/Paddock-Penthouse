import { buildApp } from "./app";
import { readApiEnv } from "./config/env";

const start = async () => {
  const env = readApiEnv();
  const app = buildApp();

  try {
    await app.listen({
      host: "0.0.0.0",
      port: env.API_PORT
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
