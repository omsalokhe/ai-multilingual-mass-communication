import { useState, useEffect } from "react";
import { Plus, Search, Users, Globe, Save, Loader2 } from "lucide-react";
import TopBar from "../components/TopBar";
import { useToast } from "../components/Toast";
import { getSegments, getRecipients, createSegment } from "../lib/api";
import type { SegmentBrief, RecipientBrief } from "../types";

const TABS = ["Segments", "All Contacts"];

export default function Audience() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Segments");
  const [search, setSearch] = useState("");

  // Segments state
  const [segments, setSegments] = useState<SegmentBrief[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);

  // Recipients state
  const [recipients, setRecipients] = useState<RecipientBrief[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientsFetched, setRecipientsFetched] = useState(false);

  // Create segment form
  const [segName, setSegName] = useState("");
  const [segDesc, setSegDesc] = useState("");
  const [savingSegment, setSavingSegment] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, []);

  useEffect(() => {
    if (activeTab === "All Contacts" && !recipientsFetched) {
      fetchRecipients();
    }
  }, [activeTab]);

  const fetchSegments = async () => {
    setLoadingSegments(true);
    try {
      const data = await getSegments();
      setSegments(data);
    } catch (err) {
      console.error("Failed to load segments:", err);
    } finally {
      setLoadingSegments(false);
    }
  };

  const fetchRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const data = await getRecipients();
      setRecipients(data);
      setRecipientsFetched(true);
    } catch (err) {
      console.error("Failed to load recipients:", err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleCreateSegment = async () => {
    if (!segName.trim()) return;
    setSavingSegment(true);
    try {
      const res = await createSegment({
        name: segName.trim(),
        description: segDesc.trim() || undefined,
      });
      toast("success", res.message);
      setSegName("");
      setSegDesc("");
      fetchSegments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create segment";
      toast("error", msg);
    } finally {
      setSavingSegment(false);
    }
  };

  const filteredSegments = segments.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = recipients.filter(
    (c) =>
      !search ||
      `${c.first_name} ${c.last_name || ""}`.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar>
        <button
          onClick={() => setActiveTab("Segments")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Segment
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-slate-800">Audience Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your audience segments and contacts.</p>
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

        {activeTab === "Segments" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
            {/* Segment List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search segments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus"
                />
              </div>

              <h3 className="text-sm font-semibold text-slate-700">
                Audience Segments
                {segments.length > 0 && (
                  <span className="ml-1 text-xs text-slate-400 font-normal">({segments.length})</span>
                )}
              </h3>

              {loadingSegments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="text-blue-500 animate-spin" />
                  <span className="ml-2 text-sm text-slate-500">Loading segments...</span>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Segment Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Members</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSegments.map((seg) => (
                        <tr key={seg.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 cursor-pointer transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-blue-500" />
                              <div>
                                <span className="font-medium text-slate-800">{seg.name}</span>
                                {seg.description && (
                                  <span className="block text-[11px] text-slate-400">{seg.description}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{seg.member_count}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              seg.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {seg.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredSegments.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400">
                            No segments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Create Segment Form */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Create Segment</h3>
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Segment Name *</label>
                  <input
                    type="text"
                    value={segName}
                    onChange={(e) => setSegName(e.target.value)}
                    placeholder="e.g. Young Adults"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm input-focus"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Description</label>
                  <textarea
                    value={segDesc}
                    onChange={(e) => setSegDesc(e.target.value)}
                    placeholder="Describe this segment..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm input-focus resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateSegment}
                  disabled={!segName.trim() || savingSegment}
                  className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {savingSegment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Segment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "All Contacts" && (
          <div className="animate-fade-in space-y-4">
            <div className="relative max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus"
              />
            </div>

            {loadingRecipients ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="text-blue-500 animate-spin" />
                <span className="ml-2 text-sm text-slate-500">Loading contacts...</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">City</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Language</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Occupation</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {c.first_name} {c.last_name || ""}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{c.email || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{c.city || "—"}</td>
                        <td className="px-4 py-3">
                          {c.preferred_language ? (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                              <Globe size={10} /> {c.preferred_language}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{c.occupation || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredContacts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                          No contacts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
