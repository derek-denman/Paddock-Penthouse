import type { AiResponse, TeamAiContext } from "./types";

const blockedPatterns = [/grant\s+admin/i, /override\s+score/i, /change\s+other\s+player/i, /promote\s+role/i];

const isBlockedRequest = (message: string): boolean => {
  return blockedPatterns.some((pattern) => pattern.test(message));
};

export const runLocalAssistant = (message: string, context: TeamAiContext): AiResponse => {
  if (isBlockedRequest(message)) {
    return {
      provider: "local",
      message:
        "I can only advise on your team operations. I cannot grant admin access, modify other players, or override official scoring.",
      actions: []
    };
  }

  const lower = message.toLowerCase();

  if (lower.includes("lineup") || lower.includes("roster")) {
    return {
      provider: "local",
      message: `For ${context.latestTeamName ?? "your team"}, prioritize highest-value starters and preserve a low-risk reserve for lock-in protection.`,
      actions: [
        {
          type: "RECOMMEND_LINEUP",
          summary: "Balanced starter set with reserve safety",
          payload: {
            strategy: "balance",
            salaryCapHint: "Keep 8-12% cap buffer"
          },
          allowed: true
        }
      ]
    };
  }

  if (lower.includes("hire") || lower.includes("staff")) {
    return {
      provider: "local",
      message: "Hire a strategist first if your token conversion is weak, then race engineering for weekly consistency.",
      actions: [
        {
          type: "RECOMMEND_HIRE",
          summary: "Prioritize strategist role",
          payload: {
            role: "STRATEGIST",
            budgetRange: Math.floor(context.funds * 0.1)
          },
          allowed: true
        }
      ]
    };
  }

  if (lower.includes("risk") || lower.includes("safe")) {
    return {
      provider: "local",
      message:
        "Current risk profile is moderate. Use 1-token calls on uncertain windows and reserve 2-token calls for high-confidence restart scenarios.",
      actions: [
        {
          type: "EVALUATE_RISK",
          summary: "Moderate risk recommendation",
          payload: {
            riskLevel: "medium",
            tokenPlan: "3 low-risk + 1 high-conviction"
          },
          allowed: true
        }
      ]
    };
  }

  if (lower.includes("pit") || lower.includes("live")) {
    return {
      provider: "local",
      message: "Use PIT_WINDOW calls early and save UNDERCUT/RESTART_LEADER for lap clusters where volatility rises.",
      actions: [
        {
          type: "SUGGEST_PITWALL_CALL",
          summary: "Early pit-window, late undercut",
          payload: {
            firstCall: "PIT_WINDOW",
            secondCall: "UNDERCUT"
          },
          allowed: true
        }
      ]
    };
  }

  return {
    provider: "local",
    message:
      "I can help with lineup decisions, hiring strategy, rule clarification, risk evaluation, and pit-wall prediction planning for your team.",
    actions: [
      {
        type: "EXPLAIN_RULES",
        summary: "Explain scoring, locks, and token usage",
        payload: {
          topics: ["salary cap", "pre-race lock", "strategy tokens"]
        },
        allowed: true
      }
    ]
  };
};
