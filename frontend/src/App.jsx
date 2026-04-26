import { useState } from "react";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import BlockedUsers from "./pages/BlockedUsers";
import Alerts from "./pages/Alerts";
import APIKeys from "./pages/APIKeys";
import RateTester from "./pages/RateTester";
import Settings from "./pages/Settings";
import { useDashboardData } from "./hooks/useDashboardData";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { connected } = useDashboardData();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            onNavigateToTester={() => setActiveTab("tester")}
            onNavigateToBlocked={() => setActiveTab("blocked")}
            onNavigateToKeys={() => setActiveTab("apikeys")}
            onNavigateToAlerts={() => setActiveTab("alerts")}
          />
        );
      case "blocked":
        return <BlockedUsers />;
      case "alerts":
        return <Alerts />;
      case "apikeys":
        return <APIKeys />;
      case "tester":
        return <RateTester />;
      case "settings":
        return <Settings />;
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
            background: "#0f1018",
            color: "#e2e8f0",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: "13px",
            backdropFilter: "blur(20px)",
          },
        }}
      />

      <div className="flex h-screen overflow-hidden bg-dark-950 bg-grid relative">
        {/* Background ambient glow */}
        <div className="absolute top-[-15%] left-[-10%] w-[35%] h-[35%] rounded-full bg-accent-indigo/[0.03] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[35%] h-[35%] rounded-full bg-accent-purple/[0.03] blur-[100px] pointer-events-none" />

        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          connected={connected}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-dark-950/80 backdrop-blur-xl border-b border-white/[0.04]">
            <div className="lg:hidden w-8" /> {/* Spacer for mobile menu button */}
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em] ${
                  connected
                    ? "bg-success/5 text-success border border-success/15"
                    : "bg-danger/5 text-danger border border-danger/15"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connected
                      ? "bg-success animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                      : "bg-danger"
                  }`}
                />
                {connected ? "Live" : "Offline"}
              </span>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative z-10">
            <div className="max-w-7xl mx-auto">{renderContent()}</div>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
