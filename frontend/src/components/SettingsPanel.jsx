import { useState } from "react";
import {
  HiOutlineCog,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineDatabase,
  HiOutlineServer,
  HiOutlineStatusOnline,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { exportLogs, fetchHealth } from "../services/api";

/**
 * Settings page — system info, health check, export logs, and configuration overview.
 */
export default function SettingsPanel({ health, onRefresh }) {
  const [exporting, setExporting] = useState(false);
  const [exportHours, setExportHours] = useState(24);
  const [refreshing, setRefreshing] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportLogs(exportHours);
      toast.success(`Exported logs for the last ${exportHours} hours`);
    } catch {
      toast.error("Failed to export logs");
    } finally {
      setExporting(false);
    }
  };

  const handleRefreshHealth = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
      toast.success("Health status refreshed");
    } catch {
      toast.error("Failed to refresh health");
    } finally {
      setRefreshing(false);
    }
  };

  const redisUp = health?.services?.redis === "connected";
  const mongoUp = health?.services?.mongodb === "connected";

  return (
    <div className="space-y-6">
      {/* System Health */}
      <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <HiOutlineStatusOnline className="w-4 h-4 text-accent-cyan" />
            System Health
          </h3>
          <button
            onClick={handleRefreshHealth}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-all cursor-pointer disabled:animate-spin"
            title="Refresh health"
          >
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Overall Status */}
          <div className="p-4 rounded-xl bg-dark-700/50 border border-white/[0.04]">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  health?.status === "ok" ? "bg-success/10" : "bg-danger/10"
                }`}
              >
                <HiOutlineServer
                  className={`w-5 h-5 ${
                    health?.status === "ok" ? "text-success" : "text-danger"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">API Server</p>
                <p
                  className={`text-xs font-medium ${
                    health?.status === "ok" ? "text-success" : "text-danger"
                  }`}
                >
                  {health?.status === "ok" ? "Operational" : "Degraded"}
                </p>
              </div>
            </div>
            {health?.uptime && (
              <p className="text-xs text-dark-400">
                Uptime: {Math.floor(health.uptime / 3600)}h{" "}
                {Math.floor((health.uptime % 3600) / 60)}m
              </p>
            )}
          </div>

          {/* Redis */}
          <div className="p-4 rounded-xl bg-dark-700/50 border border-white/[0.04]">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  redisUp ? "bg-success/10" : "bg-danger/10"
                }`}
              >
                <HiOutlineLightningBolt
                  className={`w-5 h-5 ${redisUp ? "text-success" : "text-danger"}`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Redis</p>
                <p
                  className={`text-xs font-medium ${
                    redisUp ? "text-success" : "text-danger"
                  }`}
                >
                  {redisUp ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>
            <p className="text-xs text-dark-400">
              {redisUp
                ? "Rate limiting via Redis"
                : "Fallback: in-memory limiting active"}
            </p>
          </div>

          {/* MongoDB */}
          <div className="p-4 rounded-xl bg-dark-700/50 border border-white/[0.04]">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  mongoUp ? "bg-success/10" : "bg-danger/10"
                }`}
              >
                <HiOutlineDatabase
                  className={`w-5 h-5 ${mongoUp ? "text-success" : "text-danger"}`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">MongoDB</p>
                <p
                  className={`text-xs font-medium ${
                    mongoUp ? "text-success" : "text-danger"
                  }`}
                >
                  {mongoUp ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>
            <p className="text-xs text-dark-400">
              {mongoUp ? "Logging to MongoDB" : "Logs not being persisted"}
            </p>
          </div>
        </div>
      </div>

      {/* Export Logs */}
      <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineDownload className="w-4 h-4 text-accent-blue" />
          Export Logs as CSV
        </h3>
        <p className="text-xs text-dark-400 mb-4">
          Download request logs as a CSV file for offline analysis or compliance.
        </p>
        <div className="flex flex-wrap gap-3">
          <select
            value={exportHours}
            onChange={(e) => setExportHours(Number(e.target.value))}
            className="px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-accent-cyan/40 transition-all cursor-pointer"
          >
            <option value={1}>Last 1 hour</option>
            <option value={6}>Last 6 hours</option>
            <option value={12}>Last 12 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={72}>Last 3 days</option>
            <option value={168}>Last 7 days</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
          >
            <HiOutlineDownload className="w-4 h-4" />
            {exporting ? "Exporting..." : "Download CSV"}
          </button>
        </div>
      </div>

      {/* Configuration Overview */}
      <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineCog className="w-4 h-4 text-accent-purple" />
          Rate Limiter Configuration
        </h3>
        <p className="text-xs text-dark-400 mb-4">
          Current server configuration. Update via environment variables and restart the server.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              label: "Default Rate Limit",
              value: "100 req/min",
              icon: HiOutlineLightningBolt,
              color: "accent-cyan",
            },
            {
              label: "Free Tier Limit",
              value: "30 req/min",
              icon: HiOutlineShieldCheck,
              color: "accent-blue",
            },
            {
              label: "Pro Tier Limit",
              value: "200 req/min",
              icon: HiOutlineShieldCheck,
              color: "accent-purple",
            },
            {
              label: "Block Duration",
              value: "10 minutes",
              icon: HiOutlineCog,
              color: "accent-orange",
            },
            {
              label: "Sliding Window",
              value: "60 seconds",
              icon: HiOutlineCog,
              color: "accent-cyan",
            },
            {
              label: "Auto-block After",
              value: "5 violations",
              icon: HiOutlineShieldCheck,
              color: "accent-pink",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50 border border-white/[0.04]"
              >
                <Icon className={`w-4 h-4 text-${item.color} shrink-0`} />
                <span className="text-xs text-dark-400">{item.label}</span>
                <span className="ml-auto text-sm text-white font-medium">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Algorithms Info */}
      <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineLightningBolt className="w-4 h-4 text-accent-yellow" />
          Supported Algorithms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-dark-700/50 border border-accent-cyan/10">
            <h4 className="text-sm text-accent-cyan font-semibold mb-2">
              🪟 Sliding Window
            </h4>
            <p className="text-xs text-dark-400 leading-relaxed">
              Uses a Redis sorted set to track each request timestamp. Counts entries
              within the current window and removes old ones. Provides accurate
              per-second granularity. Applied on{" "}
              <code className="text-accent-cyan/80">/api/protected/*</code>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-dark-700/50 border border-accent-purple/10">
            <h4 className="text-sm text-accent-purple font-semibold mb-2">
              🪣 Token Bucket
            </h4>
            <p className="text-xs text-dark-400 leading-relaxed">
              Classic token-bucket: tokens refill at a steady rate. Each request
              consumes one token. Allows controlled bursts above the average rate.
              Applied on{" "}
              <code className="text-accent-purple/80">/api/tb/*</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
