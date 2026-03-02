# System Architecture (MVP)

## Runtime Components
- `packages/ui`: browser SPA (React + Semantic UI)
- `services/api`: REST auth/game endpoints + websocket gateway (future milestones)
- `services/worker`: simulation/live ingestion and scheduled jobs
- `postgres`: source-of-truth relational data
- `redis`: live tick cache, rate limits, and transient leaderboard state

## Data Flow
1. Admin configures season/events and triggers run.
2. Worker provider emits normalized race events.
3. Scoring engine consumes normalized events and writes score ledger.
4. API serves dashboards/standings and pushes live updates.
5. AI console reads player state and emits advisory action proposals.
