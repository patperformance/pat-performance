"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function TrendChart({
  data,
  dataKey,
  color = "#22c55e",
  yDomain,
}: {
  data: { date: string; value: number }[];
  dataKey?: string;
  color?: string;
  yDomain?: [number, number];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#232323" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#8a8a8a", fontSize: 11 }}
          axisLine={{ stroke: "#232323" }}
          tickLine={false}
        />
        <YAxis
          domain={yDomain ?? ["auto", "auto"]}
          tick={{ fill: "#8a8a8a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#141414",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "#8a8a8a" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
