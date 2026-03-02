import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Container,
  Form,
  Grid,
  Header,
  Label,
  Message,
  Segment,
  Table
} from "semantic-ui-react";

import {
  fetchEvents,
  fetchPitWallPredictions,
  fetchTeam,
  liveStreamUrl,
  submitPitWallPrediction,
  type EventLeaderboard
} from "../lib/game";

const predictionTypes = [
  "CAUTION_WINDOW",
  "PIT_WINDOW",
  "UNDERCUT",
  "RESTART_LEADER",
  "FASTEST_STOP",
  "PIT_GAINER"
] as const;

type StreamSnapshot = {
  leaderboard: EventLeaderboard | null;
  recentEvents: Array<{ sequence: number; type: string; payload: Record<string, unknown>; timestamp: string }>;
};

export const LivePitWallPage = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [streamStatus, setStreamStatus] = useState<"idle" | "connected" | "error">("idle");
  const [snapshot, setSnapshot] = useState<StreamSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [predictionType, setPredictionType] = useState<(typeof predictionTypes)[number]>("CAUTION_WINDOW");
  const [predictionTarget, setPredictionTarget] = useState("Caution next 5 laps");
  const [tokenCost, setTokenCost] = useState(1);

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents
  });

  const teamQuery = useQuery({
    queryKey: ["team"],
    queryFn: () => fetchTeam()
  });

  const predictionsQuery = useQuery({
    queryKey: ["pitwall-predictions", selectedEventId],
    queryFn: () => fetchPitWallPredictions(selectedEventId),
    enabled: Boolean(selectedEventId),
    refetchInterval: 4000
  });

  useEffect(() => {
    if (!selectedEventId && eventsQuery.data && eventsQuery.data.length > 0) {
      setSelectedEventId(eventsQuery.data[0].id);
    }
  }, [selectedEventId, eventsQuery.data]);

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    let source: EventSource | null = null;

    try {
      source = new EventSource(liveStreamUrl(selectedEventId));
      setStreamStatus("connected");
      setError(null);

      source.addEventListener("snapshot", (event) => {
        const payload = JSON.parse((event as MessageEvent).data) as StreamSnapshot;
        setSnapshot(payload);
      });

      source.onerror = () => {
        setStreamStatus("error");
      };
    } catch (streamError) {
      setStreamStatus("error");
      setError(streamError instanceof Error ? streamError.message : "unable to connect live stream");
    }

    return () => {
      source?.close();
      setStreamStatus("idle");
    };
  }, [selectedEventId]);

  const predictionMutation = useMutation({
    mutationFn: (payload: {
      eventId: string;
      teamId: string;
      predictionType: string;
      target: string;
      tokenCost: number;
    }) => submitPitWallPrediction(payload.eventId, payload.teamId, payload.predictionType, payload.target, payload.tokenCost),
    onSuccess: () => {
      setError(null);
      void predictionsQuery.refetch();
      void teamQuery.refetch();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "prediction failed");
    }
  });

  const selectedEvent = useMemo(() => {
    return eventsQuery.data?.find((event) => event.id === selectedEventId);
  }, [eventsQuery.data, selectedEventId]);

  const handleSubmitPrediction = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedEventId || !teamQuery.data) {
      setError("missing event or team context");
      return;
    }

    predictionMutation.mutate({
      eventId: selectedEventId,
      teamId: teamQuery.data.id,
      predictionType,
      target: predictionTarget,
      tokenCost
    });
  };

  return (
    <Container style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <Header as="h2">Live Pit Wall</Header>
      <p>
        Watch live scoring ticks and spend Strategy Tokens on pit-wall predictions. Return to <Link to="/dashboard">dashboard</Link>.
      </p>

      {error && <Message negative>{error}</Message>}

      <Segment raised>
        <Grid stackable columns={3} verticalAlign="middle">
          <Grid.Column>
            <Form.Select
              label="Event"
              options={(eventsQuery.data ?? []).map((event) => ({
                key: event.id,
                value: event.id,
                text: `${event.name} (${event.status})`
              }))}
              value={selectedEventId}
              onChange={(_, data) => setSelectedEventId(String(data.value ?? ""))}
            />
          </Grid.Column>
          <Grid.Column>
            <Header as="h4" style={{ marginBottom: 0 }}>
              Stream Status: {streamStatus}
            </Header>
            {selectedEvent && <p>{selectedEvent.name}</p>}
          </Grid.Column>
          <Grid.Column>
            <Header as="h4" style={{ marginBottom: 0 }}>
              Strategy Tokens
            </Header>
            <p>{teamQuery.data?.strategyTokens ?? 0}</p>
          </Grid.Column>
        </Grid>
      </Segment>

      <Grid stackable columns={2}>
        <Grid.Column>
          <Segment>
            <Header as="h3">Live Leaderboard</Header>
            {snapshot?.leaderboard && (
              <Table compact celled>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Team</Table.HeaderCell>
                    <Table.HeaderCell>Manager</Table.HeaderCell>
                    <Table.HeaderCell>Points</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {snapshot.leaderboard.leaderboard.map((entry) => (
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

          <Segment>
            <Header as="h3">Recent Race Events</Header>
            {snapshot?.recentEvents?.map((event) => (
              <div key={`${event.sequence}-${event.type}`} style={{ marginBottom: "0.5rem" }}>
                <Label size="tiny">#{event.sequence}</Label> {event.type} {JSON.stringify(event.payload)}
              </div>
            ))}
          </Segment>
        </Grid.Column>

        <Grid.Column>
          <Segment>
            <Header as="h3">Submit Pit Wall Call</Header>
            <Form onSubmit={handleSubmitPrediction}>
              <Form.Select
                label="Prediction Type"
                options={predictionTypes.map((type) => ({ key: type, value: type, text: type }))}
                value={predictionType}
                onChange={(_, data) => setPredictionType(data.value as (typeof predictionTypes)[number])}
              />
              <Form.Input
                label="Target"
                value={predictionTarget}
                onChange={(e) => setPredictionTarget(e.target.value)}
                required
              />
              <Form.Input
                label="Token Cost"
                type="number"
                min={1}
                max={2}
                value={tokenCost}
                onChange={(e) => setTokenCost(Number(e.target.value))}
              />
              <Button type="submit" color="orange" loading={predictionMutation.isPending}>
                Submit Prediction
              </Button>
            </Form>
          </Segment>

          <Segment>
            <Header as="h3">My Pit Wall Predictions</Header>
            {predictionsQuery.data?.predictions.map((prediction) => (
              <div key={prediction.id} style={{ marginBottom: "0.6rem" }}>
                <Label>{prediction.predictionType}</Label> {prediction.target}
                <Label color={prediction.outcome === "CORRECT" ? "green" : prediction.outcome === "INCORRECT" ? "red" : "grey"}>
                  {prediction.outcome}
                </Label>
              </div>
            ))}
          </Segment>
        </Grid.Column>
      </Grid>
    </Container>
  );
};
