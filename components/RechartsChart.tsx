import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PriceDataPoint } from "../config/contracts";

interface RechartsChartProps {
  data: PriceDataPoint[];
  formatTimestamp: (timestamp: number) => string;
  formatTooltipTimestamp: (timestamp: number) => string;
}

export default function RechartsChart({
  data,
  formatTimestamp,
  formatTooltipTimestamp,
}: RechartsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4A7C59" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#4A7C59" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#4A7C59"
          opacity={0.1}
          vertical={false}
        />
        <XAxis
          dataKey="timestamp"
          stroke="#F5F5F5"
          opacity={0.5}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: "#4A7C59", opacity: 0.2 }}
          tickFormatter={formatTimestamp}
        />
        <YAxis
          stroke="#F5F5F5"
          opacity={0.5}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: "#4A7C59", opacity: 0.2 }}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1A1A1A",
            border: "1px solid rgba(74,124,89,0.2)",
            borderRadius: "4px",
          }}
          labelStyle={{ color: "#F5F5F5", opacity: 0.7 }}
          itemStyle={{ color: "#4A7C59" }}
          labelFormatter={(value) => formatTooltipTimestamp(Number(value))}
          formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#4A7C59"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#4A7C59" }}
          fill="url(#colorPrice)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
