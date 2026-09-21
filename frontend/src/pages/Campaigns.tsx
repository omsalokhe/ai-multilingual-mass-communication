import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter } from "lucide-react";
import TopBar from "../components/TopBar";
import StatusBadge from "../components/StatusBadge";
import DataTable, { Column } from "../components/DataTable";

const CAMPAIGNS_DATA = [
  { id: 1, name: "Health Awareness Drive", channel: "All Channels", audience: "All Citizens", status: "COMPLETED", date: "Sep 13, 2025", engagement: "82%", type: "Awareness" },
  { id: 2, name: "Education Policy Update", channel: "Email + SMS", audience: "Students + Parents", status: "SCHEDULED", date: "Sep 14, 2025", engagement: "—", type: "Educational" },
  { id: 3, name: "Emergency Flood Alert", channel: "SMS + Push", audience: "Rural Areas", status: "COMPLETED", date: "Sep 13, 2025", engagement: "91%", type: "Emergency" },
  { id: 4, name: "Employee Onboarding", channel: "Email", audience: "Employees", status: "DRAFT", date: "Sep 12, 2025", engagement: "—", type: "Organizational" },
  { id: 5, name: "Vaccination Awareness", channel: "All Channels", audience: "All Citizens", status: "SCHEDULED", date: "Sep 20, 2025", engagement: "—", type: "Awareness" },
  { id: 6, name: "Dengue Prevention Drive", channel: "WhatsApp + SMS", audience: "Urban Residents", status: "RUNNING", date: "Sep 15, 2025", engagement: "74%", type: "Awareness" },
  { id: 7, name: "Scholarship Notification", channel: "Email", audience: "Students", status: "COMPLETED", date: "Sep 8, 2025", engagement: "68%", type: "Educational" },
  { id: 8, name: "Cyclone Safety Alert", channel: "SMS + Push", audience: "Coastal Areas", status: "COMPLETED", date: "Sep 5, 2025", engagement: "95%", type: "Emergency" },
];

const TABS = ["All", "Awareness", "Emergency", "Educational", "Organizational"];

export default function Campaigns() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = CAMPAIGNS_DATA.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === "All" || c.type === activeTab;
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchTab && matchStatus;
  });

  const columns: Column<typeof CAMPAIGNS_DATA[0]>[] = [
    {
      key: "name",
      label: "Campaign Name",
      sortable: true,
      render: (row: typeof CAMPAIGNS_DATA[0]) => (
        <span className="font-medium text-slate-800">{row.name}</span>
      ),
    },
    {
      key: "channel",
      label: "Channel",
      render: (row: typeof CAMPAIGNS_DATA[0]) => (
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{row.channel}</span>
      ),
    },
    { key: "audience", label: "Audience", sortable: true },
    { key: "date", label: "Date", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (row: typeof CAMPAIGNS_DATA[0]) => <StatusBadge status={row.status} />,
    },
    {
      key: "engagement",
      label: "Engagement",
      render: (row: typeof CAMPAIGNS_DATA[0]) => (
        <span className="font-semibold text-slate-700">{row.engagement}</span>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar>
        <button
          onClick={() => navigate("/campaigns/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Create Campaign
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-slate-800">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all your communication campaigns.</p>
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

        {/* Table */}
        <div className="animate-fade-in">
          <DataTable
            columns={columns}
            data={filtered}
            pageSize={6}
            onRowClick={(row) => navigate(`/campaigns/${row.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
