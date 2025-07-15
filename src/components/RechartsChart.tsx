import {
  AreaChart,
  Area,
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
  dataKey: string;
  unit: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatTooltipTimestamp,
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0c0c0c] p-4 border border-white/10 shadow-lg">
        <p className="text-sm text-white/80">{formatTooltipTimestamp(label)}</p>
        <p className="text-lg font-bold text-[#4A7C59]">
          {`${payload[0].value.toFixed(2)}%`}
          <span className="text-xs text-white/50 ml-1">APR</span>
        </p>
      </div>
    );
  }

  return null;
};

export default function RechartsChart({
  data,
  formatTimestamp,
  formatTooltipTimestamp,
  dataKey,
  unit,
}: RechartsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
      >
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4A7C59" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#4A7C59" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="1 4"
          stroke="#4A7C59"
          opacity={0.15}
          vertical={false}
        />
        <XAxis
          dataKey="timestamp"
          stroke="#F5F5F5"
          opacity={0.5}
          tick={{ fontSize: 12, fill: "#A3A3A3" }}
          tickLine={{ stroke: "#4A7C59", opacity: 0.2 }}
          tickFormatter={formatTimestamp}
        />
        <YAxis
          stroke="#F5F5F5"
          opacity={0.5}
          tick={{ fontSize: 12, fill: "#A3A3A3" }}
          tickLine={{ stroke: "#4A7C59", opacity: 0.2 }}
          domain={["auto", "auto"]}
          tickFormatter={(value) => `${value}${unit}`}
        />
        <Tooltip
          content={
            <CustomTooltip formatTooltipTimestamp={formatTooltipTimestamp} />
          }
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#4A7C59"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPrice)"
          dot={false}
          activeDot={{
            r: 5,
            strokeWidth: 2,
            fill: "#0c0c0c",
            stroke: "#4A7C59",
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
