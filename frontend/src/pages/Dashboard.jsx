import { useState } from "react";
import {
  HiOutlineLightningBolt,
  HiOutlineDownload,
  HiOutlineBan,
  HiOutlineKey,
  HiOutlineBell,
} from "react-icons/hi";
import { useDashboardData } from "../hooks/useDashboardData";
import StatsCards from "../components/StatsCards";
import RequestChart from "../components/RequestChart";
import StatusBreakdown from "../components/StatusBreakdown";
import TopUsersTable from "../components/TopUsersTable";
import LiveFeed from "../components/LiveFeed";
import toast from "react-hot-toast";

/**
 * Main dashboard view showing real-time stats, charts, live feed, and top users table.
 */
export default function Dashboard({ 
  onNavigateToTester, 
  onNavigateToBlocked, 
  onNavigateToKeys 
}) {
  const { stats, topUsers, recentLogs, alerts, loading, error, refresh } = useDashboardData();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleTestTraffic = async () => {
    setIsSimulating(true);
    toast("Generating test traffic...", { icon: "🚀" });
    try {
      const promises = Array.from({ length: 15 }).map(() => fetch("/api/health"));
      await Promise.all(promises);
      toast.success("Traffic generated!");
    } catch {
      toast.error("Traffic generation failed.");
    } finally {
      setIsSimulating(false);
      refresh();
    }
  };

  const handleExportLogs = () => {
    toast.success("Exporting logs as CSV...");
    // TODO: implement actual CSV export
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-16 w-1/3 bg-dark-800/50 rounded-2xl border border-white/5" />
        
        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 bg-dark-800/50 rounded-2xl border border-white/5" />
          ))}
        </div>
        
        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-dark-800/50 rounded-2xl border border-white/5" />
          <div className="h-[350px] bg-dark-800/50 rounded-2xl border border-white/5" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-dark-800/50 rounded-2xl border border-white/5" />
          <div className="h-72 bg-dark-800/50 rounded-2xl border border-white/5" />
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
          className="mt-3 px-4 py-2 rounded-xl bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 transition-all duration-300 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-dark-400 mt-1">
            Monitor API traffic and detect anomalies in real time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Monitoring Badge Block */}
          <div className="flex flex-col justify-center px-4 py-3 rounded-xl bg-dark-800 border border-white/5 h-[72px] min-w-[120px]">
            <span className="text-success text-[13px] font-medium leading-tight">Live</span>
            <span className="text-success text-[13px] font-medium flex items-center leading-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse mr-1.5 shadow-[0_0_8px_rgba(6,214,160,0.8)]" />
              Monitoring
            </span>
            <span className="text-success text-[13px] font-medium leading-tight ml-3">Active</span>
          </div>

          {/* Run Test Traffic Block */}
          <button
            onClick={handleTestTraffic}
            disabled={isSimulating}
            className="flex flex-col justify-center px-4 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-white/5 hover:border-white/10 transition-all duration-300 h-[72px] min-w-[120px] text-left cursor-pointer disabled:opacity-50"
          >
            <span className="text-dark-300 text-[13px] font-medium leading-tight flex items-center gap-1">
              <span className="text-[10px]">▶</span> {isSimulating ? "Generating" : "Run"}
            </span>
            <span className="text-dark-400 text-[13px] font-medium leading-tight ml-3.5">Test</span>
            <span className="text-dark-400 text-[13px] font-medium leading-tight ml-3.5">Traffic</span>
          </button>

          {/* Export Logs Block */}
          <button
            onClick={handleExportLogs}
            className="flex flex-col justify-center px-4 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-white/5 hover:border-white/10 transition-all duration-300 h-[72px] min-w-[120px] text-left cursor-pointer"
          >
            <span className="text-dark-300 text-sm font-medium leading-tight flex justify-center w-full mb-0.5">
              <HiOutlineDownload className="w-4 h-4" />
            </span>
            <span className="text-dark-400 text-[13px] font-medium leading-tight text-center w-full">Export</span>
            <span className="text-dark-400 text-[13px] font-medium leading-tight text-center w-full">Logs</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts && alerts.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 animate-slide-up">
          <HiOutlineBell className="w-5 h-5 text-danger animate-pulse" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-danger">Active System Alerts</h4>
            <p className="text-xs text-danger/80">
              {alerts.length} alert(s) require your attention. Check the Alerts panel for details.
            </p>
          </div>
          <button 
            onClick={() => toast("View alerts functionality mapped to Alerts panel.")}
            className="px-3 py-1.5 bg-danger/20 hover:bg-danger/30 text-danger text-xs font-medium rounded-lg transition-colors"
          >
            Review Alerts
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts Section: Request Timeline + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RequestChart timeline={stats?.timeline || []} onNavigateToTester={onNavigateToTester} />
        </div>
        <div>
          <StatusBreakdown statusBreakdown={stats?.statusBreakdown} onNavigateToTester={onNavigateToTester} />
        </div>
      </div>

      {/* Live Feed + Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveFeed recentLogs={recentLogs} onNavigateToTester={onNavigateToTester} />
        </div>
        <div>
          <TopUsersTable topUsers={topUsers} onRefresh={refresh} onNavigateToTester={onNavigateToTester} />
        </div>
      </div>

      {/* Quick Actions Section */}
      <div>
        <p className="text-[11px] text-dark-400 uppercase tracking-widest font-semibold mb-3">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestTraffic}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all duration-300 disabled:opacity-50 cursor-pointer"
          >
            <span>▶</span> Run Test Traffic
          </button>
          <button
            onClick={onNavigateToBlocked}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all duration-300 cursor-pointer"
          >
            <span>🔴</span> View Blocked Users
          </button>
          <button
            onClick={onNavigateToKeys}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all duration-300 cursor-pointer"
          >
            <span>🔑</span> Generate API Key
          </button>
          <button
            onClick={() => toast("Alert threshold feature coming soon!", { icon: "📁" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all duration-300 cursor-pointer"
          >
            <span>📩</span> Set Alert Threshold
          </button>
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all duration-300 cursor-pointer"
          >
            <span>↓</span> Export Logs as CSV
          </button>
        </div>
      </div>
    </div>
  );
}
