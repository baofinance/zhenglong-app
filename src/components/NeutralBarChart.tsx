"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type NeutralBarPoint = {
  timestamp: number;
  [key: string]: number;
};

export type NeutralBarSeries = {
  key: string;
  label: string;
  fill: string; // rgba/hex neutral color
};

interface NeutralBarChartProps {
  data: NeutralBarPoint[];
  series: NeutralBarSeries[];
  height?: number;
  formatTimestamp?: (ts: number) => string;
  unit?: string;
}

const NeutralTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: number;
  unit?: string;
  formatTimestamp?: (ts: number) => string;
}> = ({ active, payload, label, unit, formatTimestamp }) => {
  if (!active || !payload || !payload.length) return null;
  const items = payload as { name: string; value: number; color: string }[];
  return (
    <div className="bg-zinc-950/95 border border-white/10 p-3 text-xs text-white/80">
      {typeof label === "number" && (
        <div className="mb-1 text-white">
          {formatTimestamp
            ? formatTimestamp(label)
            : new Date(label).toLocaleDateString()}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: it.color }}
              />
              {it.name}
            </span>
            <span className="text-white">
              {it.value.toFixed(2)}
              {unit || ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const NeutralBarChart: React.FC<NeutralBarChartProps> = ({
  data,
  series,
  height = 160,
  formatTimestamp,
  unit,
}) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid
            strokeDasharray="2 6"
            stroke="#ffffff"
            opacity={0.08}
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(v) =>
              formatTimestamp
                ? formatTimestamp(v)
                : new Date(v).toLocaleDateString()
            }
            tick={{ fontSize: 11, fill: "#A3A3A3" }}
            tickLine={{ stroke: "#A3A3A3", opacity: 0.2 }}
            axisLine={{ stroke: "#A3A3A3", opacity: 0.2 }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#A3A3A3" }}
            tickLine={{ stroke: "#A3A3A3", opacity: 0.2 }}
            axisLine={{ stroke: "#A3A3A3", opacity: 0.2 }}
            width={40}
          />
          <Tooltip
            content={
              <NeutralTooltip unit={unit} formatTimestamp={formatTimestamp} />
            }
          />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="a"
              fill={s.fill}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NeutralBarChart;
