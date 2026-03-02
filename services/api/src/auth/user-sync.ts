import { prisma } from "../db/prisma";
import type { ApiEnv } from "../config/env";
import type { Role, VerifiedIdentity } from "./types";

const shouldPromoteToAdmin = (identity: VerifiedIdentity, env: ApiEnv): boolean => {
  return env.ENABLE_ADMIN_BOOTSTRAP && identity.email.toLowerCase() === env.OWNER_EMAIL.toLowerCase();
};

export const syncUserFromIdentity = async (identity: VerifiedIdentity, env: ApiEnv) => {
  const adminBootstrap = shouldPromoteToAdmin(identity, env);
  const role: Role = adminBootstrap ? "ADMIN" : "PLAYER";

  const user = await prisma.user.upsert({
    where: {
      email: identity.email
    },
    update: {
      displayName: identity.displayName,
      role: adminBootstrap ? "ADMIN" : undefined,
      cognitoSub: identity.provider === "cognito" ? identity.subject : undefined,
      lastLoginAt: new Date()
    },
    create: {
      email: identity.email,
      displayName: identity.displayName,
      role,
      cognitoSub: identity.provider === "cognito" ? identity.subject : null,
      lastLoginAt: new Date()
    }
  });

  return {
    userId: user.id,
    email: user.email,
    role: user.role as Role
  };
};
