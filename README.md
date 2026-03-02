# Paddock to Penthouse 🏁
**A fantasy + management motorsports game where you build a multi-series racing empire.**

You’re not just picking drivers — you’re running a motorsport holding company. Raise funds, hire elite staff, sign drivers across multiple series (F1, NASCAR, IndyCar, WEC, IMSA), and score points through results, championships, crown jewels, pit-lane mastery, and breaking-news events.

> **Working title:** Paddock to Penthouse  
> **Genre:** Fantasy sports + empire management + live “pit wall” predictions  
> **Platform target:** Web (API + realtime frontend), mobile-friendly UI later

---

## Table of Contents
- [Vision](#vision)
- [Core Gameplay Loop](#core-gameplay-loop)
- [Scoring Overview](#scoring-overview)
- [Crown Jewels](#crown-jewels)
- [News & Events](#news--events)
- [Live Race Mode: Pit Wall Decisions](#live-race-mode-pit-wall-decisions)
- [Backend & Data](#backend--data)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Legal / Disclaimers](#legal--disclaimers)

---

## Vision
**Build a motorsports empire** by making smart portfolio decisions across series and mastering the “game within the game”:

- **Long-term:** funding, contracts, staff hires, scouting, prestige  
- **Weekly:** fantasy rosters, salary cap markets, pre-race picks  
- **Live:** limited-time “Pit Wall” calls during races (pit cycles, cautions, undercuts)  
- **Meta:** news and penalties that swing value and scoring opportunities  

The goal is to feel like a team owner + strategist, **without pretending you control real-world race outcomes**. Your empire improves your *ability to score by being right* (multipliers, intel windows, prediction tokens), not the cars.

---

## Core Gameplay Loop

### 1) Build your empire (always-on metagame)
- **Raise funds:** sponsors, investors, merch, manufacturer partnerships, content deals
- **Hire staff:** team principal, race engineer, strategist, pit crew coach, talent scout, legal/compliance
- **Sign drivers across series:** contracts with clauses (bonuses, buyouts, cross-series options, morale riders)
- **Choose a portfolio strategy:**
  - **Crown Jewel Hunter** (big event multipliers)
  - **Consistency Fund** (steady points, low volatility)
  - **Chaos Trader** (profits from news swings & underdogs)

### 2) Race-week fantasy (pre-race)
Submit for each race:
- **Active roster:** starters + bench + 1 reserve (injury/DNF protection)
- **Budget cap:** driver/staff “salaries” change with performance + news
- **Pre-race picks:** pole, podium, top-10, manufacturer/team matchups, etc.

### 3) Live race mode (during race)
Use limited **Strategy Tokens** to make time-sensitive calls during:
- pit cycles
- cautions/restarts
- tire strategy shifts
- stint/traffic management (endurance)

### 4) Post-race (settlement + upgrades)
- Score results and finalize leaderboards
- Apply news impacts & penalties
- Reinvest funds, renegotiate contracts, plan next weekend

---

## Scoring Overview
Scoring is designed to reward motorsports realities: execution, strategy, and momentum.

### Base scoring (all series)
- **Finish position points** (scaled by series + field size)
- **Bonuses:** win, podium, pole, fastest lap, stage wins (where applicable)
- **Risk penalties:** DNFs, major penalties, DSQs

### Pit lane scoring (signature feature)
- **Fastest pit stop** (team/crew unit award)
- **Most positions gained through pit cycle**
- **Undercut/overcut mastery:** bonus if your call correctly predicts a successful net position gain
- Optional: **Pit error** penalty (unsafe release, speeding, stop-go)

### Championships & season-long value
- **Championship points** accumulate across weeks
- **Team/driver “assets” appreciate/depreciate** based on performance, contracts, and news

> Exact point tables will live in `/docs/rules/` (WIP).

---

## Crown Jewels
Crown jewels are special events with unique scoring flavors and multipliers.

Examples:
- **Monaco GP** (qualifying/pole emphasis, precision bonuses)
- **Indy 500** (qualifying + pit execution + late-race calls)
- **Daytona 500** (volatility scoring, restart predictions)
- **Le Mans 24** (stint strategy + reliability + traffic calls)
- **Rolex 24 / Sebring** (multi-class pit windows + consistency rewards)

Crown jewels can award:
- **Event multipliers**
- **Prestige trophies** (empire progression)
- **Legacy perks** (e.g., +1 Strategy Token cap at future crown jewels)

---

## News & Events
A weekly “news engine” generates structured events that affect:
- salaries (market movement)
- morale/chemistry
- temporary scoring modifiers

Examples:
- Key talent hired/poached → boosts pit-cycle predictions
- Team fined/penalized → temporary scoring drag
- Driver injury → reserve system matters
- Regulation/BOP changes (endurance) → risk flags

News events can be sourced from:
- official releases
- licensed data partners
- curated feeds
- manual admin inputs (for MVP)

---

## Live Race Mode: Pit Wall Decisions
During races you get a limited number of **Strategy Tokens** to spend on “calls”.  
Tokens are scarce — timing matters more than quantity.

Example call types:
- **Caution window:** “Caution in next 10 laps?”
- **Pit window:** “Will Car X pit before lap N?”
- **Undercut:** “Will Driver Y gain net position after pit cycle?”
- **Restart outcome:** “Who leads at the next timing loop after restart?”
- **Pit crew:** “Fastest stop this stage/hour?”
- **Pit gain:** “Most positions gained through pit sequence this segment?”

Your staff and upgrades can unlock:
- earlier/longer decision windows
- better multipliers
- reduced penalties for “misses”
- extra “insurance” (e.g., once per race, cancel a call)

---

## Backend & Data
The server ingests schedule/results/news plus (optionally) live race timing, normalizes it, and streams realtime updates to clients.

### Architecture (target)
- **Ingestion workers** (per series/provider)
- **Normalization layer** → one unified event model
- **Scoring engine**
  - realtime “tick” scoring (unofficial)
  - post-race reconciliation (official settlement)
- **Game API** (rosters, contracts, marketplace, leaderboards)
- **Realtime gateway** (WebSockets or SSE)
- **News engine** (headlines → structured impact cards)

### Storage (typical stack)
- **Postgres** (source of truth)
- **Redis** (live state + leaderboards)
- **Queue/event bus** (Kafka / NATS / SQS)
- **Object storage** (raw provider payloads for auditing/replays)

> **Note:** Live timing feeds often require explicit licensing/terms. This repo is designed to support licensed providers and/or official integrations.

---

## Repository Layout
> This is the intended structure (some folders may be empty early on).

```
.
├── docs/
│   ├── rules/                 # scoring tables, token economy, league formats
│   ├── architecture/          # diagrams, event model, ingestion design
│   └── providers/             # provider notes, normalization mapping
├── services/
│   ├── api/                   # REST/GraphQL API
│   ├── realtime/              # websockets/SSE gateway
│   ├── scoring/               # scoring engine
│   ├── ingestion/             # feed + live timing ingestion
│   └── news/                  # news parsing + impact cards
├── packages/
│   ├── common/                # shared types, schemas, utilities
│   └── ui/                    # frontend web app (optional)
├── scripts/                   # dev scripts, seeders
└── docker-compose.yml         # local dev dependencies
```

---

## Getting Started
### Prerequisites
- Docker (recommended)
- Node.js / Python / Go (TBD by implementation)
- A `.env` file for local configuration

### Configure
Create a `.env` (example keys):
- `DATABASE_URL=`
- `REDIS_URL=`
- `JWT_SECRET=`
- `PROVIDER_API_KEY_*=` (if using licensed providers)
- `NEWS_FEED_URLS=` (comma-separated)

### Run locally (placeholder)
```bash
# Start dependencies
docker compose up -d

# Install and run services (varies by implementation)
# e.g., pnpm install && pnpm dev
```

> Setup instructions will be updated as the codebase solidifies.

---

## Roadmap

### MVP (Season 0)
- Single-series support (start with one)
- Roster + salary cap market
- Weekly scoring + leaderboards
- Live “Pit Wall” prompts (5 call types)
- Basic news cards (manual or semi-automated)

### Season 1
- Multi-series (add 1–2 more)
- Staff hiring & contract clauses
- Pit lane scoring (fastest stop, pit-cycle gains)
- Crown jewel multipliers + trophies

### Season 2
- Endurance deep features (stints, traffic, reliability)
- Alliance “War Room” teams and shared intel slots
- Admin tools + moderation + anti-cheat
- Provider licensing/integration hardening

---

## Contributing
Contributions welcome — especially in:
- data modeling & normalization
- scoring design (fun + fair)
- realtime event pipelines
- UX for live prediction flow
- testing + replay tools for race events

Suggested workflow:
1. Open an issue describing your change
2. Create a branch (`feature/...`)
3. Submit a PR with clear notes and tests where practical

---

## Legal / Disclaimers
- This project is **not affiliated with** any motorsports sanctioning body, series, teams, or drivers.
- Names like “F1”, “NASCAR”, “IndyCar”, “IMSA”, “WEC” may be trademarks of their respective owners.
- Any live timing/data integrations must follow the terms of the data provider and/or rights holders.
- This repository focuses on game mechanics and an integration-ready architecture.

---

## Status
🚧 Early-stage design + prototyping.  
If you’re here to help shape the rules, start in:
- `docs/rules/`
- `docs/architecture/`
- `docs/providers/`

Let’s build something that feels like standing on the pit wall.
