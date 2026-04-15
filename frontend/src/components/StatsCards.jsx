import {
  HiOutlineLightningBolt,
  HiOutlineBan,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
} from "react-icons/hi";

const cards = [
  {
    key: "requestsPerMinute",
    label: "Requests / Min",
    icon: HiOutlineLightningBolt,
    color: "cyan",
    gradient: "from-accent-cyan/20 to-accent-cyan/5",
    border: "border-accent-cyan/20",
    text: "text-accent-cyan",
  },
  {
    key: "requestsPerHour",
    label: "Requests / Hour",
    icon: HiOutlineClock,
    color: "blue",
    gradient: "from-accent-blue/20 to-accent-blue/5",
    border: "border-accent-blue/20",
    text: "text-accent-blue",
  },
  {
    key: "requestsPerDay",
    label: "Requests / Day",
    icon: HiOutlineChartBar,
    color: "purple",
    gradient: "from-accent-purple/20 to-accent-purple/5",
    border: "border-accent-purple/20",
    text: "text-accent-purple",
  },
  {
    key: "blockedRequests",
    label: "Blocked Today",
    icon: HiOutlineBan,
    color: "pink",
    gradient: "from-accent-pink/20 to-accent-pink/5",
    border: "border-accent-pink/20",
    text: "text-accent-pink",
  },
  {
    key: "activeUsers",
    label: "Active Users",
    icon: HiOutlineUsers,
    color: "orange",
    gradient: "from-accent-orange/20 to-accent-orange/5",
    border: "border-accent-orange/20",
    text: "text-accent-orange",
  },
  {
    key: "blockedUsersCount",
    label: "Blocked Users",
    icon: HiOutlineShieldCheck,
    color: "yellow",
    gradient: "from-accent-yellow/20 to-accent-yellow/5",
    border: "border-accent-yellow/20",
    text: "text-accent-yellow",
  },
];

/**
 * Grid of stat cards showing key rate-limiter metrics.
 */
export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const value = stats?.[card.key] ?? "—";
        return (
          <div
            key={card.key}
            className={`
              glass rounded-3xl p-5 border ${card.border} bg-gradient-to-b from-white/[0.02] to-transparent
              hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] 
              transition-all duration-300 relative overflow-hidden group
            `}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`
                  w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} shadow-inner
                  flex items-center justify-center border border-white/5
                  group-hover:scale-110 transition-transform duration-300
                `}
              >
                <Icon className={`w-5 h-5 ${card.text}`} />
              </div>
              <p className="text-sm text-dark-300 font-medium tracking-wide">{card.label}</p>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <div className="mt-3">
              {value === 0 || value === "—" ? (
                <p className="text-xs text-dark-400 mt-2 flex items-center gap-1.5 opacity-80">
                  <span className="w-1.5 h-1.5 rounded-full bg-dark-500 shrink-0" />
                  No activity yet
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
