import { readToken } from "./auth";
import { appConfig } from "./config";

const authHeaders = () => {
  const token = readToken();
  if (!token) {
    throw new Error("not authenticated");
  }

  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `request failed (${String(response.status)})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export type PlayerState = {
  profile: {
    id: string;
    email: string;
    displayName: string;
    role: "PLAYER" | "ADMIN";
  };
  memberships: Array<{
    role: "OWNER" | "MEMBER";
    league: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  teams: Array<{
    id: string;
    name: string;
    funds: number;
    strategyTokens: number;
    league: {
      id: string;
      name: string;
      code: string;
    };
  }>;
};

export type TeamDetail = {
  id: string;
  name: string;
  funds: number;
  strategyTokens: number;
  staffMembers: Array<{
    id: string;
    name: string;
    role: string;
    salary: number;
    level: number;
  }>;
  driverContracts: Array<{
    id: string;
    driverName: string;
    series: string;
    salary: number;
    status: string;
  }>;
  upgrades: Array<{
    id: string;
    name: string;
    level: number;
    cost: number;
  }>;
};

export type EventSummary = {
  id: string;
  key: string;
  name: string;
  status: "SCHEDULED" | "LIVE" | "FINAL";
  startsAt: string;
  isCrownJewel: boolean;
  season: {
    id: string;
    key: string;
    name: string;
    year: number;
    series: string;
  };
};

export type EventLeaderboard = {
  event: {
    id: string;
    name: string;
    key: string;
    status: "SCHEDULED" | "LIVE" | "FINAL";
  };
  leaderboard: Array<{
    teamId: string;
    teamName: string;
    manager: string;
    managerEmail: string;
    points: number;
  }>;
};

export type AiHistoryMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  actions: Array<{
    type: string;
    summary: string;
    payload: Record<string, unknown>;
    allowed: boolean;
  }> | null;
  createdAt: string;
};

export const fetchPlayerState = async (): Promise<PlayerState> => {
  const response = await fetch(`${appConfig.apiOrigin}/player/state`, {
    headers: authHeaders()
  });

  return parseResponse<PlayerState>(response);
};

export const fetchEvents = async (): Promise<EventSummary[]> => {
  const response = await fetch(`${appConfig.apiOrigin}/events`, {
    headers: authHeaders()
  });

  const payload = await parseResponse<{ events: EventSummary[] }>(response);
  return payload.events;
};

export const submitRoster = async (
  teamId: string,
  eventId: string,
  salaryCap: number,
  items: Array<{ slot: "STARTER" | "BENCH" | "RESERVE"; driverName: string; salary: number }>
) => {
  const response = await fetch(`${appConfig.apiOrigin}/player/roster/submit`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ teamId, eventId, salaryCap, items })
  });

  return parseResponse(response);
};

export const submitPicks = async (
  teamId: string,
  eventId: string,
  picks: Array<{ pickType: string; pickValue: string; confidence: number }>
) => {
  const response = await fetch(`${appConfig.apiOrigin}/player/picks/submit`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ teamId, eventId, picks })
  });

  return parseResponse(response);
};

export const fetchEventLeaderboard = async (eventId: string): Promise<EventLeaderboard> => {
  const response = await fetch(`${appConfig.apiOrigin}/events/${eventId}/leaderboard`, {
    headers: authHeaders()
  });

  return parseResponse<EventLeaderboard>(response);
};

export const submitPitWallPrediction = async (
  eventId: string,
  teamId: string,
  predictionType: string,
  target: string,
  tokenCost?: number
) => {
  const response = await fetch(`${appConfig.apiOrigin}/events/${eventId}/pitwall/predict`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ teamId, predictionType, target, tokenCost })
  });

  return parseResponse(response);
};

export const fetchPitWallPredictions = async (eventId: string) => {
  const response = await fetch(`${appConfig.apiOrigin}/events/${eventId}/pitwall/predictions`, {
    headers: authHeaders()
  });

  return parseResponse<{
    predictions: Array<{
      id: string;
      predictionType: string;
      target: string;
      tokenCost: number;
      outcome: "PENDING" | "CORRECT" | "INCORRECT";
      createdAt: string;
      resolvedAt: string | null;
    }>;
  }>(response);
};

export const liveStreamUrl = (eventId: string): string => {
  const token = readToken();
  if (!token) {
    throw new Error("missing auth token");
  }

  const url = new URL(`${appConfig.apiOrigin}/events/${eventId}/live-stream`);
  url.searchParams.set("token", token);
  return url.toString();
};

export const fetchAiHistory = async (): Promise<AiHistoryMessage[]> => {
  const response = await fetch(`${appConfig.apiOrigin}/ai/history`, {
    headers: authHeaders()
  });

  const payload = await parseResponse<{ messages: AiHistoryMessage[] }>(response);
  return payload.messages;
};

export const sendAiMessage = async (message: string) => {
  const response = await fetch(`${appConfig.apiOrigin}/ai/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message })
  });

  return parseResponse<{
    provider: "local" | "openai";
    message: string;
    actions: Array<{
      type: string;
      summary: string;
      payload: Record<string, unknown>;
      allowed: boolean;
    }>;
  }>(response);
};

export const createLeague = async (name: string, code: string) => {
  const response = await fetch(`${appConfig.apiOrigin}/leagues`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, code })
  });

  return parseResponse(response);
};

export const joinLeague = async (code: string) => {
  const response = await fetch(`${appConfig.apiOrigin}/leagues/join`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ code })
  });

  return parseResponse(response);
};

export const fetchLeagueStandings = async (leagueId: string) => {
  const response = await fetch(`${appConfig.apiOrigin}/leagues/${leagueId}/standings`, {
    headers: authHeaders()
  });

  return parseResponse<{
    standings: Array<{ teamId: string; teamName: string; manager: string; email: string; points: number }>;
  }>(response);
};

export const fetchTeam = async (leagueId?: string): Promise<TeamDetail> => {
  const query = leagueId ? `?leagueId=${leagueId}` : "";
  const response = await fetch(`${appConfig.apiOrigin}/player/team${query}`, {
    headers: authHeaders()
  });

  return parseResponse<TeamDetail>(response);
};

export const hireStaff = async (teamId: string, name: string, role: string, salary: number) => {
  const response = await fetch(`${appConfig.apiOrigin}/player/team/staff/hire`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ teamId, name, role, salary })
  });

  return parseResponse(response);
};

export const signDriver = async (
  teamId: string,
  driverName: string,
  series: string,
  salary: number,
  buyoutFee?: number
) => {
  const response = await fetch(`${appConfig.apiOrigin}/player/team/drivers/sign`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ teamId, driverName, series, salary, buyoutFee })
  });

  return parseResponse(response);
};
