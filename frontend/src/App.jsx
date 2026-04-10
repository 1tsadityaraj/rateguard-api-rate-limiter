import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import BlockedUsersTable from "./components/BlockedUsersTable";
import AlertsPanel from "./components/AlertsPanel";
import ApiKeysPanel from "./components/ApiKeysPanel";
import SettingsPanel from "./components/SettingsPanel";
import RateTester from "./components/RateTester";
import { useDashboardData } from "./hooks/useDashboardData";
import { getMe, logout } from "./services/api";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { connected, blockedUsers, alerts, health, refresh } = useDashboardData();

  // Check for existing JWT on mount
  useEffect(() => {
    const token = localStorage.getItem("rateguard_token");
    if (token) {
      getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          // Token expired or invalid — clear it
          localStorage.removeItem("rateguard_token");
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleAuth = (result) => {
    setUser(result.user);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-white/10 border-t-accent-cyan rounded-full animate-spin" />
          <p className="text-xs text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e1e2e",
              color: "#e2e8f0",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: "13px",
            },
          }}
        />
        <LoginPage onAuth={handleAuth} />
      </>
    );
  }

  // Render the active tab content
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "blocked":
        return <BlockedUsersTable blockedUsers={blockedUsers} onRefresh={refresh} />;
      case "alerts":
        return <AlertsPanel alerts={alerts} onRefresh={refresh} />;
      case "apikeys":
        return <ApiKeysPanel />;
      case "tester":
        return <RateTester />;
      case "settings":
        return <SettingsPanel health={health} onRefresh={refresh} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e1e2e",
            color: "#e2e8f0",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "13px",
          },
        }}
      />
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connected={connected}
        onLogout={handleLogout}
        user={user}
      >
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </Layout>
    </>
  );
}

export default App;
