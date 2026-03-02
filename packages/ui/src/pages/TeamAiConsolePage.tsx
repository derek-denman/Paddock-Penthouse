import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Container, Form, Header, Label, Message, Segment } from "semantic-ui-react";

import { fetchAiHistory, sendAiMessage, type AiHistoryMessage } from "../lib/game";

const renderActions = (message: AiHistoryMessage) => {
  if (!message.actions || message.actions.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {message.actions.map((action, index) => (
        <Label key={`${message.id}-${action.type}-${index}`} color={action.allowed ? "green" : "red"} style={{ marginBottom: "0.4rem" }}>
          {action.type}: {action.summary}
        </Label>
      ))}
    </div>
  );
};

export const TeamAiConsolePage = () => {
  const [message, setMessage] = useState("Suggest a safe lineup strategy for this weekend");
  const [error, setError] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ["ai-history"],
    queryFn: fetchAiHistory,
    refetchInterval: 5000
  });

  const mutation = useMutation({
    mutationFn: sendAiMessage,
    onSuccess: () => {
      setError(null);
      setMessage("");
      void historyQuery.refetch();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "assistant request failed");
    }
  });

  const orderedHistory = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    mutation.mutate(message.trim());
  };

  return (
    <Container style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <Header as="h2">Team AI Console</Header>
      <p>
        Ask for roster, hiring, risk, and pit-wall guidance. Return to <Link to="/dashboard">dashboard</Link>.
      </p>

      {error && <Message negative>{error}</Message>}

      <Segment raised style={{ maxHeight: "55vh", overflowY: "auto" }}>
        {orderedHistory.length === 0 && <p>No chat history yet.</p>}

        {orderedHistory.map((item) => (
          <Segment key={item.id} color={item.role === "USER" ? "blue" : "orange"}>
            <Header as="h5" style={{ marginBottom: "0.4rem" }}>
              {item.role === "USER" ? "You" : "Team AI"}
            </Header>
            <p style={{ marginBottom: "0.2rem" }}>{item.content}</p>
            {renderActions(item)}
          </Segment>
        ))}
      </Segment>

      <Segment>
        <Form onSubmit={handleSubmit}>
          <Form.TextArea
            label="Message"
            value={message}
            onChange={(event) => setMessage(String(event.currentTarget.value))}
            rows={4}
          />
          <Button type="submit" color="orange" loading={mutation.isPending}>
            Send to Team AI
          </Button>
        </Form>
      </Segment>
    </Container>
  );
};
