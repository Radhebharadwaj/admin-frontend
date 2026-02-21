"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950/95 border border-zinc-700 rounded-xl p-3 shadow-xl backdrop-blur-md">
      <p className="text-xs text-zinc-400 font-medium mb-1">{label}</p>
      <p className="text-sm font-bold text-white">
        ₹{payload[0].value?.toLocaleString("en-IN")}
      </p>
      {payload[0].payload?.orders !== undefined && (
        <p className="text-[10px] text-zinc-500 mt-0.5">
          {payload[0].payload.orders} order{payload[0].payload.orders !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export default function AnalyticsChart({ data }: { data: any[] }) {
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#818cf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
