import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_COLORS = {
  success: "#06d6a0",
  redirect: "#4cc9f0",
  rate_limited: "#f72585",
  client_error: "#fb8500",
  server_error: "#ef4444",
};

const STATUS_LABELS = {
  success: "2xx Success",
  redirect: "3xx Redirect",
  rate_limited: "429 Rate Limited",
  client_error: "4xx Client Error",
  server_error: "5xx Server Error",
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="glass rounded-xl px-4 py-3 border border-white/10 shadow-2xl">
      <p className="text-sm text-white font-semibold">{STATUS_LABELS[name] || name}</p>
      <p className="text-xs text-dark-300 mt-1">{value.toLocaleString()} requests</p>
    </div>
  );
}

/**
 * Donut chart showing status code distribution.
 */
export default function StatusBreakdown({ statusBreakdown }) {
  const data = Object.entries(statusBreakdown || {}).map(([key, value]) => ({
    name: key,
    value,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (!data.length) {
    return (
      <div className="glass rounded-2xl border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Status Breakdown</h3>
        <div className="h-64 flex items-center justify-center text-dark-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/5 p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-white mb-4">
        Status Breakdown{" "}
        <span className="text-dark-400 font-normal">(24h)</span>
      </h3>
      <div className="flex flex-col items-center">
        <div className="relative w-full" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || "#52526e"}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">
              {total.toLocaleString()}
            </span>
            <span className="text-[10px] text-dark-400 uppercase tracking-wider">
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: STATUS_COLORS[entry.name] || "#52526e" }}
              />
              <span className="text-dark-300 truncate">
                {STATUS_LABELS[entry.name] || entry.name}
              </span>
              <span className="ml-auto text-white font-medium tabular-nums">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
