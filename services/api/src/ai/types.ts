export type AllowedAiActionType =
  | "RECOMMEND_LINEUP"
  | "RECOMMEND_HIRE"
  | "EXPLAIN_RULES"
  | "EVALUATE_RISK"
  | "SUMMARIZE_NEWS"
  | "SUGGEST_PITWALL_CALL";

export type AiAction = {
  type: AllowedAiActionType;
  summary: string;
  payload: Record<string, unknown>;
  allowed: boolean;
};

export type AiResponse = {
  provider: "local" | "openai";
  message: string;
  actions: AiAction[];
};

export type TeamAiContext = {
  userId: string;
  displayName: string;
  funds: number;
  strategyTokens: number;
  staffCount: number;
  driverCount: number;
  latestTeamName: string | null;
  upcomingEvent: {
    id: string;
    key: string;
    name: string;
    status: string;
    startsAt: string;
  } | null;
};
