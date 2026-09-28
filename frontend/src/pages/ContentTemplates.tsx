import { useState, useEffect } from "react";
import { Sparkles, Copy, Save, FileText, AlertTriangle, BookOpen, Building2, Globe, Radio, CheckCircle2, AlertCircle, Send, X, Loader2, ExternalLink, MessageSquare } from "lucide-react";
import TopBar from "../components/TopBar";
import { aiGenerate, sendTestMessage } from "../lib/api";
import { useToast } from "../components/Toast";
import { useAppSettings } from "../context/AppSettingsContext";

interface TemplateItem {
  id: number;
  name: string;
  description: string;
  defaultTopic: string;
  defaultGuidance: string;
  defaultTone: string;
  icon: React.ReactNode;
  category: string;
  color: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 1,
    name: "Health Awareness",
    description: "Promote healthy practices, disease prevention, and wellness campaigns.",
    defaultTopic: "Preventive Healthcare & Hygiene Advisory",
    defaultGuidance: "Include hand hygiene, symptoms check, nearest clinic visits, and helpline 104.",
    defaultTone: "Informative",
    icon: <FileText size={20} className="text-blue-600" />,
    category: "Awareness",
    color: "bg-blue-50/60 border-blue-200/70 hover:border-blue-300",
  },
  {
    id: 2,
    name: "Emergency Alert",
    description: "Urgent alerts for natural disasters, weather emergencies, and district warnings.",
    defaultTopic: "Heavy Rainfall & Flood Warning",
    defaultGuidance: "Advise moving to higher shelter, emergency food/water kits, helpline 1070/112.",
    defaultTone: "Urgent",
    icon: <AlertTriangle size={20} className="text-red-600" />,
    category: "Emergency",
    color: "bg-red-50/60 border-red-200/70 hover:border-red-300",
  },
  {
    id: 3,
    name: "Policy Update",
    description: "Government public policy and administrative rule updates.",
    defaultTopic: "Digital Citizen Services & Aadhaar Update",
    defaultGuidance: "Mention free online portal updates, verification deadline, and Seva Kendra visits.",
    defaultTone: "Formal",
    icon: <Building2 size={20} className="text-amber-600" />,
    category: "Educational",
    color: "bg-amber-50/60 border-amber-200/70 hover:border-amber-300",
  },
  {
    id: 4,
    name: "Educational Notice",
    description: "Academic notifications, scholarship alerts, and entrance exam updates.",
    defaultTopic: "National Merit Scholarship Portal Opening",
    defaultGuidance: "Detail eligibility requirements, application deadline, and official verification portal.",
    defaultTone: "Formal",
    icon: <BookOpen size={20} className="text-emerald-600" />,
    category: "Educational",
    color: "bg-emerald-50/60 border-emerald-200/70 hover:border-emerald-300",
  },
];

const CATEGORY_TABS = ["All", "Awareness", "Emergency", "Educational"];

export default function ContentTemplates() {
  const { generalSettings } = useAppSettings();
  const { toast } = useToast();

  const [topic, setTopic] = useState("");
  const [guidance, setGuidance] = useState("");
  const [tone, setTone] = useState("Formal");
  const [channel, setChannel] = useState("Email");
  const [language, setLanguage] = useState(generalSettings.defaultLanguage);
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);
  const [providerUsed, setProviderUsed] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Direct channel dispatch modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState<"EMAIL" | "SMS" | "WHATSAPP">("SMS");
  const [dispatchRecipient, setDispatchRecipient] = useState("+91 9579333426");
  const [dispatchSending, setDispatchSending] = useState(false);
  const [dispatchReceipt, setDispatchReceipt] = useState<any>(null);
  const [dispatchError, setDispatchError] = useState<string>("");

  // Sync default language when changed in Settings
  useEffect(() => {
    setLanguage(generalSettings.defaultLanguage);
  }, [generalSettings.defaultLanguage]);

  // Adjust dispatch channel and recipient when template channel changes
  useEffect(() => {
    const chUpper = channel.toUpperCase();
    setDispatchReceipt(null);
    setDispatchError("");
    if (chUpper.includes("SMS")) {
      setDispatchChannel("SMS");
      setDispatchRecipient("+91 9579333426");
    } else if (chUpper.includes("WHATSAPP")) {
      setDispatchChannel("WHATSAPP");
      setDispatchRecipient("+91 9579333426");
    } else {
      setDispatchChannel("EMAIL");
      setDispatchRecipient("omsalokhe2020@gmail.com");
    }
  }, [channel]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const res = await aiGenerate({
        topic: topic.trim(),
        guidance: guidance.trim() || undefined,
        tone,
        channel,
        language,
        max_characters: 700,
      });

      if (res && res.generated_text) {
        setGenerated(res.generated_text);
        setProviderUsed(res.provider_used || "AI Provider");
        setCharCount(res.character_count || res.generated_text.length);
        toast("success", "Content generated successfully!");
      } else {
        throw new Error("Empty response received from AI generator.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate content. Please ensure backend is running.";
      setError(msg);
      toast("error", msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDispatch = async () => {
    if (!generated.trim() || !dispatchRecipient.trim()) {
      toast("error", "Please provide recipient details.");
      return;
    }
    setDispatchSending(true);
    setDispatchReceipt(null);
    setDispatchError("");
    try {
      const res = await sendTestMessage({
        channel: dispatchChannel,
        recipient: dispatchRecipient.trim(),
        subject: topic.trim() || "Official Public Communication Alert",
        message: generated,
        language,
      });
      setDispatchReceipt(res);
      toast("success", `Campaign content broadcasted successfully via ${dispatchChannel}!`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || (err instanceof Error ? err.message : "Failed to dispatch campaign");
      setDispatchError(msg);
      toast("error", msg);
    } finally {
      setDispatchSending(false);
    }
  };

  const handleCopy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    toast("info", "Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!generated) return;
    toast("success", "Template draft saved to campaign templates library!");
  };

  const handleUseTemplate = (tmpl: TemplateItem) => {
    setTopic(tmpl.defaultTopic);
    setGuidance(tmpl.defaultGuidance);
    setTone(tmpl.defaultTone);
    toast("info", `Applied template: ${tmpl.name}`);
    // Smoothly scroll up to generator
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredTemplates = TEMPLATES.filter(
    (t) => activeCategory === "All" || t.category === activeCategory
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-slate-800">Content & Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Generate AI-powered content tailored to your topic and manage reusable templates.</p>
        </div>

        {/* AI Content Generator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">AI Content Generator</h2>
                <span className="text-[10px] text-slate-500">Intelligent context-driven mass communication writer</span>
              </div>
            </div>
            {providerUsed && (
              <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-100 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-blue-600" />
                {providerUsed}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input side */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Campaign Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Corona vaccination drive, Flood relief alert, Traffic advisory..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Say with the message? (Key points / Guidance)
                </label>
                <textarea
                  value={guidance}
                  onChange={(e) => setGuidance(e.target.value)}
                  placeholder="e.g., Mention mandatory mask wearing, free booster doses at PHC, helpline numbers..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                    <Radio size={12} /> Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white input-focus"
                  >
                    <option>Email</option>
                    <option>SMS</option>
                    <option>WhatsApp</option>
                    <option>Push Notification</option>
                    <option>Web Broadcast</option>
                    <option>Social Media</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                    <Globe size={12} /> Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white input-focus"
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Kannada</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                    <option>Marathi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Tone</label>
                <div className="flex gap-2">
                  {["Formal", "Friendly", "Urgent", "Informative"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        tone === t
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Content for {topic ? `"${topic.slice(0, 20)}..."` : "topic"}
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Generate Content
                  </>
                )}
              </button>
            </div>

            {/* Generated content */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-600">Generated Content</label>
                {generated && (
                  <span className="text-[11px] text-slate-400">
                    {charCount} characters • {language}
                  </span>
                )}
              </div>
              <div className="flex-1 min-h-[260px] max-h-[340px] p-4 rounded-lg border border-slate-200 bg-slate-50 overflow-y-auto">
                {generated ? (
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{generated}</p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                    <Sparkles size={28} className="text-slate-300 mb-2" />
                    <p className="text-sm font-medium">No content generated yet</p>
                    <p className="text-xs text-slate-400 mt-1">Enter your campaign topic on the left and click "Generate Content".</p>
                  </div>
                )}
              </div>
              {generated && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Copy size={12} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Save size={12} />
                    Save Template
                  </button>
                  <button
                    onClick={() => {
                      setDispatchReceipt(null);
                      setShowDispatchModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs ml-auto cursor-pointer"
                  >
                    <Send size={12} />
                    Send via {dispatchChannel}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Pre-built Public Templates</h2>
              <p className="text-xs text-slate-500">Click "Use Template" to auto-populate the generator with recommended parameters</p>
            </div>
          </div>

          <div className="flex gap-0 border-b border-slate-200 mb-4">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCategory(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
                  activeCategory === tab ? "tab-active" : "tab-inactive"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className={`rounded-xl border p-5 card-hover transition-all flex flex-col justify-between ${tmpl.color}`}
              >
                <div>
                  <div className="mb-3">{tmpl.icon}</div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{tmpl.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{tmpl.description}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleUseTemplate(tmpl)}
                    className="w-full px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Sparkles size={12} />
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Direct Channel Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Broadcast Campaign via Channel
                </h3>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Select Target Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["SMS", "WHATSAPP", "EMAIL"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => {
                        setDispatchChannel(ch);
                        setDispatchReceipt(null);
                        setDispatchError("");
                        if (ch === "EMAIL") {
                          setDispatchRecipient("omsalokhe2020@gmail.com");
                        } else {
                          setDispatchRecipient("+91 9579333426");
                        }
                      }}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        dispatchChannel === ch
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {ch === "SMS" ? "SMS" : ch === "WHATSAPP" ? "WhatsApp" : "Email"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Recipient {dispatchChannel === "EMAIL" ? "Email Address" : "Phone Number"}
                </label>
                <input
                  type="text"
                  value={dispatchRecipient}
                  onChange={(e) => setDispatchRecipient(e.target.value)}
                  placeholder={dispatchChannel === "EMAIL" ? "citizen@example.com" : "+91 9579333426"}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs input-focus font-mono"
                />
              </div>

              {/* Language Indicator */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Content Language:</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {language}
                </span>
              </div>

              {/* Message preview */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Message Content Preview
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 max-h-36 overflow-y-auto whitespace-pre-line leading-relaxed">
                  {generated}
                </div>
              </div>

              {/* Error feedback */}
              {dispatchError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 space-y-1 animate-fade-in text-xs text-red-800">
                  <div className="flex items-center gap-1.5 font-bold text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Dispatch Error
                  </div>
                  <p className="text-[11px] text-red-700">{dispatchError}</p>
                </div>
              )}

              {/* Receipt feedback */}
              {dispatchReceipt && (
                <div className={`p-3.5 rounded-xl border space-y-2.5 animate-fade-in text-xs ${
                  dispatchReceipt.status === "DELIVERED"
                    ? "bg-emerald-50/80 border-emerald-200"
                    : "bg-amber-50/80 border-amber-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 font-bold ${
                      dispatchReceipt.status === "DELIVERED" ? "text-emerald-800" : "text-amber-800"
                    }`}>
                      <CheckCircle2 size={14} className={dispatchReceipt.status === "DELIVERED" ? "text-emerald-600" : "text-amber-600"} />
                      {dispatchReceipt.status === "DELIVERED" ? "Live Gateway Delivery Recorded" : "Gateway Notice / Sandbox Delivery"}
                    </div>
                    {dispatchReceipt.provider && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 font-medium text-slate-700 shadow-2xs">
                        {dispatchReceipt.provider}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] leading-relaxed ${
                    dispatchReceipt.status === "DELIVERED" ? "text-emerald-700" : "text-amber-800"
                  }`}>
                    {dispatchReceipt.details}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    Gateway ID: {dispatchReceipt.message_id}
                  </p>

                  {/* Real-life Direct Actions */}
                  {dispatchChannel === "WHATSAPP" && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                      <a
                        href={dispatchReceipt.whatsapp_url || `https://wa.me/${dispatchRecipient.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(generated)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <ExternalLink size={13} />
                        Open & Send in WhatsApp (Web / Phone)
                      </a>
                      <span className="text-[10px] text-slate-500 text-center">
                        Bypasses sandbox template limits to send 100% authentic, full multilingual message directly.
                      </span>
                    </div>
                  )}

                  {dispatchChannel === "SMS" && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                      <a
                        href={dispatchReceipt.sms_url || `sms:${dispatchRecipient.replace(/[^0-9+]/g, "")}?body=${encodeURIComponent(generated)}`}
                        className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <MessageSquare size={13} />
                        Open in Phone SMS App (Send Live SMS)
                      </a>
                      <span className="text-[10px] text-slate-500 text-center">
                        To enable automated live SMS via API: Fast2SMS requires a 1-time ₹100 account transaction on fast2sms.com.
                      </span>
                    </div>
                  )}

                  {dispatchChannel === "EMAIL" && dispatchReceipt.mailto_url && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                      <a
                        href={dispatchReceipt.mailto_url}
                        className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <ExternalLink size={13} />
                        Open in Default Email App
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={dispatchSending || !dispatchRecipient.trim()}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {dispatchSending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Transmitting...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Dispatch Now via {dispatchChannel}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
