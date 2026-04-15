import { HiOutlineArrowRight } from "react-icons/hi";

/**
 * Live scrolling feed of recent request logs from Socket.io.
 * Shows method, path, status, and IP in a compact format.
 */
export default function LiveFeed({ recentLogs, onNavigateToTester }) {
  if (!recentLogs?.length) {
    return (
      <div className="glass rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col h-full min-h-[350px]">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(6,214,160,0.8)]" />
          Live Request Feed
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center my-8 gap-3">
          <div className="w-16 h-16 rounded-full bg-dark-800/80 flex items-center justify-center mb-2 shadow-inner border border-white/5">
            <span className="text-2xl">📡</span>
          </div>
          <p className="text-base font-semibold text-white">No live requests yet</p>
          <p className="text-sm text-dark-400 text-center max-w-[220px]">
            Start testing your API to see real-time traffic flow here.
          </p>
          {onNavigateToTester && (
            <button
              onClick={onNavigateToTester}
              className="px-4 py-2 mt-3 rounded-xl bg-white/5 text-white text-sm font-medium hover:bg-white/10 border border-white/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              Start Testing
            </button>
          )}
        </div>
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
