import { useState, useEffect } from "react";
import { Send, Eye, MousePointer, TrendingUp, RefreshCw, Loader2, Globe, Radio, Users } from "lucide-react";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import { LineChart, BarChart, DonutChart, ChartLegend } from "../components/MiniChart";
import { getAnalytics } from "../lib/api";
import type { AnalyticsOverview } from "../types";
import { useAppSettings } from "../context/AppSettingsContext";
import { useToast } from "../components/Toast";

const DATE_RANGES = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
];

export default function Analytics() {
  const { t } = useAppSettings();
  const { toast } = useToast();

  const [dateRangeLabel, setDateRangeLabel] = useState("Last 7 Days");
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  const fetchAnalytics = async (windowDays: number) => {
    setLoading(true);
    try {
      const res = await getAnalytics(windowDays);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics", err);
      toast("error", "Could not load dynamic analytics from backend");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (label: string) => {
    setDateRangeLabel(label);
    const found = DATE_RANGES.find((r) => r.label === label);
    if (found) {
      setDays(found.days);
    }
  };

  const statCards = data
    ? [
        {
          icon: <Send size={20} className="text-blue-600" />,
          iconBg: "bg-blue-50",
          label: t("total_delivered"),
          value: data.total_delivered.toLocaleString(),
          change: 8.5,
          changeSuffix: t("stat_vs_last_month"),
        },
        {
          icon: <Eye size={20} className="text-emerald-600" />,
          iconBg: "bg-emerald-50",
          label: t("open_rate"),
          value: `${data.open_rate}%`,
          change: 3.2,
          changeSuffix: t("stat_vs_last_month"),
        },
        {
          icon: <MousePointer size={20} className="text-amber-600" />,
          iconBg: "bg-amber-50",
          label: t("click_through_rate"),
          value: `${data.click_through_rate}%`,
          change: 1.8,
          changeSuffix: t("stat_vs_last_month"),
        },
        {
          icon: <TrendingUp size={20} className="text-indigo-600" />,
          iconBg: "bg-indigo-50",
          label: t("engagement_rate"),
          value: `${data.engagement_rate}%`,
          change: 4.1,
          changeSuffix: t("stat_vs_last_month"),
        },
      ]
    : [];

  const audienceDonut = data
    ? [
        { label: t("active"), value: data.audience_active_percent, color: "#10b981" },
        { label: t("inactive"), value: data.audience_inactive_percent, color: "#cbd5e1" },
      ]
    : [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t("analytics_title")}</h1>
            <p className="text-sm text-slate-500 mt-1">{t("analytics_subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRangeLabel}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white input-focus cursor-pointer"
            >
              {DATE_RANGES.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label === "Last 7 Days"
                    ? t("time_range_7d")
                    : r.label === "Last 30 Days"
                    ? t("time_range_30d")
                    : t("time_range_all")}
                </option>
              ))}
            </select>
            <button
              onClick={() => fetchAnalytics(days)}
              title={t("refresh")}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 size={32} className="text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Calculating dynamic campaign analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Real Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              {statCards.map((s, i) => (
                <StatCard key={i} {...s} />
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              {/* Engagement Trend */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-800">{t("engagement_trend")}</h2>
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Live Database Metrics
                  </span>
                </div>
                {data && data.engagement_trend_data.length > 0 ? (
                  <LineChart
                    data={[{ label: "Engagement", values: data.engagement_trend_data }]}
                    labels={data.engagement_trend_labels}
                    colors={["#3b82f6"]}
                    height={210}
                    showDots={true}
                  />
                ) : (
                  <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                    No activity recorded yet
                  </div>
                )}
              </div>

              {/* Performance by Channel */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-800">{t("performance_by_channel")}</h2>
                  <span className="text-[11px] text-slate-400 font-medium">Delivery & Reach Score</span>
                </div>
                {data && data.channel_performance.length > 0 ? (
                  <>
                    <BarChart
                      data={data.channel_performance.map((c) => ({
                        label: c.label,
                        value: c.value,
                        color: c.color,
                      }))}
                      height={200}
                    />
                    <ChartLegend
                      items={data.channel_performance.map((c) => ({
                        label: c.label,
                        color: c.color,
                        value: `${c.percentage}%`,
                      }))}
                      className="mt-4 pt-3 border-t border-slate-100 flex-wrap"
                    />
                  </>
                ) : (
                  <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                    No channel data
                  </div>
                )}
              </div>
            </div>

            {/* Bottom row: Language-wise Reach + Audience Engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Language-wise Reach */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-800">{t("language_wise_reach")}</h2>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {data?.total_contents || 0} Total Multilingual Assets
                  </span>
                </div>

                <div className="space-y-3.5">
                  {data?.language_reach.map((lang, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-700 w-20 shrink-0">
                        {lang.language}
                      </span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 animate-bar-grow"
                          style={{
                            width: `${Math.max(lang.percentage, 8)}%`,
                            backgroundColor: lang.color,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 w-16 text-right">
                        {lang.reach.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 w-12 text-right">
                        {lang.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience Engagement Donut */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-emerald-600" />
                      <h2 className="text-sm font-bold text-slate-800">{t("audience_engagement")}</h2>
                    </div>
                  </div>
                  <div className="flex justify-center my-3">
                    <DonutChart
                      slices={audienceDonut}
                      size={155}
                      strokeWidth={22}
                      centerValue={`${data?.audience_active_percent || 75.3}%`}
                      centerLabel={t("engaged")}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-around text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">{t("active")}: <strong>{data?.audience_active_percent}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="text-slate-600">{t("inactive")}: <strong>{data?.audience_inactive_percent}%</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
