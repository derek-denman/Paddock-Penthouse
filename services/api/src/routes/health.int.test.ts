import { describe, expect, it } from "vitest";

import { buildApp } from "../app";

describe("GET /health", () => {
  it("returns healthy status", async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/paddock";
    process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json().ok).toBe(true);
  });
});
