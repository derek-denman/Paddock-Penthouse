export type Role = "PLAYER" | "ADMIN";

export type Series = "F1" | "NASCAR" | "INDYCAR" | "WEC" | "IMSA";

export type RaceDataMode = "SIM" | "LIVE_WITH_SIM_FALLBACK";

export type NormalizedEventType =
  | "LAP_COMPLETED"
  | "PIT_STOP"
  | "FLAG"
  | "POSITION_CHANGE"
  | "PENALTY"
  | "RETIREMENT"
  | "SAFETY_CAR"
  | "RESTART";

export type PredictionType =
  | "CAUTION_WINDOW"
  | "PIT_WINDOW"
  | "UNDERCUT"
  | "RESTART_LEADER"
  | "FASTEST_STOP"
  | "PIT_GAINER";

export type AiActionType =
  | "RECOMMEND_LINEUP"
  | "RECOMMEND_HIRE"
  | "EXPLAIN_RULES"
  | "EVALUATE_RISK"
  | "SUMMARIZE_NEWS"
  | "SUGGEST_PITWALL_CALL";
