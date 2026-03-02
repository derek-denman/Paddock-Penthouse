import "dotenv/config";

import { readWorkerEnv } from "./config/env";
import { startScheduler } from "./jobs/scheduler";

const start = async () => {
  const env = readWorkerEnv();
  process.stdout.write(`[worker] mode=${env.RACE_DATA_MODE} tickMs=${String(env.WORKER_TICK_MS)}\n`);
  await startScheduler();
};

void start();
