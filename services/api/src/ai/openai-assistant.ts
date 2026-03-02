import type { AiResponse, TeamAiContext } from "./types";

const buildPrompt = (message: string, context: TeamAiContext) => {
  return [
    "You are a team strategist assistant for Paddock to Penthouse.",
    "Never suggest unauthorized admin actions.",
    "Return compact JSON with keys: message, actions.",
    "Actions must only use: RECOMMEND_LINEUP, RECOMMEND_HIRE, EXPLAIN_RULES, EVALUATE_RISK, SUMMARIZE_NEWS, SUGGEST_PITWALL_CALL.",
    `Context: ${JSON.stringify(context)}`,
    `User message: ${message}`
  ].join("\n");
};

export const runOpenAiAssistant = async (
  message: string,
  context: TeamAiContext,
  apiKey: string,
  model: string
): Promise<AiResponse | null> => {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: buildPrompt(message, context),
      temperature: 0.3
    })
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };

  if (!payload.output_text) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload.output_text) as {
      message?: string;
      actions?: Array<{
        type?: string;
        summary?: string;
        payload?: Record<string, unknown>;
        allowed?: boolean;
      }>;
    };

    return {
      provider: "openai",
      message: parsed.message ?? "No assistant message generated.",
      actions: (parsed.actions ?? [])
        .filter((action) => action.type && action.summary)
        .map((action) => ({
          type: action.type as AiResponse["actions"][number]["type"],
          summary: action.summary as string,
          payload: action.payload ?? {},
          allowed: action.allowed !== false
        }))
    };
  } catch {
    return {
      provider: "openai",
      message: payload.output_text,
      actions: []
    };
  }
};
