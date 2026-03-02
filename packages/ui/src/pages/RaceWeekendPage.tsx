import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Container, Form, Grid, Header, Message, Segment, Table } from "semantic-ui-react";

import { fetchEvents, fetchTeam, submitPicks, submitRoster, type EventSummary } from "../lib/game";

type RosterRow = {
  slot: "STARTER" | "BENCH" | "RESERVE";
  driverName: string;
  salary: number;
};

type PickRow = {
  pickType: string;
  pickValue: string;
  confidence: number;
};

const defaultRosterRows = (): RosterRow[] => [
  { slot: "STARTER", driverName: "Driver 1", salary: 120000 },
  { slot: "STARTER", driverName: "Driver 2", salary: 110000 },
  { slot: "STARTER", driverName: "Driver 3", salary: 100000 },
  { slot: "BENCH", driverName: "Bench 1", salary: 70000 },
  { slot: "BENCH", driverName: "Bench 2", salary: 65000 },
  { slot: "RESERVE", driverName: "Reserve", salary: 50000 }
];

const defaultPickRows = (): PickRow[] => [
  { pickType: "POLE_PREDICTION", pickValue: "Driver 1", confidence: 3 },
  { pickType: "PODIUM_PREDICTION", pickValue: "Driver 1, Driver 2, Driver 3", confidence: 3 },
  { pickType: "FASTEST_LAP", pickValue: "Driver 2", confidence: 2 }
];

export const RaceWeekendPage = () => {
  const [salaryCap, setSalaryCap] = useState(600000);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [rosterRows, setRosterRows] = useState<RosterRow[]>(defaultRosterRows);
  const [pickRows, setPickRows] = useState<PickRow[]>(defaultPickRows);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents
  });

  const teamQuery = useQuery({
    queryKey: ["team"],
    queryFn: () => fetchTeam()
  });

  useEffect(() => {
    if (!selectedEventId && eventsQuery.data && eventsQuery.data.length > 0) {
      setSelectedEventId(eventsQuery.data[0].id);
    }
  }, [selectedEventId, eventsQuery.data]);

  const selectedEvent = useMemo<EventSummary | undefined>(() => {
    return eventsQuery.data?.find((event) => event.id === selectedEventId);
  }, [eventsQuery.data, selectedEventId]);

  const rosterMutation = useMutation({
    mutationFn: (payload: { teamId: string; eventId: string; salaryCap: number; items: RosterRow[] }) =>
      submitRoster(payload.teamId, payload.eventId, payload.salaryCap, payload.items),
    onSuccess: () => {
      setError(null);
      setNotice("Roster submitted successfully");
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(mutationError instanceof Error ? mutationError.message : "roster submission failed");
    }
  });

  const picksMutation = useMutation({
    mutationFn: (payload: { teamId: string; eventId: string; picks: PickRow[] }) =>
      submitPicks(payload.teamId, payload.eventId, payload.picks),
    onSuccess: () => {
      setError(null);
      setNotice("Pre-race picks submitted successfully");
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(mutationError instanceof Error ? mutationError.message : "pick submission failed");
    }
  });

  const handleRosterChange = (index: number, field: keyof RosterRow, value: string) => {
    setRosterRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        return {
          ...row,
          [field]: field === "salary" ? Number(value) : value
        } as RosterRow;
      })
    );
  };

  const handlePickChange = (index: number, field: keyof PickRow, value: string) => {
    setPickRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        return {
          ...row,
          [field]: field === "confidence" ? Number(value) : value
        } as PickRow;
      })
    );
  };

  const handleSubmitWeekend = (event: FormEvent) => {
    event.preventDefault();

    if (!teamQuery.data || !selectedEventId) {
      setError("team or event not available");
      return;
    }

    rosterMutation.mutate({
      teamId: teamQuery.data.id,
      eventId: selectedEventId,
      salaryCap,
      items: rosterRows
    });

    picksMutation.mutate({
      teamId: teamQuery.data.id,
      eventId: selectedEventId,
      picks: pickRows
    });
  };

  const rosterTotal = rosterRows.reduce((sum, row) => sum + row.salary, 0);

  return (
    <Container style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <Header as="h2">Race Weekend</Header>
      <p>
        Submit lineup and pre-race predictions. Return to <Link to="/dashboard">dashboard</Link>.
      </p>

      {notice && <Message positive>{notice}</Message>}
      {error && <Message negative>{error}</Message>}

      <Segment raised>
        <Grid stackable columns={2}>
          <Grid.Column>
            <Header as="h4">Selected Event</Header>
            <Form.Select
              options={(eventsQuery.data ?? []).map((event) => ({
                key: event.id,
                value: event.id,
                text: `${event.name} (${new Date(event.startsAt).toLocaleDateString()})`
              }))}
              value={selectedEventId}
              onChange={(_, data) => setSelectedEventId(String(data.value ?? ""))}
            />
          </Grid.Column>
          <Grid.Column>
            <Header as="h4">Salary Cap</Header>
            <Form.Input
              type="number"
              value={salaryCap}
              onChange={(e) => setSalaryCap(Number(e.target.value))}
              label={`Current total: $${rosterTotal.toLocaleString()}`}
            />
          </Grid.Column>
        </Grid>
        {selectedEvent && (
          <p>
            {selectedEvent.name} • {selectedEvent.season.name} {selectedEvent.season.year} • {selectedEvent.status}
          </p>
        )}
      </Segment>

      <Form onSubmit={handleSubmitWeekend}>
        <Segment>
          <Header as="h3">Roster</Header>
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Slot</Table.HeaderCell>
                <Table.HeaderCell>Driver</Table.HeaderCell>
                <Table.HeaderCell>Salary</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rosterRows.map((row, index) => (
                <Table.Row key={`${row.slot}-${index}`}>
                  <Table.Cell>{row.slot}</Table.Cell>
                  <Table.Cell>
                    <Form.Input
                      transparent
                      value={row.driverName}
                      onChange={(e) => handleRosterChange(index, "driverName", e.target.value)}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Form.Input
                      transparent
                      type="number"
                      value={row.salary}
                      onChange={(e) => handleRosterChange(index, "salary", e.target.value)}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>

        <Segment>
          <Header as="h3">Pre-Race Picks</Header>
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Value</Table.HeaderCell>
                <Table.HeaderCell>Confidence (1-5)</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {pickRows.map((row, index) => (
                <Table.Row key={`${row.pickType}-${index}`}>
                  <Table.Cell>{row.pickType}</Table.Cell>
                  <Table.Cell>
                    <Form.Input
                      transparent
                      value={row.pickValue}
                      onChange={(e) => handlePickChange(index, "pickValue", e.target.value)}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Form.Input
                      transparent
                      type="number"
                      min={1}
                      max={5}
                      value={row.confidence}
                      onChange={(e) => handlePickChange(index, "confidence", e.target.value)}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>

        <Button
          type="submit"
          color="orange"
          loading={rosterMutation.isPending || picksMutation.isPending}
          disabled={!teamQuery.data || !selectedEventId}
        >
          Submit Weekend Plan
        </Button>
      </Form>
    </Container>
  );
};
