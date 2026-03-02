import { useQuery } from "@tanstack/react-query";
import { Button, Container, Grid, Header, Label, Segment } from "semantic-ui-react";

import { fetchHealth } from "../lib/api";

export const LandingPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    staleTime: 10_000
  });

  return (
    <Container style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <Segment raised padded="very">
        <Label color="orange" ribbon>
          Season 0 Prototype
        </Label>
        <Header as="h1" style={{ marginTop: "1rem" }}>
          Paddock to Penthouse
        </Header>
        <p>
          Build your motorsport empire, dominate race-week fantasy, and win live pit-wall calls.
        </p>
        <Grid stackable columns={2}>
          <Grid.Column>
            <Header as="h3">Current Milestone</Header>
            <p>Monorepo scaffold, local runtime, and baseline API/UI connectivity.</p>
            <Button color="orange">Start Building</Button>
          </Grid.Column>
          <Grid.Column>
            <Header as="h3">API Status</Header>
            {isLoading && <p>Checking API health...</p>}
            {error && <Label color="red">Disconnected</Label>}
            {data && (
              <div>
                <Label color="green">{data.service} healthy</Label>
                <p style={{ marginTop: "0.5rem" }}>{new Date(data.timestamp).toLocaleString()}</p>
              </div>
            )}
          </Grid.Column>
        </Grid>
      </Segment>
    </Container>
  );
};
