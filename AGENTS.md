# AGENTS

This file gives autonomous coding agents enough context to work safely and consistently in this repository.

## Product
- Name: `Paddock to Penthouse`
- Genre: fantasy motorsports + empire management + live pit-wall predictions.
- Current target: MVP Season 0 with F1-first support and deterministic SIM fallback.

## Branch and Commit Policy (Non-Negotiable)
- Never develop directly on `main`.
- Create a feature branch for each milestone or sub-feature.
- Use conventional commits with clear intent, e.g. `feat(auth): add cognito jwt verifier`.
- Include commit bodies when useful to explain design decisions and risk.
- Keep changes incremental; open PRs and merge only when checks are green.

## Codebase Layout
- `packages/ui`: React + TypeScript frontend.
- `services/api`: Fastify + TypeScript backend.
- `services/worker`: ingestion, simulation, scheduling, settlement jobs.
- `packages/common`: shared schemas, contracts, enums.
- `infra`: AWS CDK stacks.
- `docs/rules`: scoring, predictions, token economy.

## Runtime Modes
- Auth:
  - `AUTH_MODE=cognito` (production default)
  - `AUTH_MODE=local` (local fallback)
- Race data:
  - `RACE_DATA_MODE=SIM` (default)
  - `RACE_DATA_MODE=LIVE_WITH_SIM_FALLBACK`
- AI:
  - `AI_PROVIDER=local` (default)
  - `AI_PROVIDER=openai` (optional)

## Security Rules
- Enforce RBAC in backend; never trust the client for authorization.
- Validate all inputs with shared schemas.
- Never commit secrets.
- Keep `.env.example` updated as settings evolve.

## Local Development
- Primary flow: `./scripts/dev up`.
- Dependencies run in Docker (`postgres`, `redis`, `api`, `worker`, `ui`).
- Seed sample data with `./scripts/dev seed`.

## Delivery Expectations
- Maintain a playable SIM mode at all times.
- Ship polished, responsive UI for MVP pages.
- Keep tests and CI green before merging.

## Agent Handoff
- Update `docs/agents/CONTEXT.md` when making major architecture or workflow decisions.
- Update `docs/agents/MILESTONES.md` as milestones are completed.
