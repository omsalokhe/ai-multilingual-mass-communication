import { useMemo } from "react";

/* ─── LINE CHART ─────────────────────────────────────────── */

interface LineChartProps {
  data: { label: string; values: number[] }[];
  labels: string[];
  colors?: string[];
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  className?: string;
}

export function LineChart({
  data,
  labels,
  colors = ["#3b82f6", "#22c55e", "#f59e0b"],
  height = 200,
  showGrid = true,
  showDots = true,
  className = "",
}: LineChartProps) {
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const width = 600;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => d.values);
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const xStep = chartW / Math.max(labels.length - 1, 1);

  const buildPath = (values: number[]) => {
    return values
      .map((v, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + chartH - ((v - minVal) / range) * chartH;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const gridLines = useMemo(() => {
    const lines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = padding.top + (chartH / steps) * i;
      const val = Math.round(maxVal - (i / steps) * range);
      lines.push({ y, val });
    }
    return lines;
  }, [maxVal, range, chartH]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {showGrid &&
        gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray={i === gridLines.length - 1 ? "0" : "4 4"}
            />
            <text
              x={padding.left - 8}
              y={line.y + 4}
              textAnchor="end"
              fontSize={10}
              fill="#94a3b8"
            >
              {line.val}
            </text>
          </g>
        ))}

      {/* X-axis labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={padding.left + i * xStep}
          y={height - 5}
          textAnchor="middle"
          fontSize={10}
          fill="#94a3b8"
        >
          {l}
        </text>
      ))}

      {/* Data lines */}
      {data.map((series, si) => (
        <g key={si}>
          {/* Area fill */}
          <path
            d={`${buildPath(series.values)} L ${padding.left + (series.values.length - 1) * xStep} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`}
            fill={colors[si % colors.length]}
            fillOpacity={0.06}
          />
          {/* Line */}
          <path
            d={buildPath(series.values)}
            fill="none"
            stroke={colors[si % colors.length]}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-line"
          />
          {/* Dots */}
          {showDots &&
            series.values.map((v, i) => {
              const x = padding.left + i * xStep;
              const y =
                padding.top + chartH - ((v - minVal) / range) * chartH;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="white"
                  stroke={colors[si % colors.length]}
                  strokeWidth={2}
                />
              );
            })}
        </g>
      ))}
    </svg>
  );
}

/* ─── DONUT CHART ────────────────────────────────────────── */

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

export function DonutChart({
  slices,
  size = 180,
  strokeWidth = 28,
  centerLabel,
  centerValue,
  className = "",
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;

  let accumulated = 0;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {/* Slices */}
        {slices.map((slice, i) => {
          const pct = slice.value / total;
          const dashLen = circumference * pct;
          const offset = circumference * accumulated;
          accumulated += pct;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{
                ["--circumference" as string]: circumference,
                ["--offset" as string]: circumference - dashLen,
              }}
              className="animate-donut transition-all duration-700"
            />
          );
        })}
      </svg>
      {/* Center text */}
      {(centerLabel || centerValue) && (
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{ width: size, height: size, marginTop: -(size) }}
        >
          {centerValue !== undefined && (
            <span className="text-xl font-bold text-slate-800">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-[10px] text-slate-500">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── BAR CHART ──────────────────────────────────────────── */

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  barColor?: string;
  className?: string;
}

export function BarChart({
  data,
  height = 200,
  barColor = "#3b82f6",
  className = "",
}: BarChartProps) {
  const padding = { top: 10, right: 10, bottom: 30, left: 45 };
  const width = 500;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(chartW / data.length - 8, 40);

  const gridLines = useMemo(() => {
    const lines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = padding.top + (chartH / steps) * i;
      const val = Math.round(maxVal - (i / steps) * maxVal);
      lines.push({ y, val });
    }
    return lines;
  }, [maxVal, chartH]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {gridLines.map((line, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={line.y}
            x2={width - padding.right}
            y2={line.y}
            stroke="#e2e8f0"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 8}
            y={line.y + 4}
            textAnchor="end"
            fontSize={10}
            fill="#94a3b8"
          >
            {line.val}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x =
          padding.left +
          (chartW / data.length) * i +
          (chartW / data.length - barW) / 2;
        const y = padding.top + chartH - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={d.color || barColor}
              rx={4}
              className="animate-bar-grow"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
            <text
              x={x + barW / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── LEGEND ─────────────────────────────────────────────── */

interface LegendItem {
  label: string;
  color: string;
  value?: string | number;
}

interface ChartLegendProps {
  items: LegendItem[];
  className?: string;
}

export function ChartLegend({ items, className = "" }: ChartLegendProps) {
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
          {item.value !== undefined && (
            <span className="font-semibold text-slate-800">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
