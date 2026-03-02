import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Container, Grid, Header, Label, Segment } from "semantic-ui-react";

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
              <Button as={Link} to="/league" color="orange" style={{ marginRight: "0.5rem" }}>
                Leagues
              </Button>
              <Button as={Link} to="/team" color="teal">
                Team Management
              </Button>
              <Button as={Link} to="/race-weekend" color="blue" style={{ marginLeft: "0.5rem" }}>
                Race Weekend
              </Button>
              <Button as={Link} to="/live" color="black" style={{ marginLeft: "0.5rem" }}>
                Live Pit Wall
              </Button>
              <Button as={Link} to="/ai-console" color="orange" style={{ marginLeft: "0.5rem" }}>
                Team AI Console
              </Button>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <Button basic color="orange" onClick={onLogout}>
                Sign out
              </Button>
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
