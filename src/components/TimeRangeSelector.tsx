import React from "react";

type TimeRange = "24H" | "7D" | "1M" | "1Y" | "ALL";

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onSelectRange: (range: TimeRange) => void;
}

const TimeRangeButton = ({
  range,
  selectedRange,
  onSelectRange,
}: {
  range: TimeRange;
  selectedRange: TimeRange;
  onSelectRange: (range: TimeRange) => void;
}) => (
  <button
    onClick={() => onSelectRange(range)}
    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
      selectedRange === range
        ? "bg-white/10 text-white"
        : "text-white/50 hover:bg-white/5 hover:text-white"
    }`}
  >
    {range}
  </button>
);

export default function TimeRangeSelector({
  selectedRange,
  onSelectRange,
}: TimeRangeSelectorProps) {
  const ranges: TimeRange[] = ["24H", "7D", "1M", "1Y", "ALL"];
  return (
    <div className="flex items-center gap-2">
      {ranges.map((range) => (
        <TimeRangeButton
          key={range}
          range={range}
          selectedRange={selectedRange}
          onSelectRange={onSelectRange}
        />
      ))}
    </div>
  );
}
