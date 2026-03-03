import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import type { SessionUser } from "../lib/auth";
import { fetchEvents, fetchPlayerState, fetchTeam } from "../lib/game";
import "../styles/dashboard-shell.css";

type DashboardPageProps = {
  user: SessionUser;
  onLogout: () => void;
};

export const DashboardPage = ({ user, onLogout }: DashboardPageProps) => {
  const stateQuery = useQuery({
    queryKey: ["player-state"],
    queryFn: fetchPlayerState
  });

  const primaryTeam = stateQuery.data?.teams[0];

  const teamQuery = useQuery({
    queryKey: ["team-detail", primaryTeam?.league.id],
    queryFn: () => fetchTeam(primaryTeam?.league.id),
    enabled: Boolean(primaryTeam?.league.id)
  });

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents
  });

  const sortedUpcomingEvents =
    eventsQuery.data
      ?.filter((event) => event.status !== "FINAL")
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()) ?? [];
  const nextEvent = sortedUpcomingEvents[0];

  const membershipsCount = stateQuery.data?.memberships.length ?? 0;
  const teamsManaged = stateQuery.data?.teams.length ?? 0;
  const displayName = stateQuery.data?.profile.displayName ?? user.email.split("@")[0];

  const teamDetail = teamQuery.data;
  const funds = teamDetail?.funds ?? primaryTeam?.funds ?? 0;
  const strategyTokens = teamDetail?.strategyTokens ?? primaryTeam?.strategyTokens ?? 0;
  const driverCount = teamDetail?.driverContracts.length ?? 0;
  const staffCount = teamDetail?.staffMembers.length ?? 0;
  const hasLeague = membershipsCount > 0;
  const hasTeam = teamsManaged > 0;
  const teamBuildComplete = hasTeam && driverCount >= 3 && staffCount >= 1;
  const racePrepComplete = teamBuildComplete && strategyTokens >= 3;
  const completedSteps = [hasLeague, teamBuildComplete, racePrepComplete].filter(Boolean).length;
  const progressPct = Math.round((completedSteps / 3) * 100);

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
  const eventDate = nextEvent
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(nextEvent.startsAt))
    : "Schedule pending";

  const onboardingSteps = [
    {
      title: "Join your first league",
      detail: hasLeague
        ? `You're in ${membershipsCount} league${membershipsCount > 1 ? "s" : ""}.`
        : "Create a private league or join with a league code.",
      status: hasLeague ? "complete" : "active",
      href: "/league",
      action: hasLeague ? "Manage Leagues" : "Join or Create"
    },
    {
      title: "Build your team core",
      detail: hasTeam
        ? `${driverCount} drivers and ${staffCount} staff signed.`
        : "Sign drivers and hire at least one staff member.",
      status: teamBuildComplete ? "complete" : hasLeague ? "active" : "pending",
      href: "/team",
      action: hasTeam ? "Edit Team" : "Build Team"
    },
    {
      title: "Prep your first race",
      detail: nextEvent
        ? `Set lineup and picks for ${nextEvent.name}.`
        : "Race weekend will unlock when events are published.",
      status: racePrepComplete ? "complete" : hasTeam ? "active" : "pending",
      href: "/race-weekend",
      action: "Set Race Plan"
    }
  ] as const;

  const quickActions = [
    {
      title: "League Hub",
      body: "Create a league or join with a code.",
      href: "/league",
      cta: "Open League Hub"
    },
    {
      title: "Team Builder",
      body: "Sign drivers, hire staff, and manage contracts.",
      href: "/team",
      cta: "Build Team"
    },
    {
      title: "Race Weekend",
      body: "Lock your roster and pre-race predictions.",
      href: "/race-weekend",
      cta: "Prep Race"
    },
    {
      title: "Team AI Console",
      body: "Ask for strategy, risk checks, and lineup ideas.",
      href: "/ai-console",
      cta: "Open AI Console"
    }
  ] as const;

  return (
    <div className="cb-dashboard">
      <aside className="cb-sidebar">
        <div className="cb-brand">
          <span className="cb-brand-mark">P</span>
          <div>
            <p className="cb-brand-title">Paddock</p>
            <p className="cb-brand-subtitle">Season 0</p>
          </div>
        </div>

        <nav className="cb-nav">
          <Link className="cb-nav-item is-active" to="/dashboard">
            Overview
          </Link>
          <Link className="cb-nav-item" to="/league">
            League Hub
          </Link>
          <Link className="cb-nav-item" to="/team">
            Team Builder
          </Link>
          <Link className="cb-nav-item" to="/race-weekend">
            Race Weekend
          </Link>
          <Link className="cb-nav-item" to="/live">
            Live Pit Wall
          </Link>
          <Link className="cb-nav-item" to="/ai-console">
            Team AI Console
          </Link>
        </nav>

        <button type="button" className="cb-signout" onClick={onLogout}>
          Sign out
        </button>
      </aside>

      <main className="cb-main">
        <header className="cb-topbar">
          <div>
            <p className="cb-page-eyebrow">Mission Control</p>
            <h1>Player Dashboard</h1>
          </div>
          <div className="cb-account">
            <div className="cb-account-chip">{user.role}</div>
            <p>{user.email}</p>
          </div>
        </header>

        <section className="cb-hero">
          <article className="cb-card cb-hero-card">
            <p className="cb-kicker">Welcome back</p>
            <h2>{displayName}</h2>
            <p className="cb-muted">
              Follow the quick-start plan below to get race-ready: join a league, build your lineup core, and lock
              first-race picks.
            </p>
            <div className="cb-progress-row">
              <div>
                <p className="cb-progress-label">Onboarding progress</p>
                <p className="cb-progress-value">
                  {completedSteps}/3 steps complete
                </p>
              </div>
              <div className="cb-progress-track" aria-hidden>
                <span style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </article>

          <article className="cb-card cb-stat-grid">
            <div>
              <p className="cb-stat-label">Team Funds</p>
              <p className="cb-stat-value">{currency.format(funds)}</p>
            </div>
            <div>
              <p className="cb-stat-label">Strategy Tokens</p>
              <p className="cb-stat-value">{strategyTokens}</p>
            </div>
            <div>
              <p className="cb-stat-label">Drivers Signed</p>
              <p className="cb-stat-value">{driverCount}</p>
            </div>
            <div>
              <p className="cb-stat-label">Next Race</p>
              <p className="cb-stat-value cb-stat-race">{nextEvent?.name ?? "TBD"}</p>
              <p className="cb-muted cb-compact">{eventDate}</p>
            </div>
          </article>
        </section>

        <section className="cb-grid-2">
          <article className="cb-card">
            <div className="cb-card-head">
              <h3>First Race Quick Start</h3>
              <span className="cb-pill">{progressPct}% complete</span>
            </div>
            <ol className="cb-checklist">
              {onboardingSteps.map((step) => (
                <li key={step.title} className={`cb-step cb-step-${step.status}`}>
                  <div className="cb-step-status" aria-hidden>
                    {step.status === "complete" ? "Y" : step.status === "active" ? "!" : "-"}
                  </div>
                  <div className="cb-step-body">
                    <p className="cb-step-title">{step.title}</p>
                    <p className="cb-muted">{step.detail}</p>
                  </div>
                  <Link className="cb-link-button" to={step.href}>
                    {step.action}
                  </Link>
                </li>
              ))}
            </ol>
          </article>

          <article className="cb-card">
            <div className="cb-card-head">
              <h3>Race Readiness</h3>
              <span className="cb-pill is-blue">{nextEvent?.status ?? "SCHEDULED"}</span>
            </div>

            {stateQuery.isLoading ? <p className="cb-muted">Loading your team state...</p> : null}
            {stateQuery.isError ? <p className="cb-error">Unable to load player state right now.</p> : null}

            <div className="cb-readiness-list">
              <div>
                <p className="cb-stat-label">League membership</p>
                <p className="cb-readiness-value">{hasLeague ? "Ready" : "Action needed"}</p>
              </div>
              <div>
                <p className="cb-stat-label">Team core</p>
                <p className="cb-readiness-value">{teamBuildComplete ? "Ready" : "Add drivers/staff"}</p>
              </div>
              <div>
                <p className="cb-stat-label">Upcoming event</p>
                <p className="cb-readiness-value">{nextEvent?.name ?? "No race scheduled yet"}</p>
              </div>
            </div>

            <Link className="cb-primary-cta" to="/race-weekend">
              Open Race Weekend Planner
            </Link>
          </article>
        </section>

        <section className="cb-card">
          <div className="cb-card-head">
            <h3>What to do next</h3>
          </div>
          <div className="cb-action-grid">
            {quickActions.map((action) => (
              <Link key={action.title} className="cb-action-tile" to={action.href}>
                <p className="cb-action-title">{action.title}</p>
                <p className="cb-muted">{action.body}</p>
                <span>{action.cta}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
