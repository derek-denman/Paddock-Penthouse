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

export const fetchPlayerState = async (): Promise<PlayerState> => {
  const response = await fetch(`${appConfig.apiOrigin}/player/state`, {
    headers: authHeaders()
  });

  return parseResponse<PlayerState>(response);
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
