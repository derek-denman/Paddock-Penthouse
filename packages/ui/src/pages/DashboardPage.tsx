import { Button, Container, Grid, Header, Label, Segment } from "semantic-ui-react";

import type { SessionUser } from "../lib/auth";

type DashboardPageProps = {
  user: SessionUser;
  onLogout: () => void;
};

export const DashboardPage = ({ user, onLogout }: DashboardPageProps) => {
  return (
    <Container style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <Grid stackable columns={2}>
        <Grid.Column>
          <Segment padded="very" raised>
            <Header as="h2">Player Dashboard</Header>
            <p>{user.email}</p>
            <Label color={user.role === "ADMIN" ? "red" : "blue"}>{user.role}</Label>
            <div style={{ marginTop: "1rem" }}>
              <Button color="orange" onClick={onLogout}>
                Sign out
              </Button>
            </div>
          </Segment>
        </Grid.Column>
        <Grid.Column>
          <Segment padded="very">
            <Header as="h3">Season 0 Snapshot</Header>
            <p>Empire, league, race weekend, and live pit wall modules are in progress.</p>
          </Segment>
        </Grid.Column>
      </Grid>
    </Container>
  );
};
