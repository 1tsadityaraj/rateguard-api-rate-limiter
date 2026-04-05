import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import { useDashboardData } from "./hooks/useDashboardData";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { connected } = useDashboardData();

  // Simple placeholder for other tabs
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "blocked":
        return (
          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center h-64 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-2">Blocked Users</h2>
            <p className="text-dark-400">Manage temporarily blocked IPs and Users here.</p>
          </div>
        );
      case "alerts":
        return (
          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center h-64 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-2">Abuse Alerts</h2>
            <p className="text-dark-400">View recent abuse spikes and warnings.</p>
          </div>
        );
      case "apikeys":
        return (
          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center h-64 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-2">API Keys</h2>
            <p className="text-dark-400">Manage Free and Pro tier API keys.</p>
          </div>
        );
      case "settings":
        return (
          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center h-64 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-2">Settings</h2>
            <p className="text-dark-400">Configure default rate limits and block durations.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      connected={connected}
      user={{ username: "Admin", email: "admin@rateguard.app" }} // Hardcoded for demo
    >
      <div className="max-w-7xl mx-auto">{renderContent()}</div>
    </Layout>
  );
}

export default App;
