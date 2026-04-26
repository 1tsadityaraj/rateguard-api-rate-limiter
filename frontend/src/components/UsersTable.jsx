/**
 * Top IPs table — IP | Requests | Progress bar | Status pill (Active / Warning / Blocked).
 */
export default function UsersTable({ topUsers = [], onRefresh, onNavigateToTester }) {
  const maxRequests = Math.max(...topUsers.map((u) => u.requestCount || 0), 1);

  const getStatus = (user) => {
    if (user.isBlocked) return { label: "Blocked", color: "bg-danger/15 text-danger border-danger/20" };
    if (user.blockedCount > 0) return { label: "Warning", color: "bg-warning/15 text-warning border-warning/20" };
    return { label: "Active", color: "bg-success/15 text-success border-success/20" };
  };

  return (
    <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden h-[340px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Top IPs</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-[10px] text-dark-400 hover:text-white transition-colors cursor-pointer"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {topUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <p className="text-sm font-medium text-dark-300">No traffic data yet</p>
            <p className="text-xs text-dark-500 mt-1">
              {onNavigateToTester ? (
                <button
                  onClick={onNavigateToTester}
                  className="text-accent-indigo hover:underline cursor-pointer"
                >
                  Start testing your API to see user stats
                </button>
              ) : (
                "Send some requests to populate this table"
              )}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-5 py-2">
                  IP Address
                </th>
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-3 py-2">
                  Requests
                </th>
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-3 py-2 hidden sm:table-cell">
                  Volume
                </th>
                <th className="text-right text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-5 py-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {topUsers.map((user, i) => {
                const status = getStatus(user);
                const pct = Math.round((user.requestCount / maxRequests) * 100);
                return (
                  <tr
                    key={user.ip || i}
                    className="hover:bg-white/[0.02] transition-colors animate-slide-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="px-5 py-2.5">
                      <span className="text-xs font-mono text-accent-cyan">
                        {user.ip}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-mono font-semibold text-white">
                        {user.requestCount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <div className="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            user.isBlocked
                              ? "bg-danger"
                              : user.blockedCount > 0
                              ? "bg-warning"
                              : "bg-accent-indigo"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
