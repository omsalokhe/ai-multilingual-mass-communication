import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  AlertTriangle,
  Eye,
  RefreshCw,
  Search,
  Users,
  Radio,
  FileText,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import TopBar from "../components/TopBar";
import StatusBadge from "../components/StatusBadge";
import {
  getCampaigns,
  getCampaignDetails,
  approveCampaign,
  rejectCampaign,
  dispatchCampaign,
} from "../lib/api";
import type { CampaignBrief, CampaignDetail } from "../types";
import { useAppSettings } from "../context/AppSettingsContext";

export default function AdminApprovals() {
  const { generalSettings } = useAppSettings();
  const isDark = generalSettings.darkMode;

  const [campaigns, setCampaigns] = useState<CampaignBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "DISPATCHED" | "REJECTED" | "ALL">("PENDING");
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectCampaignId, setRejectCampaignId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
      showNotification("error", "Failed to fetch campaigns. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExpand = async (id: number) => {
    if (expandedCampaignId === id) {
      setExpandedCampaignId(null);
      setSelectedCampaign(null);
      return;
    }

    setExpandedCampaignId(id);
    setLoadingDetails(true);
    try {
      const details = await getCampaignDetails(id);
      setSelectedCampaign(details);
    } catch (err) {
      console.error("Error fetching campaign details:", err);
      showNotification("error", "Could not load full campaign details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleApprove = async (id: number, name: string) => {
    setActionLoading(true);
    try {
      await approveCampaign(id);
      showNotification("success", `Campaign "${name}" approved successfully! It is now authorized for dispatch.`);
      await fetchCampaigns();
      if (expandedCampaignId === id) {
        const updated = await getCampaignDetails(id);
        setSelectedCampaign(updated);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to approve campaign";
      showNotification("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id: number) => {
    setRejectCampaignId(id);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectCampaignId) return;
    if (!rejectionReason.trim()) {
      showNotification("error", "Please provide a valid rejection reason.");
      return;
    }

    setActionLoading(true);
    try {
      await rejectCampaign(rejectCampaignId, rejectionReason.trim());
      showNotification("success", "Campaign rejected. Feedback returned to the campaign manager.");
      setRejectModalOpen(false);
      setRejectCampaignId(null);
      setRejectionReason("");
      await fetchCampaigns();
      if (expandedCampaignId === rejectCampaignId) {
        const updated = await getCampaignDetails(rejectCampaignId);
        setSelectedCampaign(updated);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to reject campaign";
      showNotification("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async (id: number, name: string) => {
    setActionLoading(true);
    try {
      const res = await dispatchCampaign({
        campaign_id: id,
        channels: ["SMS", "WHATSAPP", "EMAIL"],
      });
      showNotification(
        "success",
        `Dispatch initiated! ${res.total_dispatched || 0} messages processed across ${res.channels_used?.join(", ") || "configured channels"}.`
      );
      await fetchCampaigns();
      if (expandedCampaignId === id) {
        const updated = await getCampaignDetails(id);
        setSelectedCampaign(updated);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Dispatch failed. Ensure campaign is APPROVED.";
      showNotification("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter counts
  const pendingCount = campaigns.filter(c => c.status === "PENDING_APPROVAL").length;
  const approvedCount = campaigns.filter(c => c.status === "APPROVED").length;
  const dispatchedCount = campaigns.filter(c => ["DISPATCHED", "SENT", "ACTIVE"].includes(c.status)).length;
  const rejectedCount = campaigns.filter(c => c.status === "REJECTED").length;

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.campaign_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.campaign_type || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "PENDING") return c.status === "PENDING_APPROVAL";
    if (activeTab === "APPROVED") return c.status === "APPROVED";
    if (activeTab === "DISPATCHED") return ["DISPATCHED", "SENT", "ACTIVE"].includes(c.status);
    if (activeTab === "REJECTED") return c.status === "REJECTED";
    return true; // ALL
  });

  return (
    <div className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${
      isDark ? "bg-[#0f172a] text-slate-100" : "bg-[#F8FAFC] text-slate-800"
    }`}>
      <TopBar>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
              isDark
                ? "text-slate-300 hover:text-white border-slate-700 bg-slate-800/80 hover:bg-slate-700"
                : "text-slate-700 hover:text-slate-900 border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
            }`}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all shadow-lg ${
              notification.type === "success"
                ? isDark
                  ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                  : "bg-emerald-50 border-emerald-300 text-emerald-900"
                : isDark
                ? "bg-rose-950/80 border-rose-500/50 text-rose-200"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs opacity-70 hover:opacity-100 ml-4 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`p-2.5 rounded-xl border ${
                isDark
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                  : "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xs"
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h1 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Admin Approval & Dispatch Hub
                </h1>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Review campaigns prepared by Campaign Managers, approve or reject with audit notes, and authorize final multichannel dispatch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab("PENDING")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeTab === "PENDING"
                ? isDark
                  ? "bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10"
                  : "bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-300"
                : isDark
                ? "bg-slate-800/60 border-slate-700/60 hover:border-slate-600"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? "text-amber-400" : "text-amber-800"}`}>Pending Review</span>
              <Clock className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{pendingCount}</div>
            <div className={`text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Requires admin authorization</div>
          </div>

          <div
            onClick={() => setActiveTab("APPROVED")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeTab === "APPROVED"
                ? isDark
                  ? "bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                  : "bg-emerald-50 border-emerald-400 shadow-sm ring-1 ring-emerald-300"
                : isDark
                ? "bg-slate-800/60 border-slate-700/60 hover:border-slate-600"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? "text-emerald-400" : "text-emerald-800"}`}>Approved & Ready</span>
              <CheckCircle2 className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{approvedCount}</div>
            <div className={`text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Ready for 1-click dispatch</div>
          </div>

          <div
            onClick={() => setActiveTab("DISPATCHED")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeTab === "DISPATCHED"
                ? isDark
                  ? "bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                  : "bg-cyan-50 border-cyan-400 shadow-sm ring-1 ring-cyan-300"
                : isDark
                ? "bg-slate-800/60 border-slate-700/60 hover:border-slate-600"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? "text-cyan-400" : "text-cyan-800"}`}>Dispatched</span>
              <Send className={`w-4 h-4 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{dispatchedCount}</div>
            <div className={`text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Successfully broadcasted</div>
          </div>

          <div
            onClick={() => setActiveTab("REJECTED")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeTab === "REJECTED"
                ? isDark
                  ? "bg-rose-500/15 border-rose-500/50 shadow-md shadow-rose-500/10"
                  : "bg-rose-50 border-rose-400 shadow-sm ring-1 ring-rose-300"
                : isDark
                ? "bg-slate-800/60 border-slate-700/60 hover:border-slate-600"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? "text-rose-400" : "text-rose-800"}`}>Rejected</span>
              <XCircle className={`w-4 h-4 ${isDark ? "text-rose-400" : "text-rose-600"}`} />
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{rejectedCount}</div>
            <div className={`text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Sent back with revision notes</div>
          </div>
        </div>

        {/* Search & Tabs Filter Bar */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border ${
          isDark ? "bg-slate-800/60 border-slate-700/70" : "bg-white border-slate-200 shadow-xs"
        }`}>
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === "PENDING"
                  ? isDark
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70"
              }`}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("APPROVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === "APPROVED"
                  ? isDark
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70"
              }`}
            >
              Approved & Ready ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab("DISPATCHED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === "DISPATCHED"
                  ? isDark
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-cyan-100 text-cyan-900 border border-cyan-300 font-semibold shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70"
              }`}
            >
              Dispatched ({dispatchedCount})
            </button>
            <button
              onClick={() => setActiveTab("REJECTED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === "REJECTED"
                  ? isDark
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-rose-100 text-rose-900 border border-rose-300 font-semibold shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70"
              }`}
            >
              Rejected ({rejectedCount})
            </button>
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === "ALL"
                  ? isDark
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70"
              }`}
            >
              All ({campaigns.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
            <input
              type="text"
              placeholder="Search by code, title, or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border transition focus:outline-none ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500"
                  : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white"
              }`}
            />
          </div>
        </div>

        {/* Campaign Approvals List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm">Loading campaigns for review...</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className={`py-16 text-center rounded-2xl border border-dashed p-8 ${
            isDark ? "border-slate-700/80 bg-slate-800/30" : "border-slate-300 bg-white shadow-xs"
          }`}>
            <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>No campaigns found</h3>
            <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              {activeTab === "PENDING"
                ? "No campaigns are currently waiting for admin authorization. Great job keeping the queue clear!"
                : "No campaigns matching your current filter criteria."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((camp) => {
              const isExpanded = expandedCampaignId === camp.id;
              const isPending = camp.status === "PENDING_APPROVAL";
              const isApproved = camp.status === "APPROVED";
              const isDispatched = ["DISPATCHED", "SENT", "ACTIVE"].includes(camp.status);
              const isRejected = camp.status === "REJECTED";

              return (
                <div
                  key={camp.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isPending
                      ? isDark
                        ? "bg-slate-800/80 border-amber-500/40 shadow-sm shadow-amber-500/5"
                        : "bg-white border-amber-300 shadow-sm"
                      : isApproved
                      ? isDark
                        ? "bg-slate-800/70 border-emerald-500/40"
                        : "bg-white border-emerald-300 shadow-sm"
                      : isRejected
                      ? isDark
                        ? "bg-slate-800/60 border-rose-500/30"
                        : "bg-white border-rose-300 shadow-sm"
                      : isDark
                      ? "bg-slate-800/50 border-slate-700/70"
                      : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  {/* Card Header / Summary Row */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                          isDark
                            ? "bg-slate-700/80 text-slate-300 border-slate-600"
                            : "bg-slate-100 text-slate-700 border-slate-200 font-semibold"
                        }`}>
                          {camp.campaign_code}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                          isDark
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}>
                          {camp.campaign_type || "General"}
                        </span>
                        <StatusBadge status={camp.status} />
                        {camp.priority && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              camp.priority === "CRITICAL"
                                ? isDark
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-rose-100 text-rose-700 border border-rose-300"
                                : camp.priority === "HIGH"
                                ? isDark
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-amber-100 text-amber-700 border border-amber-300"
                                : isDark
                                ? "bg-slate-700 text-slate-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {camp.priority} PRIORITY
                          </span>
                        )}
                      </div>

                      <h2 className={`text-base font-bold transition ${
                        isDark ? "text-white hover:text-indigo-400" : "text-slate-900 hover:text-indigo-600"
                      }`}>
                        {camp.name}
                      </h2>

                      {camp.description && (
                        <p className={`text-xs line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          {camp.description}
                        </p>
                      )}

                      {/* Audiences and Channels Row with high contrast */}
                      <div className={`flex flex-wrap items-center gap-5 text-xs pt-1 ${
                        isDark ? "text-slate-300" : "text-slate-700 font-medium"
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <Users className={`w-3.5 h-3.5 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                          <span>Audiences: <strong>{camp.target_audiences.join(", ") || "General Public"}</strong></span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Radio className={`w-3.5 h-3.5 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                          <span>Channels: <strong>SMS, WhatsApp, Email</strong></span>
                        </span>
                      </div>
                    </div>

                    {/* Action Controls for Admin */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                      {/* Detailed Preview Toggle */}
                      <button
                        onClick={() => handleExpand(camp.id)}
                        className={`flex items-center gap-1 text-xs px-3.5 py-2 rounded-lg border transition cursor-pointer font-medium ${
                          isDark
                            ? "bg-slate-700/70 hover:bg-slate-700 text-slate-200 border-slate-600"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-2xs"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isExpanded ? "Hide Details" : "Review Details"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </button>

                      {/* If PENDING: Admin can Approve or Reject */}
                      {isPending && (
                        <>
                          <button
                            onClick={() => openRejectModal(camp.id)}
                            disabled={actionLoading}
                            className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border transition disabled:opacity-50 cursor-pointer ${
                              isDark
                                ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40"
                                : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-2xs"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(camp.id, camp.name)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/30 transition disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            Approve Campaign
                          </button>
                        </>
                      )}

                      {/* If APPROVED: Admin can Dispatch (send) */}
                      {isApproved && (
                        <button
                          onClick={() => handleDispatch(camp.id, camp.name)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-700/30 transition disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-white" />
                          Authorize & Dispatch Now
                        </button>
                      )}

                      {/* If DISPATCHED: Show completion badge */}
                      {isDispatched && (
                        <div className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                          isDark
                            ? "text-cyan-400 bg-cyan-950/60 border-cyan-800/60"
                            : "text-cyan-700 bg-cyan-50 border-cyan-200"
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispatched to Public</span>
                        </div>
                      )}

                      {/* If REJECTED: Show status */}
                      {isRejected && (
                        <div className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                          isDark
                            ? "text-rose-400 bg-rose-950/60 border-rose-800/60"
                            : "text-rose-700 bg-rose-50 border-rose-200"
                        }`}>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejection Logged</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Campaign Details Accordion */}
                  {isExpanded && (
                    <div className={`border-t p-5 space-y-4 ${
                      isDark ? "border-slate-700/80 bg-slate-900/60" : "border-slate-100 bg-slate-50/70"
                    }`}>
                      {loadingDetails ? (
                        <div className="py-6 flex items-center justify-center text-xs text-slate-400 gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                          Loading campaign contents and translations...
                        </div>
                      ) : selectedCampaign ? (
                        <div className="space-y-4 text-xs">
                          {/* Metadata row */}
                          <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-lg border ${
                            isDark
                              ? "bg-slate-800/80 border-slate-700 text-slate-200"
                              : "bg-white border-slate-200 text-slate-700 shadow-2xs"
                          }`}>
                            <div>
                              <span className={`block font-semibold mb-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Objective:
                              </span>
                              <span className={isDark ? "text-slate-200" : "text-slate-800"}>
                                {selectedCampaign.objective || "Standard notification broadcast"}
                              </span>
                            </div>
                            <div>
                              <span className={`block font-semibold mb-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Target Segments:
                              </span>
                              <span className={isDark ? "text-slate-200" : "text-slate-800"}>
                                {selectedCampaign.audiences?.map((a: { id: number; name: string }) => a.name).join(", ") ||
                                  selectedCampaign.target_audiences?.join(", ") ||
                                  "General Population"}
                              </span>
                            </div>
                            <div>
                              <span className={`block font-semibold mb-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Created Timestamp:
                              </span>
                              <span className={`font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                {selectedCampaign.created_at ? new Date(selectedCampaign.created_at).toLocaleString() : "Recently"}
                              </span>
                            </div>
                          </div>

                          {/* Content / Translations Preview */}
                          <div className="space-y-2">
                            <span className={`font-bold flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                              <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              Generated Multilingual Content Packages:
                            </span>

                            {selectedCampaign.contents && selectedCampaign.contents.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedCampaign.contents.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-lg border space-y-1.5 ${
                                      isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 shadow-2xs"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                                        Language: {item.language || item.language_code || `Language #${item.language_id}`}
                                      </span>
                                      {item.sentiment_score !== undefined && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                          isDark ? "text-slate-400 bg-slate-700/80" : "text-slate-600 bg-slate-100"
                                        }`}>
                                          Sentiment: {(item.sentiment_score * 100).toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                    <p className={`p-2.5 rounded border leading-relaxed font-sans ${
                                      isDark
                                        ? "text-slate-200 bg-slate-900/80 border-slate-700/50"
                                        : "text-slate-800 bg-slate-50 border-slate-200"
                                    }`}>
                                      {item.body || item.content_text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`p-4 rounded-lg border italic ${
                                isDark ? "bg-slate-800/40 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-500"
                              }`}>
                                No pre-rendered content records attached. Campaign will generate broadcast packages on dispatch.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400">Failed to load details.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl ${
            isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500">
                <XCircle className="w-6 h-6" />
              </span>
              <div>
                <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Reject Campaign</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Specify why this campaign needs revision.</p>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Rejection Reason / Guidance for Campaign Manager <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please clarify safety advisory wording for coastal fishermen, and re-check Telugu translation tone before re-submitting."
                className={`w-full p-3 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-rose-500 border transition ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white"
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600"
                    : "text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 shadow-md shadow-rose-700/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
