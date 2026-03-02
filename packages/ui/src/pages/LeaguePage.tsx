import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Container, Form, Grid, Header, Message, Segment, Table } from "semantic-ui-react";

import { createLeague, fetchLeagueStandings, fetchPlayerState, joinLeague } from "../lib/game";

export const LeaguePage = () => {
  const [createName, setCreateName] = useState("Season 0 Challengers");
  const [createCode, setCreateCode] = useState("CHAL2026");
  const [joinCode, setJoinCode] = useState("SEASON0");
  const [error, setError] = useState<string | null>(null);

  const stateQuery = useQuery({
    queryKey: ["player-state"],
    queryFn: fetchPlayerState
  });

  const selectedLeagueId = useMemo(() => stateQuery.data?.memberships[0]?.league.id, [stateQuery.data]);

  const standingsQuery = useQuery({
    queryKey: ["league-standings", selectedLeagueId],
    queryFn: () => fetchLeagueStandings(selectedLeagueId ?? ""),
    enabled: Boolean(selectedLeagueId)
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; code: string }) => createLeague(payload.name, payload.code),
    onSuccess: () => {
      setError(null);
      void stateQuery.refetch();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "create failed")
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinLeague(code),
    onSuccess: () => {
      setError(null);
      void stateQuery.refetch();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "join failed")
  });

  const handleCreateLeague = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({ name: createName, code: createCode.toUpperCase() });
  };

  const handleJoinLeague = (event: FormEvent) => {
    event.preventDefault();
    joinMutation.mutate(joinCode.toUpperCase());
  };

  return (
    <Container style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <Header as="h2">Leagues</Header>
      <p>
        Manage league membership and standings. Return to <Link to="/dashboard">dashboard</Link>.
      </p>

      {error && <Message negative>{error}</Message>}

      <Grid stackable columns={2}>
        <Grid.Column>
          <Segment padded="very" raised>
            <Header as="h3">Create League</Header>
            <Form onSubmit={handleCreateLeague}>
              <Form.Input value={createName} onChange={(e) => setCreateName(e.target.value)} label="League Name" required />
              <Form.Input
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                label="Invite Code"
                required
              />
              <Button type="submit" color="orange" loading={createMutation.isPending}>
                Create
              </Button>
            </Form>
          </Segment>
        </Grid.Column>
        <Grid.Column>
          <Segment padded="very">
            <Header as="h3">Join League</Header>
            <Form onSubmit={handleJoinLeague}>
              <Form.Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                label="Invite Code"
                required
              />
              <Button type="submit" color="blue" loading={joinMutation.isPending}>
                Join
              </Button>
            </Form>
          </Segment>
        </Grid.Column>
      </Grid>

      <Segment style={{ marginTop: "1.5rem" }}>
        <Header as="h3">My Memberships</Header>
        {stateQuery.isLoading && <p>Loading memberships...</p>}
        {stateQuery.data && stateQuery.data.memberships.length === 0 && <p>No leagues joined yet.</p>}
        {stateQuery.data && stateQuery.data.memberships.length > 0 && (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>League</Table.HeaderCell>
                <Table.HeaderCell>Code</Table.HeaderCell>
                <Table.HeaderCell>Role</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {stateQuery.data.memberships.map((membership) => (
                <Table.Row key={membership.league.id}>
                  <Table.Cell>{membership.league.name}</Table.Cell>
                  <Table.Cell>{membership.league.code}</Table.Cell>
                  <Table.Cell>{membership.role}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Segment>

      <Segment>
        <Header as="h3">Standings</Header>
        {standingsQuery.isLoading && <p>Loading standings...</p>}
        {standingsQuery.data && (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Team</Table.HeaderCell>
                <Table.HeaderCell>Manager</Table.HeaderCell>
                <Table.HeaderCell>Points</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {standingsQuery.data.standings.map((entry) => (
                <Table.Row key={entry.teamId}>
                  <Table.Cell>{entry.teamName}</Table.Cell>
                  <Table.Cell>{entry.manager}</Table.Cell>
                  <Table.Cell>{entry.points}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Segment>
    </Container>
  );
};
