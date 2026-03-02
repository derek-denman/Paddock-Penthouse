import { SignJWT, jwtVerify } from "jose";

import type { Role, VerifiedIdentity } from "./types";

const alg = "HS256";

const buildSecret = (jwtSecret: string) => new TextEncoder().encode(jwtSecret);

type LocalTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  provider: "local";
};

export const signLocalToken = async (payload: LocalTokenPayload, jwtSecret: string) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(buildSecret(jwtSecret));
};

export const verifyLocalToken = async (token: string, jwtSecret: string): Promise<VerifiedIdentity> => {
  const { payload } = await jwtVerify(token, buildSecret(jwtSecret), {
    algorithms: [alg]
  });

  const subject = payload.sub;
  const email = payload.email;
  const displayName = payload.name;

  if (typeof subject !== "string" || typeof email !== "string" || typeof displayName !== "string") {
    throw new Error("invalid local token payload");
  }

  return {
    subject,
    email,
    displayName,
    provider: "local"
  };
};
