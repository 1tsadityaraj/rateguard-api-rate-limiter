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
              glass rounded-3xl p-5 border ${card.border}
              hover:-translate-y-1 hover:shadow-2xl transition-all duration-300
              animate-slide-up relative overflow-hidden
            `}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div
              className={`
                w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient}
                flex items-center justify-center mb-3
              `}
            >
              <Icon className={`w-5 h-5 ${card.text}`} />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-xs text-dark-300 mt-1 font-medium">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
