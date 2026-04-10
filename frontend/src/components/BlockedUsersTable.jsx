import { useState, useEffect } from "react";
import {
  HiOutlineLockOpen,
  HiOutlineClock,
  HiOutlineShieldExclamation,
  HiOutlineRefresh,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { unblockUser, blockUser } from "../services/api";

/**
 * Formats seconds into a human-readable countdown string.
 */
function formatTTL(seconds) {
  if (seconds <= 0) return "Expired";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Table showing all currently blocked users/IPs with remaining TTL
 * and the ability to unblock them. Also supports manually blocking new identifiers.
 */
export default function BlockedUsersTable({ blockedUsers, onRefresh }) {
  const [blockInput, setBlockInput] = useState("");
  const [blockDuration, setBlockDuration] = useState(10);
  const [blocking, setBlocking] = useState(false);
  const [ticker, setTicker] = useState(0);

  // Tick every second to update countdowns
  useEffect(() => {
    const id = setInterval(() => setTicker((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleUnblock = async (identifier) => {
    try {
      await unblockUser(identifier);
      toast.success(`Unblocked ${identifier}`);
      onRefresh?.();
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  const handleManualBlock = async (e) => {
    e.preventDefault();
    if (!blockInput.trim()) return;
    setBlocking(true);
    try {
      await blockUser(blockInput.trim(), blockDuration);
      toast.success(`Blocked ${blockInput.trim()} for ${blockDuration} minutes`);
      setBlockInput("");
      onRefresh?.();
    } catch {
      toast.error("Failed to block user");
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Block Form */}
      <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineShieldExclamation className="w-4 h-4 text-accent-pink" />
          Manually Block User / IP
        </h3>
        <form onSubmit={handleManualBlock} className="flex flex-wrap gap-3">
          <input
            type="text"
            value={blockInput}
            onChange={(e) => setBlockInput(e.target.value)}
            placeholder="IP address or User ID..."
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
          />
          <select
            value={blockDuration}
            onChange={(e) => setBlockDuration(Number(e.target.value))}
            className="px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-accent-cyan/40 transition-all cursor-pointer"
          >
            <option value={1}>1 min</option>
            <option value={5}>5 min</option>
            <option value={10}>10 min</option>
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
            <option value={1440}>24 hours</option>
          </select>
          <button
            type="submit"
            disabled={blocking || !blockInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
          >
            {blocking ? "Blocking..." : "Block"}
          </button>
        </form>
      </div>

      {/* Blocked Users List */}
      <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <HiOutlineClock className="w-4 h-4 text-accent-orange" />
            Currently Blocked
            {blockedUsers?.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-md bg-danger/10 text-danger text-xs font-medium">
                {blockedUsers.length}
              </span>
            )}
          </h3>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-all cursor-pointer"
            title="Refresh"
          >
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
        </div>

        {!blockedUsers?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-dark-400">
            <HiOutlineShieldExclamation className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No users are currently blocked</p>
            <p className="text-xs mt-1 text-dark-500">
              Blocked users will appear here when rate limits are exceeded
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((user, i) => {
              // Adjust TTL based on ticker to show countdown without re-fetching
              const adjustedTTL = Math.max(0, user.ttl - ticker);
              const progress = user.ttl > 0 ? (adjustedTTL / user.ttl) * 100 : 0;
              return (
                <div
                  key={user.identifier + i}
                  className="flex items-center gap-4 p-3 rounded-xl bg-dark-700/50 border border-white/[0.04] hover:border-white/10 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-mono truncate">
                      {user.identifier}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-dark-400">
                        Expires: {formatTTL(adjustedTTL)}
                      </span>
                      <div className="flex-1 h-1 rounded-full bg-dark-600 max-w-[100px] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-danger to-accent-orange transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(user.identifier)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors cursor-pointer opacity-60 group-hover:opacity-100"
                  >
                    <HiOutlineLockOpen className="w-3.5 h-3.5" />
                    Unblock
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
