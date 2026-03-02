import type { FastifyInstance } from "fastify";

import { authenticate, requireAdmin } from "../middleware/auth";

export async function adminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/health",
    {
      preHandler: [authenticate, requireAdmin]
    },
    async () => {
      return {
        ok: true,
        scope: "admin"
      };
    }
  );
}
