export type Role = "PLAYER" | "ADMIN";

export type VerifiedIdentity = {
  subject: string;
  email: string;
  displayName: string;
  provider: "local" | "cognito";
};

export type AuthContext = {
  userId: string;
  email: string;
  role: Role;
};
