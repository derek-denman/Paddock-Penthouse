# Paddock to Penthouse

A fantasy motorsports + empire management web game with live pit-wall predictions.

## Current Status
- Milestone 0 scaffold is in place.
- Milestone 1 auth foundation is in place (`/login`, `/auth/callback`, `/dashboard`, backend JWT verification, RBAC middleware).
- Milestone 2 domain foundation is in place (league create/join, team staffing/contracts, admin season/event tools).
- Milestone 3 scoring foundation is in place (normalized race event persistence, provisional ticks, deterministic settlement, event leaderboard API).
- Milestone 4 race weekend flow is in place (`/race-weekend`, roster submit, pre-race picks, salary-cap + lock checks).
- Milestone 5 live pit-wall flow is in place (`/live`, SSE live stream, strategy-token predictions, resolution into scoring ledger).
- Milestone 6 Team AI Console is in place (`/ai-console`, per-player chat history, guarded structured actions, optional OpenAI provider fallback to deterministic local assistant).
- Milestone 7 AWS deployment baseline is in place (CDK multi-stack network/data/auth/compute/web/observability).
- Milestone 8 F1 provider path is in place behind flags (`RACE_DATA_MODE=LIVE_WITH_SIM_FALLBACK`, `ENABLE_F1_LIVE=true`) with automatic SIM fallback.
- Local runtime works with `AUTH_MODE=local` and `RACE_DATA_MODE=SIM`.
- Production path is AWS-first (`AUTH_MODE=cognito` via Cognito + Google IdP).

## Repository Layout

```text
.
├── AGENTS.md
├── docs/
│   ├── agents/
│   ├── architecture/
│   ├── providers/
│   └── rules/
├── infra/
├── packages/
│   ├── common/
│   └── ui/
├── prisma/
├── scripts/
├── services/
│   ├── api/
│   └── worker/
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Architecture Diagram (MVP)

```text
Browser (React UI)
    |
    | HTTP + WebSocket
    v
API Service (Fastify)
    |\
    | \--> Redis (rate limits + live cache)
    |
    \----> Postgres (users, leagues, seasons, events, rosters, scores)

Worker Service (SIM/LIVE provider + scheduler)
    |
    +--> Normalized race events -> scoring pipeline -> Postgres/Redis

AWS Deployment Path
- CloudFront + S3 -> UI
- ECS Fargate -> API + Worker
- RDS Postgres
- ElastiCache Redis
- Cognito User Pool + Google IdP
- EventBridge schedules
```

## Branch and Commit Rules
- Do not develop on `main`.
- Use feature branches (example: `feat/auth-cognito`, `feat/scoring-engine`).
- Use conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- Open PRs for each milestone increment and merge only after green CI.

## Local Development

### Prerequisites
- Docker + Docker Compose
- Node.js 22+
- `corepack enable` (for pnpm)

### 1. Configure environment

```bash
cp .env.example .env
```

### 2. Start everything

```bash
./scripts/dev up
```

Services:
- UI: `http://localhost:5173`
- API: `http://localhost:4000`
- API Docs: `http://localhost:4000/docs`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

### 3. Seed sample data

```bash
./scripts/dev seed
```

This creates:
- Admin user from `OWNER_EMAIL`
- Sample league `SEASON0`
- Season 0
- Crown jewel named events (Monaco, Indy 500, Daytona 500, Le Mans 24)

### 4. Run validation locally

```bash
./scripts/dev test
```

## Auth Modes

### Production/default path (`AUTH_MODE=cognito`)
- Cognito User Pool issues JWTs.
- Google social login is configured in Cognito Hosted UI.
- Frontend login route redirects to Cognito Hosted UI; callback route validates OAuth `state` and restores session from `id_token`.

### Local fallback (`AUTH_MODE=local`)
- Local token path allows app usage without cloud secrets.
- Intended for development and CI only.
- Local login page at `/login` calls `POST /auth/local/login` and stores the returned JWT in browser local storage.

## How to Become Admin
- Set `OWNER_EMAIL` in `.env`.
- Run seed: `./scripts/dev seed`.
- User matching `OWNER_EMAIL` is upserted with `ADMIN` role.

## How to Add Google OAuth Secrets (Cognito)
1. Create Google OAuth Web client in Google Cloud Console.
2. Add Cognito hosted UI callback URL and logout URL.
3. Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in AWS Secrets Manager.
4. Configure Cognito User Pool social IdP with those values.
5. Set deployment env vars:
   - `COGNITO_REGION`
   - `COGNITO_USER_POOL_ID`
   - `COGNITO_APP_CLIENT_ID`
   - `COGNITO_DOMAIN`
   - `COGNITO_REDIRECT_URI`
   - `COGNITO_LOGOUT_URI`
6. Frontend env vars for Hosted UI redirect:
   - `VITE_AUTH_MODE=cognito`
   - `VITE_COGNITO_DOMAIN`
   - `VITE_COGNITO_CLIENT_ID`
   - `VITE_COGNITO_REDIRECT_URI`

## AWS Deploy (CDK)

### Bootstrap (per account/region)

```bash
cd infra
pnpm install
pnpm cdk bootstrap
```

### Deploy dev

```bash
cd infra
# Optional config overrides:
# export APP_PREFIX=paddock-penthouse
# export COGNITO_DOMAIN_PREFIX=paddock-penthouse-dev-yourorg
DEPLOY_ENV=dev pnpm cdk deploy
```

### Deploy prod

```bash
cd infra
DEPLOY_ENV=prod pnpm cdk deploy
```

### Stack Topology
- `*-network-*`: VPC and subnet layout
- `*-data-*`: Postgres (RDS), Redis (ElastiCache), DB secret and security groups
- `*-auth-*`: Cognito user pool/client/domain
- `*-compute-*`: ECS cluster and Fargate service scaffolding for API + worker
- `*-web-*`: S3 + CloudFront for frontend hosting
- `*-observability-*`: log groups and baseline alarm resources

## Rules and Gameplay Docs
- Scoring tables: `docs/rules/scoring.md`
- Prediction types: `docs/rules/predictions.md`
- Token economy: `docs/rules/token-economy.md`

## CI
GitHub Actions workflow runs on PRs and main pushes:
- lint
- typecheck
- unit tests
- integration tests
- build

## Roadmap
- Milestone 0: scaffolding + tooling + docker + baseline schema + CI
- Milestone 1: auth/accounts/RBAC/admin bootstrap
- Milestone 2: domain models + admin CRUD
- Milestone 3: scoring + normalization + settlement
- Milestone 4: race weekend UX
- Milestone 5: realtime SIM pit-wall mode
- Milestone 6: Team AI Console
- Milestone 7: AWS deploy hardening
- Milestone 8: F1 live provider behind feature flag
