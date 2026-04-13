import { useState } from "react";
import {
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineKey,
  HiOutlineCog,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
  HiOutlineStatusOnline,
  HiOutlineBeaker,
} from "react-icons/hi";

/**
 * Main layout wrapper with collapsible sidebar and fixed header.
 * Supports 6 navigation tabs and shows connection status.
 */
export default function Layout({
  children,
  activeTab,
  onTabChange,
  connected,
  onLogout,
  user,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: HiOutlineChartBar },
    { id: "blocked", label: "Blocked Users", icon: HiOutlineShieldCheck },
    { id: "alerts", label: "Alerts", icon: HiOutlineBell },
    { id: "apikeys", label: "API Keys", icon: HiOutlineKey },
    { id: "tester", label: "Rate Tester", icon: HiOutlineBeaker },
    { id: "settings", label: "Settings", icon: HiOutlineCog },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900 bg-grid relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-cyan/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-purple/10 blur-[120px] pointer-events-none" />

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-dark-800 border-r border-white/5
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
            <HiOutlineShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              RateGuard
            </h1>
            <p className="text-[10px] text-dark-300 uppercase tracking-widest">
              Rate Limiter
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-dark-300 hover:text-white cursor-pointer"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                  text-sm font-medium transition-all duration-200 cursor-pointer
                  ${
                    active
                      ? "bg-accent-cyan/10 text-accent-cyan shadow-[inset_0_0_0_1px_rgba(6,214,160,0.15)]"
                      : "text-dark-300 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? "text-accent-cyan" : ""}`} />
                {item.label}
                {item.id === "alerts" && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-accent-pink animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Connection status + user */}
        <div className="px-4 py-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <HiOutlineStatusOnline
              className={`w-4 h-4 ${connected ? "text-success" : "text-danger"}`}
            />
            <span className={connected ? "text-success" : "text-danger"}>
              {connected ? "Live Connected" : "Disconnected"}
            </span>
          </div>
          {user && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple uppercase">
                  {user.username?.[0] || "A"}
                </div>
                <span className="text-xs text-dark-300 truncate max-w-[120px]">
                  {user.username || user.email}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-dark-400 hover:text-danger transition-colors cursor-pointer"
                title="Logout"
              >
                <HiOutlineLogout className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 py-3 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-dark-300 hover:text-white cursor-pointer"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest ${
                connected
                  ? "bg-success/10 text-success border border-success/20 shadow-[0_0_15px_rgba(6,214,160,0.15)]"
                  : "bg-danger/10 text-danger border border-danger/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? "bg-success animate-pulse" : "bg-danger"
                }`}
              />
              {connected ? "Live Monitoring Active" : "Offline"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 relative z-10 w-full max-w-7xl mx-auto drop-shadow-xl">{children}</main>
      </div>
    </div>
  );
}
