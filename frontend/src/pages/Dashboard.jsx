import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { HiOutlineDownload, HiOutlineBell } from "react-icons/hi";
import { useDashboardData } from "../hooks/useDashboardData";
import StatCard from "../components/StatCard";
import LiveFeed from "../components/LiveFeed";
import UsersTable from "../components/UsersTable";
import { exportLogs } from "../services/api";
import toast from "react-hot-toast";

/**
 * Custom chart tooltip for the request timeline.
 */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 border border-white/10 text-xs">
      <p className="text-dark-300 mb-1 font-mono">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold font-mono">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/**
 * SVG donut chart for status breakdown.
 */
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-lg">
        {data.map((segment, i) => {
          const pct = segment.value / total;
          const dashLen = pct * circumference;
          const dashOffset = -offset * circumference;
          offset += pct;
          return (
            <circle
              key={i}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="16"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          );
        })}
        <text x="90" y="85" textAnchor="middle" className="fill-white text-2xl font-bold font-mono">
          {total.toLocaleString()}
        </text>
        <text x="90" y="105" textAnchor="middle" className="fill-dark-400 text-[10px] uppercase tracking-widest">
          Total
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: d.color }}
            />
            <span className="text-[11px] text-dark-300">{d.label}</span>
            <span className="text-[11px] font-bold font-mono text-white">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main dashboard view with stats, charts, live feed, and top users.
 */
export default function Dashboard({
  onNavigateToTester,
  onNavigateToBlocked,
  onNavigateToKeys,
  onNavigateToAlerts,
}) {
  const { stats, topUsers, recentLogs, alerts, loading, error, refresh } =
    useDashboardData();
  const [isSimulating, setIsSimulating] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const handleTestTraffic = async () => {
    setIsSimulating(true);
    toast("Generating test traffic...", { icon: "🚀" });
    try {
      const promises = Array.from({ length: 20 }).map(() =>
        fetch("/api/protected/data")
      );
      await Promise.all(promises);
      toast.success("Traffic generated!");
    } catch {
      toast.error("Traffic generation failed.");
    } finally {
      setIsSimulating(false);
      refresh();
    }
  };

  const handleExportLogs = async () => {
    try {
      await exportLogs(24);
      toast.success("Logs exported!");
    } catch {
      toast.error("Export failed.");
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 w-1/3 bg-dark-800/40 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 bg-dark-800/40 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-dark-800/40 rounded-2xl" />
          <div className="h-[350px] bg-dark-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-danger text-sm font-medium">{error}</p>
        <button
          onClick={refresh}
          className="mt-3 px-4 py-2 rounded-xl bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 transition-all cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Chart data
  const timelineData = (stats?.timeline || []).map((t) => ({
    time: t.time?.split("T")[1] || t.time,
    Requests: t.total,
    Blocked: t.blocked,
  }));

  const statusData = [
    { label: "200 OK", value: stats?.statusBreakdown?.success || 0, color: "#34d399" },
    { label: "429 Rate Limited", value: stats?.statusBreakdown?.rate_limited || 0, color: "#fbbf24" },
    { label: "403 Forbidden", value: (stats?.statusBreakdown?.forbidden || 0) + (stats?.statusBreakdown?.client_error || 0), color: "#f87171" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-dark-400 mt-0.5">
            Monitor API traffic and detect anomalies in real time
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/5 border border-success/15">
            <span className="status-dot-success" />
            <span className="text-[11px] text-success font-semibold">
              Live Monitoring Active
            </span>
          </div>

          {/* Run Test Traffic */}
          <button
            onClick={handleTestTraffic}
            disabled={isSimulating}
            id="btn-test-traffic"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-indigo/10 hover:bg-accent-indigo/20 border border-accent-indigo/20 text-accent-indigo text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <span>▶</span> {isSimulating ? "Running..." : "Run Test Traffic"}
          </button>

          {/* Export */}
          <button
            onClick={handleExportLogs}
            id="btn-export-logs"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-dark-300 text-xs font-medium transition-all cursor-pointer"
          >
            <HiOutlineDownload className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ─── Alert Banner ─── */}
      {alerts && alerts.length > 0 && !alertDismissed && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/5 border border-warning/15 animate-slide-up">
          <HiOutlineBell className="w-5 h-5 text-warning animate-pulse shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-warning">
              {alerts.length} blocked IP{alerts.length > 1 ? "s" : ""} detected
            </p>
          </div>
          <button
            onClick={onNavigateToAlerts}
            className="px-3 py-1 bg-warning/10 hover:bg-warning/20 text-warning text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Review
          </button>
          <button
            onClick={() => setAlertDismissed(true)}
            className="text-warning/50 hover:text-warning text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* ─── Stat Cards (5 columns) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Req / Min"
          value={stats?.rpm}
          icon="⚡"
          accentColor="indigo"
          index={0}
        />
        <StatCard
          label="Req / Hour"
          value={stats?.rph}
          icon="📊"
          accentColor="purple"
          index={1}
        />
        <StatCard
          label="Blocked"
          value={stats?.blocked}
          icon="🚫"
          accentColor="red"
          subtext={stats?.blocked === 0 ? "No blocked IPs" : undefined}
          index={2}
        />
        <StatCard
          label="Active Users"
          value={stats?.activeUsers}
          icon="👥"
          accentColor="green"
          index={3}
        />
        <StatCard
          label="Avg Latency"
          value={stats?.avgLatency}
          icon="⏱️"
          accentColor="amber"
          suffix="ms"
          index={4}
        />
      </div>

      {/* ─── Charts: Timeline (2/3) + Status Donut (1/3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Timeline */}
        <div className="lg:col-span-2 glass rounded-2xl border border-white/[0.06] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Request Timeline</h3>
          <div className="h-[280px]">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="gradientRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#52526e", fontSize: 10 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#52526e", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Requests"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fill="url(#gradientRequests)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#818cf8", stroke: "#0a0b0f", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Blocked"
                    stroke="#f87171"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    fill="url(#gradientBlocked)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-dark-400">
                  No timeline data yet —{" "}
                  <button onClick={handleTestTraffic} className="text-accent-indigo hover:underline cursor-pointer">
                    generate traffic
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown Donut */}
        <div className="glass rounded-2xl border border-white/[0.06] p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4">
            Status Breakdown
          </h3>
          <div className="flex-1 flex items-center justify-center">
            {statusData.some((d) => d.value > 0) ? (
              <DonutChart data={statusData} />
            ) : (
              <div className="text-center">
                <p className="text-sm text-dark-400">No status data</p>
                <p className="text-xs text-dark-500 mt-1">
                  Send requests to see breakdown
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Live Feed + Top IPs ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveFeed recentLogs={recentLogs} onNavigateToTester={onNavigateToTester} />
        </div>
        <div>
          <UsersTable
            topUsers={topUsers}
            onRefresh={refresh}
            onNavigateToTester={onNavigateToTester}
          />
        </div>
      </div>

      {/* ─── Quick Actions Strip ─── */}
      <div>
        <p className="text-[10px] text-dark-500 uppercase tracking-[0.2em] font-semibold mb-3">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-2.5">
          {[
            { icon: "▶", label: "Run Test Traffic", onClick: handleTestTraffic, disabled: isSimulating },
            { icon: "🛑", label: "View Blocked Users", onClick: onNavigateToBlocked },
            { icon: "🔑", label: "Generate API Key", onClick: onNavigateToKeys },
            { icon: "📩", label: "Set Alert", onClick: onNavigateToAlerts },
            { icon: "↓", label: "Export CSV", onClick: handleExportLogs },
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-dark-300 hover:text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{action.icon}</span> {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
