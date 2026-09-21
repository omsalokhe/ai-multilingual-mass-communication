import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Calendar } from "lucide-react";
import TopBar from "../components/TopBar";

const STEPS = ["Details", "Audience", "Content", "Review"];

const CAMPAIGN_TYPES = [
  "Awareness Campaign",
  "Emergency Alert",
  "Educational Notification",
  "Organizational Announcement",
];

const CHANNELS = ["Email", "SMS", "WhatsApp", "Push Notifications", "Web Broadcast", "Social Media"];

const AUDIENCE_SEGMENTS = [
  { id: 1, name: "Urban Youth", count: 5420 },
  { id: 2, name: "Rural Communities", count: 6391 },
  { id: 3, name: "Students", count: 4120 },
  { id: 4, name: "Healthcare Workers", count: 1230 },
  { id: 5, name: "General Public", count: 8650 },
  { id: 6, name: "Employers", count: 6723 },
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [campaignTone, setCampaignTone] = useState("Formal");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [contentBody, setContentBody] = useState("");
  const [contentSubject, setContentSubject] = useState("");

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const toggleSegment = (id: number) => {
    setSelectedSegments((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0: return campaignName.trim() && campaignType;
      case 1: return selectedSegments.length > 0;
      case 2: return contentBody.trim();
      case 3: return true;
      default: return false;
    }
  };

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
                      value={campaignType}
                      onChange={(e) => setCampaignType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
                    >
                      <option value="">Select type...</option>
                      {CAMPAIGN_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Tone</label>
                    <select
                      value={campaignTone}
                      onChange={(e) => setCampaignTone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
                    >
                      <option value="">Select tone...</option>
                      <option value="Formal">Formal</option>
                      <option value="Friendly">Friendly</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Informative">Informative</option>
                      <option value="Promotional">Promotional</option>
                    </select>
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1"><Calendar size={10} /> Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1"><Calendar size={10} /> End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Select Audience</h2>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Channels</label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((ch) => (
                      <button
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          selectedChannels.includes(ch)
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Audience Segments *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AUDIENCE_SEGMENTS.map((seg) => (
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
                          <span className="block text-xs text-slate-500">{seg.count.toLocaleString()} recipients</span>
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
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Campaign Content</h2>
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
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Message Body *</label>
                  <textarea
                    value={contentBody}
                    onChange={(e) => setContentBody(e.target.value)}
                    placeholder="Write your campaign message..."
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
                      <div><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-800">{campaignType || "—"}</span></div>
                      <div><span className="text-slate-500">Start:</span> <span className="font-medium text-slate-800">{startDate || "—"}</span></div>
                      <div><span className="text-slate-500">End:</span> <span className="font-medium text-slate-800">{endDate || "—"}</span></div>
                    </div>
                    {description && (
                      <p className="text-xs text-slate-600 mt-2">{description}</p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Audience</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSegments.map((id) => {
                        const seg = AUDIENCE_SEGMENTS.find((s) => s.id === id);
                        return seg ? (
                          <span key={id} className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                            {seg.name} ({seg.count.toLocaleString()})
                          </span>
                        ) : null;
                      })}
                      {selectedSegments.length === 0 && <span className="text-xs text-slate-400">No segments selected</span>}
                    </div>
                    {selectedChannels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedChannels.map((ch) => (
                          <span key={ch} className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            {ch}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Content</h3>
                    {contentSubject && <p className="text-sm font-medium text-slate-800 mb-1">{contentSubject}</p>}
                    <p className="text-xs text-slate-600 leading-relaxed">{contentBody || "No content added"}</p>
                  </div>
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
                else navigate("/campaigns");
              }}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {step === 3 ? "Create Campaign" : "Next"}
              {step < 3 && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
