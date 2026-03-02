import { FormEvent, useState } from "react";
import { Button, Container, Form, Header, Message, Segment } from "semantic-ui-react";

import { beginCognitoGoogleLogin, loginLocal } from "../lib/auth";
import { appConfig } from "../lib/config";

type LoginPageProps = {
  onLoginComplete: () => Promise<void>;
};

export const LoginPage = ({ onLoginComplete }: LoginPageProps) => {
  const [email, setEmail] = useState("owner@example.com");
  const [displayName, setDisplayName] = useState("Local Player");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLocalLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginLocal(email, displayName);
      await onLoginComplete();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Local login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      beginCognitoGoogleLogin();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Google login failed");
    }
  };

  return (
    <Container text style={{ marginTop: "4rem" }}>
      <Segment padded="very" raised>
        <Header as="h2">Sign in to Paddock to Penthouse</Header>
        <p>Use Google via Cognito in cloud environments, or local auth for development.</p>

        {error && <Message negative>{error}</Message>}

        {appConfig.authMode === "cognito" ? (
          <Button color="google plus" onClick={handleGoogleLogin} icon="google" content="Continue with Google" />
        ) : (
          <Form onSubmit={handleLocalLogin}>
            <Form.Input
              required
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Form.Input
              required
              label="Display Name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <Button type="submit" color="orange" loading={loading}>
              Sign in (Local)
            </Button>
          </Form>
        )}
      </Segment>
    </Container>
  );
};
