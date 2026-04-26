import { useState } from "react";
import {
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineKey,
  HiOutlineCog,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineBeaker,
} from "react-icons/hi";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: HiOutlineChartBar },
  { id: "blocked", label: "Blocked Users", icon: HiOutlineShieldCheck },
  { id: "alerts", label: "Alerts", icon: HiOutlineBell },
  { id: "apikeys", label: "API Keys", icon: HiOutlineKey },
  { id: "tester", label: "Rate Tester", icon: HiOutlineBeaker },
  { id: "settings", label: "Settings", icon: HiOutlineCog },
];

/**
 * Sidebar navigation with logo, nav links, and current plan badge.
 */
export default function Sidebar({ activeTab, onTabChange, connected }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id) => {
    onTabChange(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-dark-800 border border-white/10 text-dark-300 hover:text-white transition-colors cursor-pointer"
        id="mobile-menu-toggle"
      >
        <HiOutlineMenu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col
          bg-dark-900/95 backdrop-blur-xl border-r border-white/[0.06]
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        id="sidebar"
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h1 className="text-[17px] font-bold tracking-tight">
              <span className="gradient-text">RateGuard</span>
            </h1>
            <p className="text-[10px] text-dark-400 tracking-[0.15em] uppercase mt-0.5">
              API Rate Limiter
            </p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-dark-400 hover:text-white cursor-pointer"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-dark-500 uppercase tracking-[0.2em] font-semibold px-3 mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                id={`nav-${item.id}`}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-[13px] font-medium transition-all duration-200 cursor-pointer group
                  ${
                    active
                      ? "bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/15"
                      : "text-dark-300 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active
                      ? "text-accent-indigo"
                      : "text-dark-400 group-hover:text-dark-300"
                  }`}
                />
                {item.label}
                {item.id === "alerts" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-4 py-4 border-t border-white/[0.06] space-y-3">
          {/* Current Plan */}
          <div>
            <p className="text-[10px] text-dark-500 tracking-[0.15em] uppercase font-medium mb-1.5">
              Current Plan
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-accent-indigo/10 text-accent-indigo text-[10px] font-bold uppercase tracking-wider border border-accent-indigo/20">
                PRO
              </span>
              <span className="text-[11px] text-dark-400">1,000 req/min</span>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected
                  ? "bg-success shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse"
                  : "bg-danger"
              }`}
            />
            <span
              className={`text-[11px] font-medium ${
                connected ? "text-success" : "text-danger"
              }`}
            >
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
