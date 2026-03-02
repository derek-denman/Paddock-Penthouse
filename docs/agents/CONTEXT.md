# Agent Context

## Repository Status
- Branch policy enforced by convention: no direct development on `main`.
- Starting point was README-only; repo is now being scaffolded to a full monorepo.

## Tech Decisions
- Workspace package manager: `pnpm`.
- Frontend: React + TypeScript + Vite + Semantic UI React.
- Backend: Fastify + TypeScript + Prisma + Zod.
- Data: Postgres + Redis.
- Realtime transport: Socket.IO.
- Infra: AWS CDK TypeScript.

## Initial Milestone Focus
Milestone 0: repo scaffolding, local dockerized dev, baseline API/UI, shared package, DB migration, CI.
Milestone 1: auth and RBAC foundations are in place (local JWT login, Cognito token verification path, session callback UI).
Milestone 2: core game domain schema and player/admin CRUD endpoints are in place for leagues, teams, staffing, and contracts.
Milestone 3: scoring engine and settlement pipeline are in place with normalized event persistence and leaderboard APIs.

## Operational Defaults
- App should run locally even without cloud credentials.
- Local auth and SIM race modes are first-class development paths.

## Notes For Future Agents
- Prefer small PRs tied to a single milestone concern.
- Preserve deterministic simulation behavior for testing and demos.
- Keep docs current with environment variables and deployment steps.
