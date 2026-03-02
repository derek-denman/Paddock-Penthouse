export const appConfig = {
  apiOrigin: import.meta.env.VITE_API_ORIGIN ?? "http://localhost:4000",
  authMode: import.meta.env.VITE_AUTH_MODE ?? "local",
  cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN ?? "",
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
  cognitoRedirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI ?? "http://localhost:5173/auth/callback"
};
