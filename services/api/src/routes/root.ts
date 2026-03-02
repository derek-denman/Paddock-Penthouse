import type { FastifyInstance } from "fastify";

export async function rootRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return {
      name: "Paddock to Penthouse API",
      version: "0.1.0"
    };
  });
}
