import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Calendar, Loader2 } from "lucide-react";
import TopBar from "../components/TopBar";
import { useToast } from "../components/Toast";
import { createCampaign, getSegments } from "../lib/api";
import type { SegmentBrief } from "../types";

const STEPS = ["Details", "Audience", "Content", "Review"];

const CAMPAIGN_TYPES = [
  { id: 1, name: "Awareness Campaign" },
  { id: 2, name: "Emergency Alert" },
  { id: 3, name: "Educational Notification" },
];

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state as {
    name?: string;
    description?: string;
    priority?: string;
    campaignTypeId?: number;
    objective?: string;
    contentBody?: string;
    contentSubject?: string;
  } | null;

  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [campaignName, setCampaignName] = useState(prefill?.name || "");
  const [campaignTypeId, setCampaignTypeId] = useState(prefill?.campaignTypeId || 2);
  const [priority, setPriority] = useState(prefill?.priority || "HIGH");
  const [description, setDescription] = useState(prefill?.description || "");
  const [objective, setObjective] = useState(prefill?.objective || prefill?.description || "");
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [contentBody, setContentBody] = useState(prefill?.contentBody || "");
  const [contentSubject, setContentSubject] = useState(prefill?.contentSubject || "");
  const [submitting, setSubmitting] = useState(false);

  // Fetch real segments from backend
  const [segments, setSegments] = useState<SegmentBrief[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);

  useEffect(() => {
    fetchSegments();
  }, []);

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

  const toggleSegment = (id: number) => {
    setSelectedSegments((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0: return campaignName.trim();
      case 1: return selectedSegments.length > 0;
      case 2: return true; // Content is optional — can be AI-generated later
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await createCampaign({
        name: campaignName.trim(),
        description: description || undefined,
        campaign_type_id: campaignTypeId,
        objective: objective || description || campaignName,
        priority,
        segment_ids: selectedSegments,
        content_body: contentBody ? contentBody.trim() : undefined,
        content_subject: contentSubject ? contentSubject.trim() : undefined,
      });
      toast("success", res.message);
      // Navigate to the new campaign's pipeline
      navigate(`/campaigns/${res.campaign_id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create campaign";
      toast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeName = () => CAMPAIGN_TYPES.find(t => t.id === campaignTypeId)?.name || "Awareness";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="animate-fade-in">
            <button
              onClick={() => navigate("/campaigns")}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Campaigns
            </button>
            <h1 className="text-xl font-bold text-slate-800">Create New Campaign</h1>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 bg-white rounded-xl border border-slate-200 p-1 animate-fade-in">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => i <= step && setStep(i)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  i === step
                    ? "bg-blue-600 text-white shadow-sm"
                    : i < step
                      ? "text-blue-600 cursor-pointer hover:bg-blue-50"
                      : "text-slate-400 cursor-not-allowed"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === step
                    ? "bg-white/20 text-white"
                    : i < step
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-400"
                }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Campaign Details</h2>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Campaign Name *</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Campaign Type *</label>
                    <select
                      value={campaignTypeId}
                      onChange={(e) => setCampaignTypeId(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
                    >
                      {CAMPAIGN_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Objective</label>
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="What is the goal of this campaign?"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-600 block">Description</label>
                    <span className="text-[11px] text-slate-400">{description.length}/500</span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    placeholder="Describe your campaign..."
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus resize-none"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Select Audience Segments *</h2>
                {loadingSegments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="text-blue-500 animate-spin" />
                    <span className="ml-2 text-sm text-slate-500">Loading segments...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {segments.map((seg) => (
                      <button
                        key={seg.id}
                        onClick={() => toggleSegment(seg.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                          selectedSegments.includes(seg.id)
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <span className="text-sm font-medium text-slate-800">{seg.name}</span>
                          <span className="block text-xs text-slate-500">
                            {seg.member_count} member{seg.member_count !== 1 ? "s" : ""}
                          </span>
                          {seg.description && (
                            <span className="block text-[11px] text-slate-400 mt-0.5">{seg.description}</span>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                          selectedSegments.includes(seg.id)
                            ? "bg-blue-600 border-blue-600"
                            : "border-slate-300"
                        }`}>
                          {selectedSegments.includes(seg.id) && <Check size={12} className="text-white" />}
                        </div>
                      </button>
                    ))}
                    {segments.length === 0 && (
                      <p className="col-span-2 text-center text-xs text-slate-400 py-8">
                        No audience segments found. Seed sample data from the API docs.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Campaign Content</h2>
                <p className="text-xs text-slate-500 -mt-2 mb-3">
                  Optional — you can also generate content using AI after creating the campaign.
                </p>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Subject Line</label>
                  <input
                    type="text"
                    value={contentSubject}
                    onChange={(e) => setContentSubject(e.target.value)}
                    placeholder="Enter subject line..."
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Message Body</label>
                  <textarea
                    value={contentBody}
                    onChange={(e) => setContentBody(e.target.value)}
                    placeholder="Write your campaign message or leave empty to use AI generation..."
                    rows={8}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus resize-none"
                  />
                </div>
                <div className="text-right text-xs text-slate-400">
                  {contentBody.length} characters
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Review Campaign</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Campaign Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-800">{campaignName || "—"}</span></div>
                      <div><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-800">{getTypeName()}</span></div>
                      <div><span className="text-slate-500">Priority:</span> <span className="font-medium text-slate-800">{priority}</span></div>
                      <div><span className="text-slate-500">Objective:</span> <span className="font-medium text-slate-800">{objective || "—"}</span></div>
                    </div>
                    {description && (
                      <p className="text-xs text-slate-600 mt-2">{description}</p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Audience</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSegments.map((id) => {
                        const seg = segments.find((s) => s.id === id);
                        return seg ? (
                          <span key={id} className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                            {seg.name} ({seg.member_count})
                          </span>
                        ) : null;
                      })}
                      {selectedSegments.length === 0 && <span className="text-xs text-slate-400">No segments selected</span>}
                    </div>
                  </div>

                  {(contentSubject || contentBody) && (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Content</h3>
                      {contentSubject && <p className="text-sm font-medium text-slate-800 mb-1">{contentSubject}</p>}
                      <p className="text-xs text-slate-600 leading-relaxed">{contentBody || "No content added — use AI generation after creation"}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between animate-fade-in">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : navigate("/campaigns")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={14} />
              {step === 0 ? "Cancel" : "Previous"}
            </button>
            <button
              onClick={() => {
                if (step < 3) setStep(step + 1);
                else handleSubmit();
              }}
              disabled={!canProceed() || submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </>
              ) : step === 3 ? (
                "Create Campaign"
              ) : (
                <>
                  Next
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
