import { HiOutlineBan, HiOutlineLockOpen } from "react-icons/hi";
import toast from "react-hot-toast";
import { blockUser, unblockUser } from "../services/api";

/**
 * Table of the most active users/IPs in the last hour.
 * Allows manual blocking/unblocking directly from the table.
 */
export default function TopUsersTable({ topUsers, onRefresh, onNavigateToTester }) {
  const handleBlock = async (identifier) => {
    try {
      await blockUser(identifier, 10);
      toast.success(`Blocked ${identifier} for 10 minutes`);
      onRefresh?.();
    } catch {
      toast.error("Failed to block user");
    }
  };

  const handleUnblock = async (identifier) => {
    try {
      await unblockUser(identifier);
      toast.success(`Unblocked ${identifier}`);
      onRefresh?.();
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  if (!topUsers?.length) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl h-full flex flex-col min-h-[350px]">
        <div className="flex items-baseline gap-2 mb-5">
          <h3 className="text-base font-bold text-white tracking-tight">
            Top IPs / Users
          </h3>
          <span className="text-xs text-dark-400">By request volume</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
          <p className="text-base font-semibold text-white">No traffic data yet</p>
          <p className="text-sm text-dark-400 text-center max-w-md">
            Start testing your API to see user stats here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl">
      <div className="flex items-baseline gap-2 mb-5">
        <h3 className="text-base font-bold text-white tracking-tight">
          Top IPs / Users
        </h3>
        <span className="text-xs text-dark-400">By request volume</span>
      </div>
      <div className="overflow-x-auto -mx-4 sm:-mx-6">
        <div className="min-w-[600px] px-4 sm:px-6">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 pb-3 border-b border-white/5 text-[11px] text-dark-400 uppercase tracking-wider font-medium">
            <div className="col-span-3">Identifier</div>
            <div className="col-span-3">Requests</div>
            <div className="col-span-1 text-right">Blocked</div>
            <div className="col-span-3 text-center">Last Seen</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Rows */}
          {topUsers.map((user, i) => {
            const identifier = user.userId || user.ip;
            const maxRequestCount = Math.max(...topUsers.map(u => u.requestCount || 0));
            const percentage = maxRequestCount > 0 ? (user.requestCount / maxRequestCount) * 100 : 0;
            
            return (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 py-3 border-b border-white/[0.03] items-center hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-3 flex items-center gap-2 min-w-0">
                  {user.isBlocked && (
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                  )}
                  <span className="text-sm text-white truncate font-mono">
                    {identifier}
                  </span>
                </div>
                <div className="col-span-3 flex items-center pr-4">
                  <div className="flex-1 max-w-[120px] h-1.5 bg-dark-600 rounded-full overflow-hidden mr-3">
                    <div 
                      className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-white font-semibold tabular-nums w-12">
                    {user.requestCount.toLocaleString()}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  {user.blockedCount > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-danger/10 text-danger text-xs font-medium">
                      {user.blockedCount}
                    </span>
                  ) : (
                    <span className="text-xs text-dark-400">0</span>
                  )}
                </div>
                <div className="col-span-3 text-xs text-dark-300 text-center">
                  {user.lastRequest
                    ? new Date(user.lastRequest).toLocaleTimeString()
                    : "—"}
                </div>
                <div className="col-span-2 text-right">
                  {user.isBlocked ? (
                    <button
                      onClick={() => handleUnblock(identifier)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors cursor-pointer"
                    >
                      <HiOutlineLockOpen className="w-3.5 h-3.5" />
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlock(identifier)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 transition-colors cursor-pointer"
                    >
                      <HiOutlineBan className="w-3.5 h-3.5" />
                      Block
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
