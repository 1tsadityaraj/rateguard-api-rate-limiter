import { useDashboardData } from "../hooks/useDashboardData";
import StatsCards from "../components/StatsCards";
import RequestChart from "../components/RequestChart";
import StatusBreakdown from "../components/StatusBreakdown";
import TopUsersTable from "../components/TopUsersTable";

/**
 * Main dashboard view showing real-time stats, charts, and top users table.
 */
export default function Dashboard() {
  const { stats, topUsers, timeline, loading, error, refresh } = useDashboardData();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-white/10 border-t-accent-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-danger">
        {error}
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

      <TopUsersTable topUsers={topUsers} onRefresh={refresh} />
    </div>
  );
}
