import { useState, useEffect } from "react";
import { generateApiKey, listApiKeys, revokeApiKey } from "../services/api";
import toast from "react-hot-toast";
import { HiOutlineKey, HiOutlineClipboard, HiOutlineTrash } from "react-icons/hi";

const PLAN_LIMITS = {
  free: "100 req/min",
  pro: "1,000 req/min",
  enterprise: "Unlimited",
};

/**
 * API Keys page — generate, list, and revoke API keys with plan tier display.
 */
export default function APIKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", userId: "admin", tier: "free" });
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null);

  const loadKeys = async () => {
    try {
      const data = await listApiKeys();
      setKeys(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Key name is required");

    setCreating(true);
    try {
      const data = await generateApiKey(form.name, form.userId, form.tier);
      setNewKey(data.key || data);
      toast.success("API key generated!");
      setShowForm(false);
      setForm({ name: "", userId: "admin", tier: "free" });
      loadKeys();
    } catch {
      toast.error("Failed to generate key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeApiKey(id);
      toast.success("API key revoked");
      loadKeys();
    } catch {
      toast.error("Failed to revoke key");
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard!");
  };

  const getTierStyle = (tier) => {
    switch (tier) {
      case "enterprise":
        return "bg-accent-amber/10 text-accent-amber border-accent-amber/20";
      case "pro":
        return "bg-accent-indigo/10 text-accent-indigo border-accent-indigo/20";
      default:
        return "bg-dark-500/30 text-dark-300 border-dark-500/30";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            API Keys
          </h1>
          <p className="text-sm text-dark-400 mt-0.5">
            Generate and manage API keys for rate-limited access
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-indigo/10 hover:bg-accent-indigo/20 border border-accent-indigo/20 text-accent-indigo text-xs font-semibold transition-all cursor-pointer"
        >
          <HiOutlineKey className="w-4 h-4" /> Generate Key
        </button>
      </div>

      {/* New key display */}
      {newKey && (
        <div className="glass rounded-xl border border-success/20 p-4 animate-slide-up">
          <p className="text-xs text-success font-semibold mb-2">
            ✅ New API Key Generated — Copy it now, it won't be shown again!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-dark-950 border border-white/10 text-sm font-mono text-accent-cyan break-all">
              {typeof newKey === "string" ? newKey : newKey.key}
            </code>
            <button
              onClick={() => copyKey(typeof newKey === "string" ? newKey : newKey.key)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-dark-300 hover:text-white transition-colors cursor-pointer"
            >
              <HiOutlineClipboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generate Form */}
      {showForm && (
        <form
          onSubmit={handleGenerate}
          className="glass rounded-2xl border border-white/[0.06] p-5 space-y-4 animate-slide-up"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 block">
                Key Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Production API"
                className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-indigo/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 block">
                User ID
              </label>
              <input
                type="text"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-indigo/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 block">
                Plan Tier
              </label>
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white focus:outline-none focus:border-accent-indigo/40 transition-colors cursor-pointer"
              >
                <option value="free">Free — 100 req/min</option>
                <option value="pro">Pro — 1,000 req/min</option>
                <option value="enterprise">Enterprise — Unlimited</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2.5 rounded-xl bg-accent-indigo text-white text-xs font-semibold hover:bg-accent-indigo/90 transition-all cursor-pointer disabled:opacity-50"
            >
              {creating ? "Generating..." : "Generate API Key"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl bg-white/5 text-dark-300 text-xs font-medium hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Keys Table */}
      <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-white/10 border-t-accent-indigo rounded-full animate-spin mx-auto" />
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-3xl mb-3 block">🔑</span>
            <p className="text-sm font-medium text-dark-300">No API keys yet</p>
            <p className="text-xs text-dark-500 mt-1">
              Generate your first API key to get started
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-6 py-3">
                  Name
                </th>
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-4 py-3">
                  Key
                </th>
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-4 py-3">
                  Tier
                </th>
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-4 py-3">
                  Requests
                </th>
                <th className="text-left text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-right text-[10px] text-dark-500 font-semibold uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {keys.map((key, i) => (
                <tr
                  key={key._id}
                  className="hover:bg-white/[0.02] transition-colors animate-slide-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-6 py-3">
                    <span className="text-sm font-medium text-white">
                      {key.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <code className="text-[11px] font-mono text-dark-400">
                        {key.key?.slice(0, 20)}...
                      </code>
                      <button
                        onClick={() => copyKey(key.key)}
                        className="text-dark-500 hover:text-white transition-colors cursor-pointer"
                      >
                        <HiOutlineClipboard className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTierStyle(
                        key.tier
                      )}`}
                    >
                      {key.tier}
                    </span>
                    <span className="text-[10px] text-dark-500 ml-2">
                      {PLAN_LIMITS[key.tier]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-white">
                      {(key.requestCount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        key.active
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-danger/10 text-danger border border-danger/20"
                      }`}
                    >
                      {key.active ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {key.active && (
                      <button
                        onClick={() => handleRevoke(key._id)}
                        className="p-1.5 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger transition-colors cursor-pointer"
                        title="Revoke key"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
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
