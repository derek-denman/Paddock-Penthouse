import { appConfig } from "./config";

export type SessionUser = {
  userId: string;
  email: string;
  role: "PLAYER" | "ADMIN";
};

const TOKEN_KEY = "p2p_access_token";
const OAUTH_STATE_KEY = "p2p_oauth_state";

export const readToken = () => localStorage.getItem(TOKEN_KEY);

export const writeToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const beginCognitoGoogleLogin = () => {
  if (!appConfig.cognitoDomain || !appConfig.cognitoClientId) {
    throw new Error("Cognito configuration missing");
  }

  const state = crypto.randomUUID();
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const authorizeUrl = new URL(`${appConfig.cognitoDomain}/oauth2/authorize`);
  authorizeUrl.searchParams.set("identity_provider", "Google");
  authorizeUrl.searchParams.set("response_type", "token");
  authorizeUrl.searchParams.set("client_id", appConfig.cognitoClientId);
  authorizeUrl.searchParams.set("redirect_uri", appConfig.cognitoRedirectUri);
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);

  window.location.href = authorizeUrl.toString();
};

export const consumeCallbackToken = (): string => {
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);

  const receivedState = params.get("state");
  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);

  if (!receivedState || !expectedState || receivedState !== expectedState) {
    throw new Error("invalid OAuth state");
  }

  const token = params.get("id_token");
  if (!token) {
    throw new Error("id_token missing from callback");
  }

  writeToken(token);
  return token;
};

export const loginLocal = async (email: string, displayName: string): Promise<SessionUser> => {
  const response = await fetch(`${appConfig.apiOrigin}/auth/local/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ email, displayName })
  });

  if (!response.ok) {
    throw new Error("local login failed");
  }

  const payload = (await response.json()) as { token: string; user: SessionUser };
  writeToken(payload.token);
  return payload.user;
};

export const fetchSessionUser = async (): Promise<SessionUser | null> => {
  const token = readToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${appConfig.apiOrigin}/auth/me`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    clearToken();
    return null;
  }

  if (!response.ok) {
    throw new Error("unable to restore session");
  }

  return response.json() as Promise<SessionUser>;
};
