import { useState, useEffect } from "react";
import { fetchBlockedUsers, unblockUser as apiUnblock } from "../services/api";
import toast from "react-hot-toast";

/**
 * Blocked Users page — table of blocked IPs with TTL and unblock button.
 */
export default function BlockedUsers() {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBlocked = async () => {
    try {
      const data = await fetchBlockedUsers();
      setBlocked(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load blocked users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocked();
    const interval = setInterval(loadBlocked, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUnblock = async (identifier) => {
    try {
      await apiUnblock(identifier);
      toast.success(`Unblocked ${identifier}`);
      loadBlocked();
    } catch {
      toast.error("Failed to unblock");
    }
  };

  const formatTTL = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Blocked Users
        </h1>
        <p className="text-sm text-dark-400 mt-0.5">
          Manage temporarily blocked IPs and identifiers
        </p>
      </div>

      <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-white/10 border-t-accent-indigo rounded-full animate-spin mx-auto" />
          </div>
        ) : blocked.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-3xl mb-3 block">🟢</span>
            <p className="text-sm font-medium text-dark-300">
              No blocked users
            </p>
            <p className="text-xs text-dark-500 mt-1">
              All IPs are currently allowed
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-6 py-3">
                  Identifier
                </th>
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-4 py-3">
                  Time Remaining
                </th>
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-4 py-3">
                  Expires At
                </th>
                <th className="text-right text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {blocked.map((user, i) => (
                <tr
                  key={user.identifier}
                  className="hover:bg-white/[0.02] transition-colors animate-slide-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-mono text-accent-cyan">
                      {user.identifier}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-mono text-warning font-semibold">
                      {formatTTL(user.ttl)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-dark-400 font-mono">
                      {new Date(user.expiresAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => handleUnblock(user.identifier)}
                      className="px-3 py-1.5 rounded-lg bg-success/10 hover:bg-success/20 text-success text-xs font-semibold border border-success/20 transition-all cursor-pointer"
                    >
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
