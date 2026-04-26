/**
 * Individual stat card with accent color, icon, big number, delta badge, and subtext.
 * Lifts on hover for premium interaction feel.
 */
export default function StatCard({
  label,
  value,
  icon,
  accentColor = "indigo",
  suffix = "",
  delta,
  subtext,
  index = 0,
}) {
  const colorMap = {
    indigo: {
      border: "border-t-accent-indigo",
      text: "text-accent-indigo",
      bg: "bg-accent-indigo/10",
      glow: "group-hover:shadow-[0_0_30px_rgba(129,140,248,0.08)]",
    },
    purple: {
      border: "border-t-accent-purple",
      text: "text-accent-purple",
      bg: "bg-accent-purple/10",
      glow: "group-hover:shadow-[0_0_30px_rgba(167,139,250,0.08)]",
    },
    red: {
      border: "border-t-accent-red",
      text: "text-accent-red",
      bg: "bg-accent-red/10",
      glow: "group-hover:shadow-[0_0_30px_rgba(248,113,113,0.08)]",
    },
    green: {
      border: "border-t-accent-green",
      text: "text-accent-green",
      bg: "bg-accent-green/10",
      glow: "group-hover:shadow-[0_0_30px_rgba(52,211,153,0.08)]",
    },
    amber: {
      border: "border-t-accent-amber",
      text: "text-accent-amber",
      bg: "bg-accent-amber/10",
      glow: "group-hover:shadow-[0_0_30px_rgba(251,191,36,0.08)]",
    },
  };

  const colors = colorMap[accentColor] || colorMap.indigo;

  const displayValue =
    value === null || value === undefined
      ? "—"
      : typeof value === "number"
      ? `${value.toLocaleString()}${suffix}`
      : `${value}${suffix}`;

  return (
    <div
      className={`
        glass rounded-2xl p-5 border-t-2 ${colors.border} ${colors.glow}
        hover:-translate-y-0.5 hover:border-white/10
        transition-all duration-300 relative overflow-hidden group animate-slide-up
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Background glow orb */}
      <div
        className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${colors.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Header: label + icon */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <p className="text-[10px] text-dark-400 font-semibold tracking-[0.15em] uppercase">
          {label}
        </p>
        <span className="text-base opacity-70">{icon}</span>
      </div>

      {/* Big Number */}
      <p className="text-3xl font-extrabold text-white tabular-nums tracking-tight font-mono relative z-10">
        {displayValue}
      </p>

      {/* Delta + Subtext */}
      <div className="mt-2 flex items-center gap-2 relative z-10">
        {delta !== undefined && delta !== null && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              delta >= 0
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
        <p className="text-[11px] text-dark-400">
          {subtext ||
            (displayValue === "—" ? "Waiting for data..." : "Updated just now")}
        </p>
      </div>
    </div>
  );
}
