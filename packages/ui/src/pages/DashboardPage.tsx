import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Container, Grid, Header, Label, Segment } from "semantic-ui-react";

import type { SessionUser } from "../lib/auth";
import { fetchPlayerState } from "../lib/game";

type DashboardPageProps = {
  user: SessionUser;
  onLogout: () => void;
};

export const DashboardPage = ({ user, onLogout }: DashboardPageProps) => {
  const stateQuery = useQuery({
    queryKey: ["player-state"],
    queryFn: fetchPlayerState
  });

  return (
    <Container style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <Grid stackable columns={2}>
        <Grid.Column>
          <Segment padded="very" raised>
            <Header as="h2">Player Dashboard</Header>
            <p>{user.email}</p>
            <Label color={user.role === "ADMIN" ? "red" : "blue"}>{user.role}</Label>
            <div style={{ marginTop: "1rem" }}>
              <Link className="ui orange button" to="/league" style={{ marginRight: "0.5rem" }}>
                Leagues
              </Link>
              <Link className="ui teal button" to="/team">
                Team Management
              </Link>
              <Link className="ui blue button" to="/race-weekend" style={{ marginLeft: "0.5rem" }}>
                Race Weekend
              </Link>
              <Link className="ui black button" to="/live" style={{ marginLeft: "0.5rem" }}>
                Live Pit Wall
              </Link>
              <Link className="ui orange button" to="/ai-console" style={{ marginLeft: "0.5rem" }}>
                Team AI Console
              </Link>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <button type="button" className="ui basic orange button" onClick={onLogout}>
                Sign out
              </button>
            </div>
          </Segment>
        </Grid.Column>
        <Grid.Column>
          <Segment padded="very">
            <Header as="h3">Season 0 Snapshot</Header>
            {stateQuery.isLoading && <p>Loading state...</p>}
            {stateQuery.data && (
              <>
                <p>Display Name: {stateQuery.data.profile.displayName}</p>
                <p>Leagues Joined: {stateQuery.data.memberships.length}</p>
                <p>Teams Managed: {stateQuery.data.teams.length}</p>
              </>
            )}
          </Segment>
        </Grid.Column>
      </Grid>
    </Container>
  );
};
