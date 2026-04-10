import { useState, useEffect } from "react";
import {
  HiOutlineKey,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineBadgeCheck,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { listApiKeys, createApiKey, revokeApiKey } from "../services/api";

const TIER_STYLES = {
  free: {
    badge: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20",
    label: "Free",
  },
  pro: {
    badge: "bg-accent-purple/10 text-accent-purple border border-accent-purple/20",
    label: "Pro",
  },
};

/**
 * API Keys management panel — create, view, copy, and revoke API keys.
 */
export default function ApiKeysPanel() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [form, setForm] = useState({ name: "", userId: "", tier: "free" });
  const [creating, setCreating] = useState(false);

  const fetchKeys = async () => {
    try {
      const data = await listApiKeys();
      setKeys(data);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.userId.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey(form.name, form.userId, form.tier);
      toast.success("API key created");
      setShowForm(false);
      setForm({ name: "", userId: "", tier: "free" });
      // Show the new key immediately
      if (result.apiKey?.key) {
        navigator.clipboard.writeText(result.apiKey.key).catch(() => {});
        toast.success("Key copied to clipboard", { icon: "📋" });
      }
      fetchKeys();
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id, keyName) => {
    if (!window.confirm(`Revoke API key "${keyName}"?`)) return;
    try {
      await revokeApiKey(id);
      toast.success("API key revoked");
      fetchKeys();
    } catch {
      toast.error("Failed to revoke key");
    }
  };

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard", { icon: "📋" });
  };

  const toggleVisibility = (id) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskKey = (key) => {
    if (key.length <= 12) return key;
    return key.slice(0, 8) + "•".repeat(Math.min(key.length - 12, 24)) + key.slice(-4);
  };

  const activeKeys = keys.filter((k) => k.active);
  const revokedKeys = keys.filter((k) => !k.active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HiOutlineKey className="w-5 h-5 text-accent-cyan" />
            API Keys
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">
            Manage tiered API keys for rate-limited access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchKeys}
            className="p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-all cursor-pointer"
            title="Refresh"
          >
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-medium hover:opacity-90 transition-all cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Key
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass rounded-2xl border border-accent-cyan/20 p-5 sm:p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Generate New API Key</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-dark-400 mb-1.5 font-medium">
                  Key Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Production Key"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1.5 font-medium">
                  User ID
                </label>
                <input
                  type="text"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  placeholder="e.g. user-123"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1.5 font-medium">
                  Tier
                </label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-accent-cyan/40 transition-all cursor-pointer"
                >
                  <option value="free">Free (30 req/min)</option>
                  <option value="pro">Pro (200 req/min)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={creating || !form.name.trim() || !form.userId.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
              >
                {creating ? "Creating..." : "Generate Key"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl bg-dark-700 text-dark-300 text-sm font-medium hover:text-white hover:bg-dark-600 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Keys */}
      <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineBadgeCheck className="w-4 h-4 text-success" />
          Active Keys
          <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-xs font-medium">
            {activeKeys.length}
          </span>
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-white/10 border-t-accent-cyan rounded-full animate-spin" />
          </div>
        ) : !activeKeys.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-dark-400">
            <HiOutlineKey className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No active API keys</p>
            <p className="text-xs mt-1 text-dark-500">
              Create a key to get started with rate-limited API access
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeKeys.map((apiKey) => {
              const tier = TIER_STYLES[apiKey.tier] || TIER_STYLES.free;
              const isVisible = visibleKeys.has(apiKey._id);
              return (
                <div
                  key={apiKey._id}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-dark-700/50 border border-white/[0.04] hover:border-white/10 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-white font-medium">{apiKey.name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${tier.badge}`}>
                        {tier.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-dark-300 font-mono">
                        {isVisible ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <button
                        onClick={() => toggleVisibility(apiKey._id)}
                        className="text-dark-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {isVisible ? (
                          <HiOutlineEyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <HiOutlineEye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[11px] text-dark-400">
                      <span>User: {apiKey.userId}</span>
                      <span>Requests: {(apiKey.requestCount || 0).toLocaleString()}</span>
                      {apiKey.createdAt && (
                        <span>
                          Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(apiKey.key)}
                      className="p-2 rounded-lg hover:bg-white/10 text-dark-300 hover:text-accent-cyan transition-all cursor-pointer"
                      title="Copy key"
                    >
                      <HiOutlineClipboardCopy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRevoke(apiKey._id, apiKey.name)}
                      className="p-2 rounded-lg hover:bg-danger/10 text-dark-300 hover:text-danger transition-all cursor-pointer"
                      title="Revoke key"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6 opacity-60">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <HiOutlineTrash className="w-4 h-4 text-dark-400" />
            Revoked Keys
            <span className="px-2 py-0.5 rounded-md bg-dark-600 text-dark-300 text-xs font-medium">
              {revokedKeys.length}
            </span>
          </h3>
          <div className="space-y-2">
            {revokedKeys.map((apiKey) => (
              <div
                key={apiKey._id}
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/30 border border-white/[0.02]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-dark-400 line-through">{apiKey.name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-dark-600 text-dark-400">
                      Revoked
                    </span>
                  </div>
                  <code className="text-xs text-dark-500 font-mono">{maskKey(apiKey.key)}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
