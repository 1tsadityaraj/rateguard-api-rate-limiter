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
export default function Dashboard({ onNavigateToTester }) {
  const { stats, topUsers, recentLogs, loading, error, refresh } = useDashboardData();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleTestTraffic = async () => {
    setIsSimulating(true);
    toast("Generating test traffic...", { icon: "🚀" });
    try {
      // Simulate traffic by hitting the health endpoint quickly
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
        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-dark-800/50 rounded-3xl border border-white/5" />
          ))}
        </div>
        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-dark-800/50 rounded-3xl border border-white/5" />
          <div className="h-80 bg-dark-800/50 rounded-3xl border border-white/5" />
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
          className="mt-3 px-4 py-2 rounded-xl bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-end absolute -top-12 right-0">
        <button
          onClick={handleTestTraffic}
          disabled={isSimulating}
          className="bg-accent-purple hover:bg-accent-purple/80 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(123,97,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
        >
          <HiOutlineLightningBolt className="w-4 h-4" />
          {isSimulating ? "Sending..." : "Run Test Traffic"}
        </button>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RequestChart timeline={stats?.timeline || []} />
        </div>
        <div>
          <StatusBreakdown statusBreakdown={stats?.statusBreakdown} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopUsersTable topUsers={topUsers} onRefresh={refresh} />
        </div>
        <div>
          <LiveFeed recentLogs={recentLogs} />
        </div>
      </div>
    </div>
  );
}
