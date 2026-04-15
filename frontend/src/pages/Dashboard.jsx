import { useState } from "react";
import { HiOutlineLightningBolt } from "react-icons/hi";
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
  const { stats, topUsers, recentLogs, loading, error, refresh } = useDashboardData();
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-16 w-1/3 bg-dark-800/50 rounded-2xl border border-white/5" />
        
        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-dark-800/50 rounded-3xl border border-white/5" />
          ))}
        </div>
        
        {/* Skeleton Quick Actions */}
        <div className="h-20 w-full bg-dark-800/50 rounded-3xl border border-white/5" />

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-dark-800/50 rounded-3xl border border-white/5" />
          <div className="h-[350px] bg-dark-800/50 rounded-3xl border border-white/5" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-dark-800/50 rounded-3xl border border-white/5" />
          <div className="h-72 bg-dark-800/50 rounded-3xl border border-white/5" />
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

  const hasTraffic = stats?.requestsPerMinute > 0 || (stats?.timeline && stats.timeline.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(6,214,160,0.8)]" />
              <span className="text-[10px] uppercase font-semibold tracking-wider text-success">Live Monitoring Active</span>
            </div>
          </div>
          <p className="text-sm text-dark-400 mt-1">Monitor API traffic and system activity in real-time.</p>
        </div>

        <button
          onClick={handleTestTraffic}
          disabled={isSimulating}
          className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:scale-[1.02]"
        >
          {/* Subtle gradient glow behind the button */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-purple/20 to-accent-cyan/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <HiOutlineLightningBolt className={`w-4 h-4 z-10 ${isSimulating ? "animate-pulse text-accent-purple" : "text-white"}`} />
          <span className="z-10">{isSimulating ? "Generating Traffic..." : "Run Test Traffic"}</span>
        </button>
      </div>

      <StatsCards stats={stats} />

      {/* Quick Actions Section */}
      <div className="glass rounded-3xl p-5 border border-white/10 flex flex-col md:flex-row items-center gap-4">
        <span className="text-sm font-semibold text-white mr-2">Quick Actions:</span>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={onNavigateToTester}
            className="px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-medium transition-all duration-300 hover:scale-[1.02]"
          >
            Open Rate Tester
          </button>
          <button 
            onClick={onNavigateToBlocked}
            className="px-4 py-2 rounded-lg bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger text-xs font-medium transition-all duration-300 hover:scale-[1.02]"
          >
            View Blocked Users
          </button>
          <button 
            onClick={onNavigateToKeys}
            className="px-4 py-2 rounded-lg bg-success/10 hover:bg-success/20 border border-success/20 text-success text-xs font-medium transition-all duration-300 hover:scale-[1.02]"
          >
            Manage API Keys
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RequestChart timeline={stats?.timeline || []} onNavigateToTester={onNavigateToTester} />
        </div>
        <div>
          <StatusBreakdown statusBreakdown={stats?.statusBreakdown} onNavigateToTester={onNavigateToTester} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopUsersTable topUsers={topUsers} onRefresh={refresh} onNavigateToTester={onNavigateToTester} />
        </div>
        <div>
          <LiveFeed recentLogs={recentLogs} onNavigateToTester={onNavigateToTester} />
        </div>
      </div>
    </div>
  );
}
