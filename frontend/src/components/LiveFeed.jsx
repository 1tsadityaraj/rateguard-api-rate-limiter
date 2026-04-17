import { HiOutlineArrowRight } from "react-icons/hi";

/**
 * Live scrolling feed of recent request logs from Socket.io.
 * Shows method, path, status, and IP in a compact format.
 */
export default function LiveFeed({ recentLogs, onNavigateToTester }) {
  const count = recentLogs?.length || 0;

  if (!count) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col h-full min-h-[350px]">
        <div className="flex items-baseline gap-3 mb-5">
          <h3 className="text-base font-bold text-white tracking-tight">
            Live Request Feed
          </h3>
          <span className="text-xs text-dark-400 font-mono">{count} requests</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center my-8 gap-3">
          <span className="text-4xl">🚀</span>
          <p className="text-base font-semibold text-white mt-2">No live requests yet</p>
          <p className="text-sm text-dark-400 text-center max-w-[220px]">
            Click <span className="text-white font-medium">Run Test Traffic</span> to populate the feed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col h-full">
      <div className="flex items-baseline gap-3 mb-5">
        <h3 className="text-base font-bold text-white tracking-tight">
          Live Request Feed
        </h3>
        <span className="text-xs text-dark-400 font-mono">{count} requests</span>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {recentLogs.slice(0, 30).map((log, i) => {
          const isBlocked = log.blocked || log.statusCode === 429;
          const methodColors = {
            GET: "text-accent-cyan",
            POST: "text-accent-blue",
            PUT: "text-accent-orange",
            DELETE: "text-danger",
            PATCH: "text-accent-purple",
          };

          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all animate-fade-in ${
                isBlocked
                  ? "bg-danger/5 hover:bg-danger/10"
                  : "hover:bg-white/[0.03]"
              }`}
            >
              <span className={`font-semibold ${methodColors[log.method] || "text-dark-300"} w-10`}>
                {log.method}
              </span>
              <span className="text-dark-300 truncate flex-1 max-w-[200px]">
                {log.path}
              </span>
              <HiOutlineArrowRight className="w-3 h-3 text-dark-500 shrink-0" />
              <span
                className={`font-semibold ${
                  log.statusCode < 300
                    ? "text-success"
                    : log.statusCode === 429
                    ? "text-danger"
                    : log.statusCode < 500
                    ? "text-accent-orange"
                    : "text-danger"
                }`}
              >
                {log.statusCode}
              </span>
              <span className="text-dark-500 w-20 text-right truncate">{log.ip}</span>
              {log.responseTime > 0 && (
                <span className="text-dark-500 tabular-nums w-12 text-right">
                  {log.responseTime}ms
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
