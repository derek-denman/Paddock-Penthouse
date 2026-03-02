import { readApiEnv } from "../config/env";

import { loadTeamAiContext } from "./context";
import { runLocalAssistant } from "./local-assistant";
import { runOpenAiAssistant } from "./openai-assistant";
import type { AiResponse } from "./types";

export const runTeamAssistant = async (userId: string, message: string): Promise<AiResponse> => {
  const env = readApiEnv();
  const context = await loadTeamAiContext(userId);

  if (env.AI_PROVIDER === "openai" && env.OPENAI_API_KEY) {
    try {
      const response = await runOpenAiAssistant(message, context, env.OPENAI_API_KEY, env.OPENAI_MODEL);
      if (response) {
        return response;
      }
    } catch {
      // Fall back to deterministic local assistant.
    }
  }

  return runLocalAssistant(message, context);
};
