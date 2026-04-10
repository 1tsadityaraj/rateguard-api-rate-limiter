import { useDashboardData } from "../hooks/useDashboardData";
import StatsCards from "../components/StatsCards";
import RequestChart from "../components/RequestChart";
import StatusBreakdown from "../components/StatusBreakdown";
import TopUsersTable from "../components/TopUsersTable";
import LiveFeed from "../components/LiveFeed";

/**
 * Main dashboard view showing real-time stats, charts, live feed, and top users table.
 */
export default function Dashboard() {
  const { stats, topUsers, recentLogs, loading, error, refresh } = useDashboardData();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-white/10 border-t-accent-cyan rounded-full animate-spin" />
          <p className="text-xs text-dark-400">Loading dashboard...</p>
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
    <div className="space-y-6">
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
