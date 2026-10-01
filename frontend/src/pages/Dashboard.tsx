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
  ShieldCheck,
  Search,
  Filter,
  Globe,
  Radio,
  FileText,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import { DonutChart } from "../components/MiniChart";
import StatusBadge from "../components/StatusBadge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getCampaigns, getCampaignDetails } from "../lib/api";
import type { DashboardStats, CampaignBrief, CampaignDetail } from "../types";
import { useAppSettings } from "../context/AppSettingsContext";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, generalSettings } = useAppSettings();
  const { user, isUser, isAdmin, isCampaignManager } = useAuth();
  const isDark = generalSettings.darkMode;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // For User Role (Public / Citizen Bulletin View)
  const [userCampaigns, setUserCampaigns] = useState<CampaignBrief[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userDomainFilter, setUserDomainFilter] = useState("ALL");
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<CampaignDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<string>("en");

  // Admin pending approval count
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, [isUser]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (isUser) {
        // Fetch all generated campaigns for citizen viewing
        const allCamp = await getCampaigns();
        setUserCampaigns(allCamp);
      } else {
        // Fetch Admin/Manager stats
        const data = await getDashboardStats();
        setStats(data);
        // Also fetch pending count for admin alert banner
        try {
          const allCamp = await getCampaigns();
          const pending = allCamp.filter((c) => c.status === "PENDING_APPROVAL").length;
          setPendingCount(pending);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError("Could not connect to backend. Make sure the server is running on port 8000.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandCampaign = async (id: number) => {
    if (expandedCampaignId === id) {
      setExpandedCampaignId(null);
      setExpandedDetails(null);
      return;
    }
    setExpandedCampaignId(id);
    setLoadingDetails(true);
    try {
      const details = await getCampaignDetails(id);
      setExpandedDetails(details);
      if (details.contents && details.contents.length > 0) {
        setActiveLangTab(details.contents[0].language || details.contents[0].language_code || "en");
      }
    } catch (err) {
      console.error("Error loading campaign details:", err);
    } finally {
      setLoadingDetails(false);
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
    PENDING_APPROVAL: "#f59e0b",
    APPROVED: "#06b6d4",
    REJECTED: "#ef4444",
    SCHEDULED: "#6366f1",
    RUNNING: "#10b981",
    COMPLETED: "#06b6d4",
    CANCELLED: "#ef4444",
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
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // 1. CITIZEN / USER DASHBOARD VIEW (Read-only generated campaigns portal)
  // ════════════════════════════════════════════════════════════════════════
  if (isUser) {
    const filteredUserCampaigns = userCampaigns.filter((c) => {
      const matchSearch =
        !userSearch ||
        c.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        c.campaign_code.toLowerCase().includes(userSearch.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(userSearch.toLowerCase());

      const matchDomain =
        userDomainFilter === "ALL" ||
        (c.campaign_type || "").toLowerCase().includes(userDomainFilter.toLowerCase());

      return matchSearch && matchDomain;
    });

    return (
      <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
        <TopBar />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500">
                  <Megaphone className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight">Public Announcements & Bulletins</h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Official mass communication broadcasts, emergency alerts, educational updates, and government welfare schemes.
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-blue-600" : "text-slate-400"} />
              <span>Refresh Bulletins</span>
            </button>
          </div>

          {/* Quick Stats overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Bulletins</span>
              <div className="text-2xl font-bold mt-1">{userCampaigns.length}</div>
              <span className="text-[11px] text-blue-500">All registered notices</span>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Broadcasts</span>
              <div className="text-2xl font-bold mt-1 text-emerald-500">
                {userCampaigns.filter((c) => ["ACTIVE", "APPROVED", "DISPATCHED", "SENT"].includes(c.status)).length}
              </div>
              <span className="text-[11px] text-slate-400">Currently active notices</span>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Emergency Alerts</span>
              <div className="text-2xl font-bold mt-1 text-rose-500">
                {userCampaigns.filter((c) => c.priority === "CRITICAL" || c.priority === "HIGH").length}
              </div>
              <span className="text-[11px] text-rose-400">High priority alerts</span>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Supported Languages</span>
              <div className="text-2xl font-bold mt-1 text-indigo-500">6+</div>
              <span className="text-[11px] text-slate-400">English, Hindi, Marathi, etc.</span>
            </div>
          </div>

          {/* Search & Domain Filter */}
          <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"
          }`}>
            <div className="flex flex-wrap gap-1.5">
              {["ALL", "AWARENESS", "EMERGENCY", "EDUCATIONAL", "ORGANIZATIONAL"].map((domain) => (
                <button
                  key={domain}
                  onClick={() => setUserDomainFilter(domain)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    userDomainFilter === domain
                      ? "bg-blue-600 text-white shadow-sm"
                      : isDark
                      ? "text-slate-400 hover:text-white bg-slate-700/50"
                      : "text-slate-600 hover:text-slate-900 bg-slate-100"
                  }`}
                >
                  {domain.charAt(0) + domain.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search bulletins, keywords..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border transition focus:outline-none ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-white focus:border-blue-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                }`}
              />
            </div>
          </div>

          {/* Campaigns Feed List */}
          {filteredUserCampaigns.length === 0 ? (
            <div className={`text-center py-16 rounded-2xl border border-dashed p-8 ${
              isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-300 bg-slate-50"
            }`}>
              <Megaphone className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold text-slate-400">No public announcements found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your domain filter or search keywords.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUserCampaigns.map((camp) => {
                const isExpanded = expandedCampaignId === camp.id;
                return (
                  <div
                    key={camp.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isDark ? "bg-slate-800/70 border-slate-700/80 hover:border-slate-600" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    {/* Summary row */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {camp.campaign_code}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                            {camp.campaign_type || "Public Notice"}
                          </span>
                          <StatusBadge status={camp.status} />
                          {camp.priority && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                camp.priority === "CRITICAL"
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300"
                                  : camp.priority === "HIGH"
                                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300"
                                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {camp.priority} PRIORITY
                            </span>
                          )}
                        </div>

                        <h2 className="text-base font-bold tracking-tight">{camp.name}</h2>
                        {camp.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{camp.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>Target: {camp.target_audiences.join(", ") || "General Public"}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Multilingual Broadcast Available</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleExpandCampaign(camp.id)}
                        className="self-start md:self-center flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isExpanded ? "Close Bulletin" : "Read Full Bulletin"}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* Expanded bulletin detail */}
                    {isExpanded && (
                      <div className={`border-t p-5 space-y-4 ${isDark ? "border-slate-700 bg-slate-900/60" : "border-slate-100 bg-slate-50/70"}`}>
                        {loadingDetails ? (
                          <div className="py-6 flex items-center justify-center text-xs text-slate-400 gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                            Loading bulletin contents and translations...
                          </div>
                        ) : expandedDetails ? (
                          <div className="space-y-4">
                            {/* Objective box */}
                            {expandedDetails.objective && (
                              <div className={`p-3 rounded-lg text-xs border ${
                                isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                              }`}>
                                <span className="font-semibold text-blue-500 block mb-1">Official Purpose & Advisory:</span>
                                {expandedDetails.objective}
                              </div>
                            )}

                            {/* Content Translations Tabs */}
                            {expandedDetails.contents && expandedDetails.contents.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    Select Language to Read:
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {expandedDetails.contents.map((item) => {
                                    const langLabel = item.language || item.language_code || `Lang #${item.language_id}`;
                                    const langCode = item.language_code || item.language || "en";
                                    return (
                                      <button
                                        key={item.id}
                                        onClick={() => setActiveLangTab(langCode)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                          activeLangTab === langCode
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : isDark
                                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                                        }`}
                                      >
                                        {langLabel.toUpperCase()}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Active content display */}
                                {expandedDetails.contents
                                  .filter((item) => (item.language_code || item.language || "en") === activeLangTab)
                                  .map((item) => (
                                    <div
                                      key={item.id}
                                      className={`p-4 rounded-xl border space-y-2 shadow-inner ${
                                        isDark ? "bg-slate-800/90 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                                      }`}
                                    >
                                      {item.subject && (
                                        <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                          {item.subject}
                                        </h4>
                                      )}
                                      <p className="text-sm leading-relaxed whitespace-pre-line font-sans">
                                        {item.body || item.content_text}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 italic p-3">
                                No multilingual text packages attached to this bulletin yet.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">Failed to load bulletin details.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2. ADMIN / CAMPAIGN MANAGER DASHBOARD VIEW
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Admin Action Alert Banner if campaigns are pending */}
        {isAdmin && pendingCount > 0 && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-sm ${
              isDark
                ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                : "bg-amber-50 border-amber-300 text-black shadow-xs"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`p-2 rounded-lg ${
                  isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-800"
                }`}
              >
                <ShieldCheck size={20} />
              </span>
              <div>
                <h4 className={`text-sm font-bold ${isDark ? "text-amber-300" : "text-black"}`}>
                  {pendingCount} Campaign{pendingCount > 1 ? "s" : ""} Awaiting Admin Approval & Dispatch
                </h4>
                <p className={`text-xs ${isDark ? "text-amber-200/80" : "text-black"}`}>
                  Campaign Managers have submitted new campaigns for your final review and multi-channel broadcast authorization.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/approvals")}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shrink-0 shadow-md cursor-pointer"
            >
              <span>Review in Approvals</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t("dashboard_title")}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("dashboard_subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate("/approvals")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <ShieldCheck size={14} />
                <span>Approvals Hub</span>
              </button>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-blue-600" : "text-slate-500"} />
              <span>{t("refresh")}</span>
            </button>
          </div>
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
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t("recent_campaigns")}</h2>
              <button
                onClick={() => navigate("/campaigns")}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {t("view_all")} <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-700/30">
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">{t("col_name")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">{t("col_type")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">{t("col_priority")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">{t("col_status")}</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">{t("col_content")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recent_campaigns.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                      className="border-b border-slate-50 dark:border-slate-700/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{c.name}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400 text-xs">{c.campaign_type}</td>
                      <td className="px-5 py-3"><StatusBadge status={c.priority} /></td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400 text-xs">{c.content_count} {t("items")}</td>
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
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{t("campaigns_by_status")}</h2>
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
                        <span className="text-slate-600 dark:text-slate-400">{s.label}</span>
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{s.value}</span>
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
