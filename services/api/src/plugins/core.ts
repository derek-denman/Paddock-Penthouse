import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(async (app: FastifyInstance) => {
  await app.register(sensible);
  await app.register(cors, {
    origin: true,
    credentials: true
  });
  await app.register(helmet, {
    contentSecurityPolicy: false
  });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Paddock to Penthouse API",
        version: "0.1.0"
      }
    }
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs"
  });
});
