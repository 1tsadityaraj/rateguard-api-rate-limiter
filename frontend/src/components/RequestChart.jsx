import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/**
 * Custom tooltip for the request timeline chart.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-white/10 shadow-2xl">
      <p className="text-xs text-dark-300 mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-dark-300 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Area chart showing request volume + blocked requests over time.
 */
export default function RequestChart({ timeline }) {
  // Format time labels to be shorter (HH:MM)
  const data = (timeline || []).map((item) => ({
    ...item,
    time: item.time?.split("T")[1] || item.time,
  }));

  if (!data.length) {
    return (
      <div className="glass rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl">
        <h3 className="text-sm font-semibold text-white mb-4">
          Request Timeline
        </h3>
        <div className="h-64 flex items-center justify-center text-dark-400 text-sm">
          No timeline data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-4">
        Request Timeline{" "}
        <span className="text-dark-400 font-normal">(Last 60 min)</span>
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06d6a0" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#06d6a0" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f72585" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#f72585" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#52526e", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#52526e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px", color: "#52526e" }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="total"
            stroke="#06d6a0"
            strokeWidth={2}
            fill="url(#gradTotal)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#06d6a0" }}
          />
          <Area
            type="monotone"
            dataKey="blocked"
            name="blocked"
            stroke="#f72585"
            strokeWidth={2}
            fill="url(#gradBlocked)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#f72585" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
