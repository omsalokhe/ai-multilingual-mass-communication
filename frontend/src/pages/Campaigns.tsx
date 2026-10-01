import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import TopBar from "../components/TopBar";
import StatusBadge from "../components/StatusBadge";
import DataTable, { Column } from "../components/DataTable";
import { getCampaigns, submitForApproval } from "../lib/api";
import type { CampaignBrief } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const TABS = ["All", "Awareness", "Emergency", "Educational", "Organizational"];

export default function Campaigns() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isCampaignManager } = useAuth();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError("Could not load campaigns. Make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApproval = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    setActionLoadingId(id);
    try {
      await submitForApproval(id);
      toast("success", `Campaign "${name}" submitted for Admin approval!`);
      await fetchCampaigns();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to submit for approval";
      toast("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = campaigns.filter((c) => c.status === "PENDING_APPROVAL").length;

  const filtered = campaigns.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.campaign_code.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      activeTab === "All" ||
      (c.campaign_type || "").toLowerCase().includes(activeTab.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchTab && matchStatus;
  });

  const columns: Column<CampaignBrief>[] = [
    {
      key: "name",
      label: "Campaign Name",
      sortable: true,
      render: (row: CampaignBrief) => (
        <div>
          <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span>
          <span className="block text-[11px] text-slate-400 font-mono">{row.campaign_code}</span>
        </div>
      ),
    },
    {
      key: "campaign_type",
      label: "Type",
      render: (row: CampaignBrief) => (
        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
          {row.campaign_type || "General"}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (row: CampaignBrief) => <StatusBadge status={row.priority || "NORMAL"} />,
    },
    {
      key: "target_audiences",
      label: "Audiences",
      render: (row: CampaignBrief) => (
        <div className="flex flex-wrap gap-1">
          {row.target_audiences.length > 0 ? (
            row.target_audiences.map((a, i) => (
              <span
                key={i}
                className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded"
              >
                {a}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: CampaignBrief) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Workflow Action",
      render: (row: CampaignBrief) => {
        const isSubmitting = actionLoadingId === row.id;

        if (row.status === "DRAFT" || row.status === "REJECTED") {
          return (
            <button
              onClick={(e) => handleSubmitApproval(e, row.id, row.name)}
              disabled={isSubmitting}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Clock size={11} />
              )}
              <span>Submit for Approval</span>
            </button>
          );
        }

        if (row.status === "PENDING_APPROVAL") {
          if (isAdmin) {
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/approvals");
                }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition"
              >
                <ShieldCheck size={12} />
                <span>Review & Decide</span>
              </button>
            );
          }
          return (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <Clock size={12} />
              Awaiting Admin Sign-off
            </span>
          );
        }

        if (row.status === "APPROVED") {
          if (isAdmin) {
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/approvals");
                }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition"
              >
                <Send size={12} />
                <span>Dispatch Campaign</span>
              </button>
            );
          }
          return (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={12} />
              Approved by Admin
            </span>
          );
        }

        if (["ACTIVE", "DISPATCHED", "SENT", "COMPLETED"].includes(row.status)) {
          return (
            <span className="flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
              <CheckCircle2 size={12} />
              Broadcast Completed
            </span>
          );
        }

        return <span className="text-xs text-slate-400">—</span>;
      },
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => navigate("/approvals")}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <ShieldCheck size={14} />
              <span>Approvals Hub ({pendingCount})</span>
            </button>
          )}
          <button
            onClick={fetchCampaigns}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/campaigns/create")}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Create Campaign
          </button>
        </div>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
        {/* Admin Pending Alert */}
        {isAdmin && pendingCount > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-amber-400 shrink-0" />
              <span className="text-xs text-amber-300 font-medium">
                <strong>{pendingCount} campaign{pendingCount > 1 ? "s" : ""}</strong> pending your review and authorization.
              </span>
            </div>
            <button
              onClick={() => navigate("/approvals")}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shrink-0"
            >
              <span>Go to Approvals</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}

        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Campaign Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and track communication campaigns. Campaign Managers submit campaigns for Administrator authorization prior to dispatch.
            {campaigns.length > 0 && (
              <span className="ml-1 text-blue-600 font-medium">{campaigns.length} total</span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-200 dark:border-slate-700">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors -mb-px ${
                activeTab === tab ? "tab-active" : "tab-inactive text-slate-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by campaign name, code, domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 appearance-none cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ACTIVE">Active / Dispatched</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-blue-500 animate-spin" />
            <span className="ml-2 text-xs text-slate-500">Loading campaigns...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={32} className="text-amber-400 mb-2" />
            <p className="text-xs text-slate-600 mb-3">{error}</p>
            <button
              onClick={fetchCampaigns}
              className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <DataTable
              columns={columns}
              data={filtered}
              pageSize={8}
              onRowClick={(row) => navigate(`/campaigns/${row.id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
