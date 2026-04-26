import { useState, useEffect } from "react";
import { fetchAlerts } from "../services/api";
import { getSocket } from "../services/socket";
import toast from "react-hot-toast";

/**
 * Alerts page — list of spike/block alerts with timestamps and severity.
 */
export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts()
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load alerts"))
      .finally(() => setLoading(false));

    // Listen for real-time alerts
    const socket = getSocket();
    const handleAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 100));
    };
    socket.on("alert", handleAlert);
    return () => socket.off("alert", handleAlert);
  }, []);

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-danger/10 border-danger/20 text-danger";
      case "warning":
        return "bg-warning/10 border-warning/20 text-warning";
      default:
        return "bg-info/10 border-info/20 text-info";
    }
  };

  const getTypeIcon = (type) => {
    return type === "block" ? "🚫" : "📈";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Alerts</h1>
        <p className="text-sm text-dark-400 mt-0.5">
          Traffic spikes and abuse detection alerts
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="glass rounded-2xl border border-white/[0.06] p-8 text-center">
            <div className="w-6 h-6 border-2 border-white/10 border-t-accent-indigo rounded-full animate-spin mx-auto" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass rounded-2xl border border-white/[0.06] p-12 text-center">
            <span className="text-3xl mb-3 block">✅</span>
            <p className="text-sm font-medium text-dark-300">No alerts</p>
            <p className="text-xs text-dark-500 mt-1">
              Everything looks good — no traffic anomalies detected
            </p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div
              key={i}
              className={`glass rounded-xl border p-4 flex items-start gap-3 animate-slide-up ${getSeverityStyle(
                alert.severity
              )}`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="text-lg shrink-0 mt-0.5">
                {getTypeIcon(alert.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getSeverityStyle(
                      alert.severity
                    )}`}
                  >
                    {alert.severity || "info"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {alert.type}
                  </span>
                </div>
                <p className="text-sm font-medium text-white/90">
                  {alert.message}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs font-mono text-accent-cyan">
                    {alert.ip}
                  </span>
                  {alert.requestCount && (
                    <span className="text-[10px] text-dark-400 font-mono">
                      {alert.requestCount} requests
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-dark-500 font-mono shrink-0">
                {alert.timestamp
                  ? new Date(alert.timestamp).toLocaleTimeString()
                  : "now"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
