import { HiOutlineArrowRight } from "react-icons/hi";

/**
 * Live scrolling feed of recent request logs from Socket.io.
 * Shows method, path, status, and IP in a compact format.
 */
export default function LiveFeed({ recentLogs }) {
  if (!recentLogs?.length) {
    return (
      <div className="glass rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col h-full">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Live Request Feed
        </h3>
        <p className="text-xs text-dark-400 text-center py-8">
          Waiting for incoming requests...
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col h-full">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        Live Request Feed
        <span className="text-dark-400 font-normal text-xs">
          ({recentLogs.length} recent)
        </span>
      </h3>
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
