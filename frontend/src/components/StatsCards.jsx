import {
  HiOutlineLightningBolt,
  HiOutlineBan,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineChartBar,
} from "react-icons/hi";

const cards = [
  {
    key: "requestsPerMinute",
    label: "REQ / MIN",
    icon: "⚡",
    color: "cyan",
    border: "border-t-accent-cyan",
    text: "text-accent-cyan",
    emptyText: "Waiting for traffic...",
  },
  {
    key: "requestsPerHour",
    label: "REQ / HOUR",
    icon: "📊",
    color: "blue",
    border: "border-t-accent-blue",
    text: "text-accent-blue",
    emptyText: "No activity yet",
  },
  {
    key: "blockedRequests",
    label: "BLOCKED",
    icon: "🚫",
    color: "pink",
    border: "border-t-accent-pink",
    text: "text-accent-pink",
    emptyText: "No blocked IPs",
  },
  {
    key: "activeUsers",
    label: "ACTIVE USERS",
    icon: "👥",
    color: "orange",
    border: "border-t-accent-orange",
    text: "text-accent-orange",
    emptyText: "Idle",
  },
  {
    key: "avgLatency",
    label: "AVG LATENCY",
    icon: "⏱️",
    color: "purple",
    border: "border-t-accent-purple",
    text: "text-accent-purple",
    emptyText: "Waiting...",
    suffix: "ms",
  },
];

/**
 * Grid of stat cards showing key rate-limiter metrics.
 */
export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, i) => {
        const rawValue = stats?.[card.key];
        const value = rawValue ?? "—";
        const displayValue = typeof value === "number" && card.suffix 
          ? `${value}${card.suffix}` 
          : (typeof value === "number" ? value.toLocaleString() : value);

        return (
          <div
            key={card.key}
            className={`
              glass rounded-2xl p-4 sm:p-5 border border-white/10 border-t-2 ${card.border}
              hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] 
              transition-all duration-300 relative overflow-hidden group
            `}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Header row: label + icon */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-dark-300 font-semibold tracking-widest uppercase">
                {card.label}
              </p>
              <span className="text-lg opacity-80">{card.icon}</span>
            </div>

            {/* Value */}
            <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
              {displayValue}
            </p>

            {/* Subtitle */}
            <div className="mt-2">
              {value === 0 || value === "—" ? (
                <p className="text-xs text-dark-400 opacity-70">
                  {card.emptyText}
                </p>
              ) : (
                <p className="text-xs text-success flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                  Updated just now
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
