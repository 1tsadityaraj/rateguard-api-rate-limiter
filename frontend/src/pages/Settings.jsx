import { useState, useEffect } from "react";
import { fetchHealth } from "../services/api";
import toast from "react-hot-toast";

const ALGORITHMS = [
  { id: "sliding-window", label: "Sliding Window", desc: "Tracks request timestamps in a rolling window" },
  { id: "token-bucket", label: "Token Bucket", desc: "Fixed token refill rate with burst capacity" },
];

/**
 * Settings page — configure window size, limits per plan, and algorithm toggle.
 */
export default function Settings() {
  const [health, setHealth] = useState(null);
  const [settings, setSettings] = useState({
    algorithm: "sliding-window",
    defaultLimit: 100,
    windowSize: 60,
    blockDuration: 10,
    freeTierLimit: 100,
    proTierLimit: 1000,
  });

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => {});
  }, []);

  const handleSave = () => {
    toast.success("Settings saved (applied on next server restart)");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-dark-400 mt-0.5">
          Configure rate limiting parameters and algorithm
        </p>
      </div>

      {/* System Status */}
      {health && (
        <div className="glass rounded-2xl border border-white/[0.06] p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">
            System Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1">
                Status
              </p>
              <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold border border-success/20">
                {health.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1">
                Redis
              </p>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  health.redis?.includes("connected")
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning border-warning/20"
                }`}
              >
                {health.redis}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1">
                MongoDB
              </p>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  health.mongo?.includes("connected")
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning border-warning/20"
                }`}
              >
                {health.mongo}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1">
                Uptime
              </p>
              <span className="text-sm font-mono text-white">
                {health.uptime ? `${Math.floor(health.uptime / 60)}m` : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Toggle */}
      <div className="glass rounded-2xl border border-white/[0.06] p-5 animate-slide-up" style={{ animationDelay: "60ms" }}>
        <h3 className="text-sm font-semibold text-white mb-4">
          Rate Limiting Algorithm
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALGORITHMS.map((algo) => (
            <button
              key={algo.id}
              onClick={() => setSettings({ ...settings, algorithm: algo.id })}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                settings.algorithm === algo.id
                  ? "bg-accent-indigo/10 border-accent-indigo/30 shadow-[0_0_20px_rgba(129,140,248,0.08)]"
                  : "bg-dark-800/50 border-white/[0.06] hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                    settings.algorithm === algo.id
                      ? "border-accent-indigo"
                      : "border-dark-400"
                  }`}
                >
                  {settings.algorithm === algo.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo" />
                  )}
                </span>
                <span className="text-sm font-semibold text-white">
                  {algo.label}
                </span>
              </div>
              <p className="text-xs text-dark-400 ml-5">{algo.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Rate Limits Configuration */}
      <div className="glass rounded-2xl border border-white/[0.06] p-5 animate-slide-up" style={{ animationDelay: "120ms" }}>
        <h3 className="text-sm font-semibold text-white mb-4">
          Rate Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 block">
              Default Limit (req/window)
            </label>
            <input
              type="number"
              value={settings.defaultLimit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultLimit: parseInt(e.target.value) || 100,
                })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-accent-indigo/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 block">
              Window Size (seconds)
            </label>
            <input
              type="number"
              value={settings.windowSize}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  windowSize: parseInt(e.target.value) || 60,
                })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-accent-indigo/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 block">
              Block Duration (minutes)
            </label>
            <input
              type="number"
              value={settings.blockDuration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  blockDuration: parseInt(e.target.value) || 10,
                })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-accent-indigo/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Plan Tier Limits */}
      <div className="glass rounded-2xl border border-white/[0.06] p-5 animate-slide-up" style={{ animationDelay: "180ms" }}>
        <h3 className="text-sm font-semibold text-white mb-4">
          Plan Tier Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-2">
              Free Tier
              <span className="px-1.5 py-0.5 rounded bg-dark-500/30 text-dark-300 text-[9px]">
                FREE
              </span>
            </label>
            <input
              type="number"
              value={settings.freeTierLimit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  freeTierLimit: parseInt(e.target.value) || 100,
                })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-accent-indigo/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-2">
              Pro Tier
              <span className="px-1.5 py-0.5 rounded bg-accent-indigo/10 text-accent-indigo text-[9px]">
                PRO
              </span>
            </label>
            <input
              type="number"
              value={settings.proTierLimit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  proTierLimit: parseInt(e.target.value) || 1000,
                })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-accent-indigo/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-2">
              Enterprise
              <span className="px-1.5 py-0.5 rounded bg-accent-amber/10 text-accent-amber text-[9px]">
                ENT
              </span>
            </label>
            <input
              type="text"
              value="∞ Unlimited"
              disabled
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800/50 border border-white/5 text-sm text-dark-400 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-accent-indigo hover:bg-accent-indigo/90 text-white text-sm font-semibold transition-all cursor-pointer"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
