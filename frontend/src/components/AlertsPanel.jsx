import {
  HiOutlineExclamationCircle,
  HiOutlineShieldExclamation,
  HiOutlineLightningBolt,
  HiOutlineBan,
  HiOutlineRefresh,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { blockUser } from "../services/api";

const SEVERITY_STYLES = {
  critical: {
    bg: "bg-danger/10",
    border: "border-danger/30",
    text: "text-danger",
    badge: "bg-danger/20 text-danger",
    icon: HiOutlineShieldExclamation,
  },
  warning: {
    bg: "bg-accent-orange/10",
    border: "border-accent-orange/30",
    text: "text-accent-orange",
    badge: "bg-accent-orange/20 text-accent-orange",
    icon: HiOutlineExclamationCircle,
  },
  info: {
    bg: "bg-accent-blue/10",
    border: "border-accent-blue/30",
    text: "text-accent-blue",
    badge: "bg-accent-blue/20 text-accent-blue",
    icon: HiOutlineLightningBolt,
  },
};

/**
 * Alerts panel displaying detected abuse spikes and anomalies.
 * Each alert shows IP, request count, severity, and action to block.
 */
export default function AlertsPanel({ alerts, onRefresh }) {
  const handleBlockIP = async (ip) => {
    try {
      await blockUser(ip, 10);
      toast.success(`Blocked ${ip} for 10 minutes`);
      onRefresh?.();
    } catch {
      toast.error("Failed to block IP");
    }
  };

  const criticalCount = alerts?.filter((a) => a.severity === "critical").length || 0;
  const warningCount = alerts?.filter((a) => a.severity === "warning").length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl border border-danger/20 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
              <HiOutlineShieldExclamation className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{criticalCount}</p>
              <p className="text-xs text-dark-400 font-medium">Critical Alerts</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl border border-accent-orange/20 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center">
              <HiOutlineExclamationCircle className="w-5 h-5 text-accent-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{warningCount}</p>
              <p className="text-xs text-dark-400 font-medium">Warnings</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl border border-accent-blue/20 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
              <HiOutlineLightningBolt className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{alerts?.length || 0}</p>
              <p className="text-xs text-dark-400 font-medium">Total Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-4 h-4 text-accent-orange" />
            Active Alerts
            <span className="text-dark-400 font-normal">(Last 5 min)</span>
          </h3>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-all cursor-pointer"
            title="Refresh"
          >
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
        </div>

        {!alerts?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-dark-400">
            <HiOutlineShieldExclamation className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">All clear — no abuse detected</p>
            <p className="text-xs mt-1 text-dark-500">
              Alerts trigger when an IP exceeds 50 requests in 5 minutes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
              const Icon = style.icon;
              return (
                <div
                  key={alert.ip + i}
                  className={`flex items-start gap-4 p-4 rounded-xl border ${style.border} ${style.bg}/5 hover:${style.bg}/10 transition-all animate-slide-up`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className={`w-5 h-5 ${style.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-white font-mono">{alert.ip}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${style.badge}`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                          alert.type === "abuse"
                            ? "bg-danger/10 text-danger"
                            : "bg-accent-blue/10 text-accent-blue"
                        }`}
                      >
                        {alert.type}
                      </span>
                    </div>
                    <p className="text-xs text-dark-400 mt-1">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-dark-300">
                      <span>
                        Requests: <strong className="text-white">{alert.requestCount}</strong>
                      </span>
                      {alert.blockedCount > 0 && (
                        <span>
                          Blocked: <strong className="text-danger">{alert.blockedCount}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBlockIP(alert.ip)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 transition-colors cursor-pointer shrink-0"
                  >
                    <HiOutlineBan className="w-3.5 h-3.5" />
                    Block
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
