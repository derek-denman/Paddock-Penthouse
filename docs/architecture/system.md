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
3. Worker persists normalized events to `NormalizedRaceEvent`.
4. Scoring engine applies provisional lap ticks and writes `ScoreLedger`.
5. On race completion, settlement writes official score entries (crown jewel rules included).
6. API serves dashboards/standings and pushes live updates.
7. AI console reads player state and emits advisory action proposals.
