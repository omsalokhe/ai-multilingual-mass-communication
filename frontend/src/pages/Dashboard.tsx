import {
  Megaphone,
  Users,
  Mail,
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertCircle,
  Languages,
  RefreshCw,
} from "lucide-react";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import { DonutChart } from "../components/MiniChart";
import StatusBadge from "../components/StatusBadge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../lib/api";
import type { DashboardStats } from "../types";
import { useAppSettings } from "../context/AppSettingsContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useAppSettings();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError("Could not connect to backend. Make sure the server is running on port 8000.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Build stats cards from real data
  const STATS = stats
    ? [
        {
          icon: <Megaphone size={20} className="text-blue-600" />,
          iconBg: "bg-blue-50",
          label: t("stat_campaigns"),
          value: String(stats.total_campaigns),
          change: 0,
          changeSuffix: t("stat_vs_last_month"),
        },
        {
          icon: <Users size={20} className="text-indigo-600" />,
          iconBg: "bg-indigo-50",
          label: t("stat_recipients"),
          value: String(stats.total_recipients),
          change: 0,
          changeSuffix: t("stat_vs_last_month"),
        },
        {
          icon: <Mail size={20} className="text-emerald-600" />,
          iconBg: "bg-emerald-50",
          label: t("stat_content"),
          value: String(stats.total_contents),
          change: 0,
          changeSuffix: t("stat_vs_last_month"),
        },
        {
          icon: <Languages size={20} className="text-amber-600" />,
          iconBg: "bg-amber-50",
          label: t("stat_languages"),
          value: String(stats.total_languages),
          change: 0,
          changeSuffix: t("stat_vs_last_month"),
        },
        {
          icon: <TrendingUp size={20} className="text-green-600" />,
          iconBg: "bg-green-50",
          label: t("stat_segments"),
          value: String(stats.total_segments),
          change: 0,
          changeSuffix: t("stat_vs_last_month"),
        },
      ]
    : [];

  // Build donut chart from status data
  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "#10b981",
    DRAFT: "#3b82f6",
    SCHEDULED: "#6366f1",
    RUNNING: "#10b981",
    COMPLETED: "#06b6d4",
    CANCELLED: "#ef4444",
    READY_FOR_REVIEW: "#f59e0b",
    VALIDATED: "#8b5cf6",
  };

  const donutSlices = stats
    ? Object.entries(stats.campaigns_by_status).map(([status, count]) => {
        const transKey = "status_" + status.toLowerCase();
        const translated = t(transKey);
        const label =
          translated !== transKey
            ? translated
            : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
        return {
          label,
          value: count,
          color: STATUS_COLORS[status] || "#3b82f6",
        };
      })
    : [];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle size={40} className="text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-2">{error}</p>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t("dashboard_title")}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {t("dashboard_subtitle")}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-600" : "text-slate-500"} />
            <span>{t("refresh")}</span>
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className={`delay-${(i + 1) * 100}`}>
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* Charts + Recent Campaigns row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">{t("recent_campaigns")}</h2>
              <button
                onClick={() => navigate("/campaigns")}
                className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
              >
                {t("view_all")} <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">{t("col_name")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">{t("col_type")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">{t("col_priority")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">{t("col_status")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">{t("col_content")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recent_campaigns.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{c.campaign_type}</td>
                      <td className="px-5 py-3"><StatusBadge status={c.priority} /></td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{c.content_count} {t("items")}</td>
                    </tr>
                  ))}
                  {stats?.recent_campaigns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400">
                        {t("no_campaigns")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaigns by Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800 mb-4">{t("campaigns_by_status")}</h2>
            {donutSlices.length > 0 ? (
              <>
                <div className="flex justify-center">
                  <DonutChart
                    slices={donutSlices}
                    size={160}
                    strokeWidth={24}
                    centerValue={String(stats?.total_campaigns || 0)}
                    centerLabel={t("total")}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  {donutSlices.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                        <span className="text-slate-600">{s.label}</span>
                      </div>
                      <span className="font-semibold text-slate-700">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-xs text-slate-400">{t("no_status_data")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
