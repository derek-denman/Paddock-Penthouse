import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Header, Message, Segment } from "semantic-ui-react";

import { consumeCallbackToken, fetchSessionUser } from "../lib/auth";

type AuthCallbackPageProps = {
  onLoginComplete: () => Promise<void>;
};

export const AuthCallbackPage = ({ onLoginComplete }: AuthCallbackPageProps) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeLogin = async () => {
      try {
        consumeCallbackToken();
        const user = await fetchSessionUser();
        if (!user) {
          throw new Error("session restoration failed after callback");
        }

        await onLoginComplete();
        navigate("/dashboard", { replace: true });
      } catch (callbackError) {
        setError(callbackError instanceof Error ? callbackError.message : "OAuth callback failed");
      }
    };

    void completeLogin();
  }, [navigate, onLoginComplete]);

  return (
    <Container text style={{ marginTop: "4rem" }}>
      <Segment raised padded="very">
        <Header as="h2">Completing sign-in...</Header>
        {error && (
          <Message negative>
            <p>{error}</p>
            <p>
              Return to <Link to="/login">login</Link>.
            </p>
          </Message>
        )}
      </Segment>
    </Container>
  );
};
