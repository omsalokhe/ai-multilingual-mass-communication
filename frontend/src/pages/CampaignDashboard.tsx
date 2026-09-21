import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Megaphone,
  Database,
  Users,
  Loader2,
} from "lucide-react";
import { getCampaigns, seedSampleData } from "../lib/api";
import type { CampaignBrief } from "../types";
import TopBar from "../components/TopBar";
import StatusBadge from "../components/StatusBadge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";

const ALL_STATUSES = [
  "DRAFT",
  "READY_FOR_REVIEW",
  "VALIDATED",
  "SCHEDULED",
  "RUNNING",
  "COMPLETED",
  "CANCELLED",
];

export default function CampaignDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      toast("error", "Failed to load campaigns");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedSampleData();
      toast("success", res.message);
      await fetchCampaigns();
    } catch (err) {
      toast("error", "Failed to seed sample data");
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const types = useMemo(
    () => [...new Set(campaigns.map((c) => c.campaign_type).filter(Boolean))],
    [campaigns]
  );

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.campaign_code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchType = !typeFilter || c.campaign_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [campaigns, search, statusFilter, typeFilter]);

  // ── Empty state ──────────────────────────────
  if (!loading && campaigns.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Campaign Dashboard" crumbs={[{ label: "Dashboard" }]} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center">
              <Megaphone className="text-indigo-400" size={36} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              No campaigns yet
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Get started by seeding sample data to explore the platform's AI
              content pipeline.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {seeding ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Database size={16} />
              )}
              {seeding ? "Seeding…" : "Seed Sample Data"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Campaign Dashboard" crumbs={[{ label: "Dashboard" }]} />

      <div className="flex-1 p-6 md:p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search campaigns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors bg-white"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-8 pr-8 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 appearance-none cursor-pointer"
            >
              <option value="">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <LoadingSkeleton rows={6} type="card" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No campaigns match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/campaigns/${c.id}`)}
                className="text-left rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {c.campaign_code}
                    </p>
                  </div>
                  <StatusBadge status={c.priority} />
                </div>

                {/* Type + Status */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                    {c.campaign_type}
                  </span>
                  <StatusBadge status={c.status} />
                </div>

                {/* Audiences */}
                {c.target_audiences.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.target_audiences.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
                      >
                        <Users size={10} className="text-slate-400" />
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
