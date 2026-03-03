import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { beginCognitoGoogleLogin, loginLocal } from "../lib/auth";
import { appConfig } from "../lib/config";

type LoginPageProps = {
  onLoginComplete: () => Promise<void>;
};

export const LoginPage = ({ onLoginComplete }: LoginPageProps) => {
  const navigate = useNavigate();
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
      navigate("/dashboard", { replace: true });
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
    <div className="ui text container" style={{ marginTop: "4rem" }}>
      <div className="ui very padded raised segment">
        <h2 className="ui header">Sign in to Paddock to Penthouse</h2>
        <p>Use Google via Cognito in cloud environments, or local auth for development.</p>

        {error ? <div className="ui negative message">{error}</div> : null}

        {appConfig.authMode === "cognito" ? (
          <button type="button" className="ui google plus button" onClick={handleGoogleLogin}>
            <i className="google icon" />
            Continue with Google
          </button>
        ) : (
          <form className={`ui form ${loading ? "loading" : ""}`} onSubmit={handleLocalLogin}>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="login-display-name">Display Name</label>
              <input
                id="login-display-name"
                required
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <button type="submit" className="ui orange button" disabled={loading}>
              Sign in (Local)
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
