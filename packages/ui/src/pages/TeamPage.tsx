import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Container, Form, Grid, Header, Message, Segment, Table } from "semantic-ui-react";

import { fetchTeam, hireStaff, signDriver } from "../lib/game";

const staffRoles = [
  "TEAM_PRINCIPAL",
  "RACE_ENGINEER",
  "STRATEGIST",
  "PIT_CREW_COACH",
  "TALENT_SCOUT",
  "LEGAL_COMPLIANCE"
] as const;

const seriesOptions = ["F1", "NASCAR", "INDYCAR", "WEC", "IMSA"] as const;

export const TeamPage = () => {
  const [staffName, setStaffName] = useState("New Strategist");
  const [staffRole, setStaffRole] = useState<(typeof staffRoles)[number]>("STRATEGIST");
  const [staffSalary, setStaffSalary] = useState(80000);

  const [driverName, setDriverName] = useState("Prospect Driver");
  const [driverSeries, setDriverSeries] = useState<(typeof seriesOptions)[number]>("F1");
  const [driverSalary, setDriverSalary] = useState(150000);

  const [error, setError] = useState<string | null>(null);

  const teamQuery = useQuery({
    queryKey: ["team"],
    queryFn: () => fetchTeam()
  });

  const hireMutation = useMutation({
    mutationFn: (payload: { teamId: string; name: string; role: string; salary: number }) =>
      hireStaff(payload.teamId, payload.name, payload.role, payload.salary),
    onSuccess: () => {
      setError(null);
      void teamQuery.refetch();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "hire failed")
  });

  const signMutation = useMutation({
    mutationFn: (payload: { teamId: string; driverName: string; series: string; salary: number }) =>
      signDriver(payload.teamId, payload.driverName, payload.series, payload.salary),
    onSuccess: () => {
      setError(null);
      void teamQuery.refetch();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "sign failed")
  });

  const handleHire = (event: FormEvent) => {
    event.preventDefault();
    if (!teamQuery.data) {
      return;
    }

    hireMutation.mutate({
      teamId: teamQuery.data.id,
      name: staffName,
      role: staffRole,
      salary: staffSalary
    });
  };

  const handleSignDriver = (event: FormEvent) => {
    event.preventDefault();
    if (!teamQuery.data) {
      return;
    }

    signMutation.mutate({
      teamId: teamQuery.data.id,
      driverName,
      series: driverSeries,
      salary: driverSalary
    });
  };

  return (
    <Container style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <Header as="h2">Team and Empire</Header>
      <p>
        Hire staff, sign drivers, and manage funds. Return to <Link to="/dashboard">dashboard</Link>.
      </p>

      {error && <Message negative>{error}</Message>}
      {teamQuery.isLoading && <p>Loading team...</p>}

      {teamQuery.data && (
        <>
          <Segment raised>
            <Header as="h3">{teamQuery.data.name}</Header>
            <p>Funds: ${teamQuery.data.funds.toLocaleString()}</p>
            <p>Strategy Tokens: {teamQuery.data.strategyTokens}</p>
          </Segment>

          <Grid stackable columns={2}>
            <Grid.Column>
              <Segment>
                <Header as="h4">Hire Staff</Header>
                <Form onSubmit={handleHire}>
                  <Form.Input label="Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
                  <Form.Select
                    label="Role"
                    options={staffRoles.map((role) => ({ key: role, value: role, text: role }))}
                    value={staffRole}
                    onChange={(_, data) => setStaffRole(data.value as (typeof staffRoles)[number])}
                  />
                  <Form.Input
                    label="Salary"
                    type="number"
                    value={staffSalary}
                    onChange={(e) => setStaffSalary(Number(e.target.value))}
                  />
                  <Button type="submit" color="orange" loading={hireMutation.isPending}>
                    Hire
                  </Button>
                </Form>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>
                <Header as="h4">Sign Driver</Header>
                <Form onSubmit={handleSignDriver}>
                  <Form.Input
                    label="Driver Name"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    required
                  />
                  <Form.Select
                    label="Series"
                    options={seriesOptions.map((series) => ({ key: series, value: series, text: series }))}
                    value={driverSeries}
                    onChange={(_, data) => setDriverSeries(data.value as (typeof seriesOptions)[number])}
                  />
                  <Form.Input
                    label="Salary"
                    type="number"
                    value={driverSalary}
                    onChange={(e) => setDriverSalary(Number(e.target.value))}
                  />
                  <Button type="submit" color="blue" loading={signMutation.isPending}>
                    Sign
                  </Button>
                </Form>
              </Segment>
            </Grid.Column>
          </Grid>

          <Grid stackable columns={2} style={{ marginTop: "1rem" }}>
            <Grid.Column>
              <Segment>
                <Header as="h4">Staff</Header>
                <Table compact celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Name</Table.HeaderCell>
                      <Table.HeaderCell>Role</Table.HeaderCell>
                      <Table.HeaderCell>Salary</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {teamQuery.data.staffMembers.map((member) => (
                      <Table.Row key={member.id}>
                        <Table.Cell>{member.name}</Table.Cell>
                        <Table.Cell>{member.role}</Table.Cell>
                        <Table.Cell>${member.salary.toLocaleString()}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>
                <Header as="h4">Driver Contracts</Header>
                <Table compact celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Driver</Table.HeaderCell>
                      <Table.HeaderCell>Series</Table.HeaderCell>
                      <Table.HeaderCell>Salary</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {teamQuery.data.driverContracts.map((contract) => (
                      <Table.Row key={contract.id}>
                        <Table.Cell>{contract.driverName}</Table.Cell>
                        <Table.Cell>{contract.series}</Table.Cell>
                        <Table.Cell>${contract.salary.toLocaleString()}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Segment>
            </Grid.Column>
          </Grid>
        </>
      )}
    </Container>
  );
};
