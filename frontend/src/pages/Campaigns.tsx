import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import TopBar from "../components/TopBar";
import StatusBadge from "../components/StatusBadge";
import DataTable, { Column } from "../components/DataTable";
import { getCampaigns } from "../lib/api";
import type { CampaignBrief } from "../types";

const TABS = ["All", "Awareness", "Emergency", "Educational", "Organizational"];

export default function Campaigns() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignBrief[]>([]);
  const [loading, setLoading] = useState(true);
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

  const filtered = campaigns.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
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
          <span className="font-medium text-slate-800">{row.name}</span>
          <span className="block text-[11px] text-slate-400 font-mono">{row.campaign_code}</span>
        </div>
      ),
    },
    {
      key: "campaign_type",
      label: "Type",
      render: (row: CampaignBrief) => (
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
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
          {row.target_audiences.length > 0
            ? row.target_audiences.map((a, i) => (
                <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                  {a}
                </span>
              ))
            : <span className="text-xs text-slate-400">—</span>}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: CampaignBrief) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCampaigns}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/campaigns/create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create Campaign
          </button>
        </div>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-slate-800">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and track all your communication campaigns.
            {campaigns.length > 0 && (
              <span className="ml-1 text-blue-600 font-medium">{campaigns.length} total</span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
                activeTab === tab ? "tab-active" : "tab-inactive"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-8 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-blue-500 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Loading campaigns...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={32} className="text-amber-400 mb-2" />
            <p className="text-sm text-slate-600 mb-3">{error}</p>
            <button
              onClick={fetchCampaigns}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
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
