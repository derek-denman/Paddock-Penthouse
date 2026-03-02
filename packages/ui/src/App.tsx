import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { clearToken, fetchSessionUser, type SessionUser } from "./lib/auth";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";

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
