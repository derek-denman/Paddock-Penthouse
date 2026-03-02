import type { FastifyReply, FastifyRequest } from "fastify";

export type AuthContext = {
  userId: string;
  email: string;
  role: "PLAYER" | "ADMIN";
};

const parseAuthorizationHeader = (request: FastifyRequest): string | null => {
  const header = request.headers.authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

export const authenticateLocal = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = parseAuthorizationHeader(request);

  if (!token) {
    return reply.unauthorized("missing auth token");
  }

  // Milestone 0 local stub: token format local:<userId>:<email>:<role>
  if (!token.startsWith("local:")) {
    return reply.unauthorized("invalid local token format");
  }

  const [, userId, email, role] = token.split(":");
  if (!userId || !email || !role) {
    return reply.unauthorized("invalid local token payload");
  }

  (request as FastifyRequest & { auth?: AuthContext }).auth = {
    userId,
    email,
    role: role === "ADMIN" ? "ADMIN" : "PLAYER"
  };
};
