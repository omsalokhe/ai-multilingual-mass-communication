import { useState } from "react";
import { Send, Eye, MousePointer, TrendingUp } from "lucide-react";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import { LineChart, BarChart, DonutChart, ChartLegend } from "../components/MiniChart";

const DATE_RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"];

const STATS = [
  { icon: <Send size={20} className="text-blue-600" />, iconBg: "bg-blue-50", label: "Total Delivered", value: "46,980", change: 8.1 },
  { icon: <Eye size={20} className="text-emerald-600" />, iconBg: "bg-emerald-50", label: "Open Rate", value: "68.2%", change: 3.4 },
  { icon: <MousePointer size={20} className="text-amber-600" />, iconBg: "bg-amber-50", label: "Click-through Rate", value: "24.7%", change: -1.2 },
  { icon: <TrendingUp size={20} className="text-indigo-600" />, iconBg: "bg-indigo-50", label: "Engagement Rate", value: "78.4%", change: 2.1 },
];

const ENGAGEMENT_LABELS = ["Sep 10", "Sep 11", "Sep 12", "Sep 13", "Sep 14", "Sep 15", "Sep 16"];
const ENGAGEMENT_DATA = [
  { label: "Engagement", values: [65, 72, 68, 78, 82, 76, 85] },
];

const CHANNEL_PERFORMANCE = [
  { label: "Email", value: 82, color: "#3b82f6" },
  { label: "SMS", value: 74, color: "#22c55e" },
  { label: "WhatsApp", value: 91, color: "#06b6d4" },
  { label: "Push", value: 65, color: "#f59e0b" },
  { label: "Web", value: 58, color: "#8b5cf6" },
];

const LANGUAGE_REACH = [
  { language: "English", reach: 18432, percentage: 38.2, color: "#3b82f6" },
  { language: "Hindi", reach: 12540, percentage: 26.0, color: "#22c55e" },
  { language: "Kannada", reach: 8120, percentage: 16.8, color: "#f59e0b" },
  { language: "Tamil", reach: 5400, percentage: 11.2, color: "#ef4444" },
  { language: "Telugu", reach: 3700, percentage: 7.8, color: "#8b5cf6" },
];

const AUDIENCE_DONUT = [
  { label: "Active", value: 75.3, color: "#3b82f6" },
  { label: "Inactive", value: 24.7, color: "#e2e8f0" },
];

export default function Analytics() {
  const [dateRange, setDateRange] = useState("Last 7 Days");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Campaign Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Monitor your campaign performance and engagement metrics.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none cursor-pointer"
            >
              {DATE_RANGES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400">Sep 10, 2025 — Sep 16, 2025</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Engagement Trend</h2>
            <LineChart
              data={ENGAGEMENT_DATA}
              labels={ENGAGEMENT_LABELS}
              colors={["#3b82f6"]}
              height={200}
            />
          </div>

          {/* Performance by Channel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Performance by Channel</h2>
            <BarChart
              data={CHANNEL_PERFORMANCE}
              height={200}
            />
            <ChartLegend
              items={CHANNEL_PERFORMANCE.map((c) => ({ label: c.label, color: c.color, value: `${c.value}%` }))}
              className="mt-3"
            />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Language-wise Reach */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Language-wise Reach</h2>
            <div className="space-y-3">
              {LANGUAGE_REACH.map((lang, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-16 shrink-0">{lang.language}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 animate-bar-grow"
                      style={{
                        width: `${lang.percentage}%`,
                        backgroundColor: lang.color,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-14 text-right">
                    {lang.reach.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 w-10 text-right">{lang.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Audience Engagement */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Audience Engagement</h2>
            <div className="flex justify-center">
              <DonutChart
                slices={AUDIENCE_DONUT}
                size={150}
                strokeWidth={20}
                centerValue="75.3%"
                centerLabel="Engaged"
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-blue-500" />
                  <span className="text-slate-600">Engaged Users</span>
                </div>
                <span className="font-semibold text-slate-700">37,819</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-slate-200" />
                  <span className="text-slate-600">Inactive Users</span>
                </div>
                <span className="font-semibold text-slate-700">48,193</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
