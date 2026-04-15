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
      <div className="glass rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl h-full flex flex-col">
        <h3 className="text-sm font-semibold text-white mb-4">
          Top Users / IPs
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 min-h-[250px]">
          <div className="w-16 h-16 rounded-full bg-dark-800/80 flex items-center justify-center mb-2 shadow-inner border border-white/5">
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-base font-semibold text-white">No active users</p>
          <p className="text-sm text-dark-400 text-center max-w-md">
            Generate traffic to see the most active API clients here.
          </p>
          {onNavigateToTester && (
            <button
              onClick={onNavigateToTester}
              className="px-4 py-2 mt-3 rounded-xl bg-indigo-500/10 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              Generate Traffic
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-4">
        Top Users / IPs{" "}
        <span className="text-dark-400 font-normal">(Last hour)</span>
      </h3>
      <div className="overflow-x-auto -mx-4 sm:-mx-6">
        <div className="min-w-[600px] px-4 sm:px-6">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 pb-3 border-b border-white/5 text-[11px] text-dark-400 uppercase tracking-wider font-medium">
            <div className="col-span-3">Identifier</div>
            <div className="col-span-2 text-right">Requests</div>
            <div className="col-span-2 text-right">Blocked</div>
            <div className="col-span-3">Last Seen</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Rows */}
          {topUsers.map((user, i) => {
            const identifier = user.userId || user.ip;
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
                <div className="col-span-2 text-right text-sm text-white font-semibold tabular-nums">
                  {user.requestCount.toLocaleString()}
                </div>
                <div className="col-span-2 text-right">
                  {user.blockedCount > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-danger/10 text-danger text-xs font-medium">
                      {user.blockedCount}
                    </span>
                  ) : (
                    <span className="text-xs text-dark-400">0</span>
                  )}
                </div>
                <div className="col-span-3 text-xs text-dark-300">
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
