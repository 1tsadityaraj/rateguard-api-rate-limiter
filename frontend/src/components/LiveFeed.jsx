import { useRef, useEffect } from "react";

/**
 * Live request feed — scrollable list with new items sliding in from top.
 * Shows colored status dots, IP in cyan, HTTP code badges, and timestamps.
 */
export default function LiveFeed({ recentLogs = [], onNavigateToTester }) {
  const feedRef = useRef(null);

  // Auto-scroll to top on new entries
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [recentLogs.length]);

  const getStatusStyle = (status) => {
    if (status < 300) return { dot: "status-dot-success", badge: "bg-success/15 text-success", label: status };
    if (status === 429) return { dot: "status-dot-warning", badge: "bg-warning/15 text-warning", label: "429" };
    if (status === 403) return { dot: "status-dot-danger", badge: "bg-danger/15 text-danger", label: "403" };
    return { dot: "status-dot-danger", badge: "bg-danger/15 text-danger", label: status };
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden h-[340px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="status-dot-success" />
          <h3 className="text-sm font-semibold text-white">Live Request Feed</h3>
        </div>
        <span className="text-[10px] text-dark-400 font-mono">{recentLogs.length} entries</span>
      </div>

      {/* Feed List */}
      <div ref={feedRef} className="flex-1 overflow-y-auto">
        {recentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <span className="text-2xl mb-2">🚀</span>
            <p className="text-sm font-medium text-dark-300">No live requests yet</p>
            <p className="text-xs text-dark-500 mt-1">
              {onNavigateToTester ? (
                <button
                  onClick={onNavigateToTester}
                  className="text-accent-indigo hover:underline cursor-pointer"
                >
                  Click Run Test Traffic to populate
                </button>
              ) : (
                "Start sending requests to see live activity"
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recentLogs.map((log, i) => {
              const style = getStatusStyle(log.status || log.statusCode || 200);
              return (
                <div
                  key={`${log.timestamp}-${i}`}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors animate-slide-up"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  {/* Status dot */}
                  <span className={style.dot} />

                  {/* Method + Route */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-dark-300 uppercase font-mono">
                        {log.method}
                      </span>
                      <span className="text-xs text-dark-400 truncate font-mono">
                        {log.route || log.path}
                      </span>
                    </div>
                  </div>

                  {/* IP */}
                  <span className="text-[11px] text-accent-cyan font-mono shrink-0">
                    {log.ip}
                  </span>

                  {/* Status Badge */}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${style.badge}`}>
                    {style.label}
                  </span>

                  {/* Latency */}
                  {(log.latency || log.responseTime) && (
                    <span className="text-[10px] text-dark-500 font-mono w-10 text-right shrink-0">
                      {log.latency || log.responseTime}ms
                    </span>
                  )}

                  {/* Timestamp */}
                  <span className="text-[10px] text-dark-500 font-mono shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
