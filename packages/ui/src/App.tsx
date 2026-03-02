import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { clearToken, fetchSessionUser, type SessionUser } from "./lib/auth";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LeaguePage } from "./pages/LeaguePage";
import { LivePitWallPage } from "./pages/LivePitWallPage";
import { LoginPage } from "./pages/LoginPage";
import { RaceWeekendPage } from "./pages/RaceWeekendPage";
import { TeamAiConsolePage } from "./pages/TeamAiConsolePage";
import { TeamPage } from "./pages/TeamPage";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const restoreSession = async () => {
    setLoading(true);
    try {
      const restored = await fetchSessionUser();
      setUser(restored);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void restoreSession();
  }, []);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    navigate("/", { replace: true });
  };

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage user={user} />} />
      <Route path="/login" element={<LoginPage onLoginComplete={restoreSession} />} />
      <Route path="/auth/callback" element={<AuthCallbackPage onLoginComplete={restoreSession} />} />
      <Route
        path="/dashboard"
        element={user ? <DashboardPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route path="/league" element={user ? <LeaguePage /> : <Navigate to="/login" replace />} />
      <Route path="/team" element={user ? <TeamPage /> : <Navigate to="/login" replace />} />
      <Route path="/race-weekend" element={user ? <RaceWeekendPage /> : <Navigate to="/login" replace />} />
      <Route path="/live" element={user ? <LivePitWallPage /> : <Navigate to="/login" replace />} />
      <Route path="/ai-console" element={user ? <TeamAiConsolePage /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
