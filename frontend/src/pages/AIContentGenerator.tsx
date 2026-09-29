import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, Copy, Save, Globe, Loader2, CheckCircle2, Send, X, MessageSquare, Smartphone, Mail, ExternalLink } from "lucide-react";
import TopBar from "../components/TopBar";
import { aiGenerate, sendTestMessage } from "../lib/api";
import type { AIGenerateResponse } from "../types";
import { useAppSettings } from "../context/AppSettingsContext";
import { useToast } from "../components/Toast";

export default function AIContentGenerator() {
  const { generalSettings } = useAppSettings();
  const { toast } = useToast();
  const location = useLocation();
  const prefill = location.state as {
    topic?: string;
    channel?: string;
    tone?: string;
    language?: string;
    maxChars?: number;
  } | null;

  const [topic, setTopic] = useState(prefill?.topic || "");
  const [channel, setChannel] = useState(prefill?.channel || "SMS");
  const [tone, setTone] = useState(prefill?.tone || "Urgent");
  const [language, setLanguage] = useState(prefill?.language || generalSettings.defaultLanguage);
  const [maxChars, setMaxChars] = useState(prefill?.maxChars || 350);
  const [result, setResult] = useState<AIGenerateResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Direct channel dispatch modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState<"EMAIL" | "SMS" | "WHATSAPP">("SMS");
  const [dispatchRecipient, setDispatchRecipient] = useState("+91 9876543210");
  const [dispatchSending, setDispatchSending] = useState(false);
  const [dispatchReceipt, setDispatchReceipt] = useState<any>(null);

  useEffect(() => {
    if (prefill?.language) {
      setLanguage(prefill.language);
    } else {
      setLanguage(generalSettings.defaultLanguage);
    }
  }, [generalSettings.defaultLanguage, prefill?.language]);

  useEffect(() => {
    const chUpper = channel.toUpperCase();
    if (chUpper.includes("SMS")) {
      setDispatchChannel("SMS");
      setDispatchRecipient("+91 9876543210");
    } else if (chUpper.includes("WHATSAPP")) {
      setDispatchChannel("WHATSAPP");
      setDispatchRecipient("+91 9876543210");
    } else {
      setDispatchChannel("EMAIL");
      setDispatchRecipient("citizen.alerts@domain.org");
    }
  }, [channel]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError("");
    setResult(null);
    try {
      const res = await aiGenerate({
        topic: topic.trim(),
        tone,
        channel,
        language,
        max_characters: maxChars,
      });
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate content. Please check if the backend is running.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.generated_text);
      setCopied(true);
      toast("info", "Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDispatch = async () => {
    if (!result || !dispatchRecipient.trim()) {
      toast("error", "Please provide recipient details.");
      return;
    }
    setDispatchSending(true);
    setDispatchReceipt(null);
    try {
      const res = await sendTestMessage({
        channel: dispatchChannel,
        recipient: dispatchRecipient.trim(),
        subject: topic.trim() || "Official Public Communication Alert",
        message: result.generated_text,
        language,
      });
      setDispatchReceipt(res);
      toast("success", `Content successfully dispatched via ${dispatchChannel}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch message";
      toast("error", msg);
    } finally {
      setDispatchSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">AI Content Generator</h1>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                Powered by Gemini / Groq LLM
              </span>
            </div>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Left: Input */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Campaign Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Dengue prevention awareness drive..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Select Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
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
                <label className="text-xs font-medium text-slate-600 mb-2 block">Tone</label>
                <div className="flex gap-2">
                  {["Formal", "Friendly", "Urgent", "Informative", "Empathetic"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
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

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Globe size={12} /> Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Kannada</option>
                  <option>Tamil</option>
                  <option>Telugu</option>
                  <option>Marathi</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Max Characters ({maxChars})
                </label>
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={10}
                  value={maxChars}
                  onChange={(e) => setMaxChars(Number(e.target.value))}
                  className="w-full mt-1 accent-indigo-600"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate Content
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Right: Output */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-medium text-slate-600">
                  Generated Content
                </label>
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Copy size={12} />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => {
                        setDispatchReceipt(null);
                        setShowDispatchModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                    >
                      <Send size={12} />
                      Send via {dispatchChannel}
                    </button>
                  </div>
                )}
              </div>

              <div className="min-h-[350px] p-4 rounded-lg border border-slate-200 bg-slate-50 overflow-y-auto">
                {result ? (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {result.generated_text}
                    </p>

                    {/* Metadata */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 size={10} /> {result.language}
                        </span>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          {result.character_count} chars
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                          {result.provider_used}
                        </span>
                      </div>
                      {result.was_translated && result.original_english_text && (
                        <details className="mt-2">
                          <summary className="text-[11px] text-indigo-600 cursor-pointer font-medium hover:text-indigo-700">
                            View original English text
                          </summary>
                          <p className="mt-2 text-xs text-slate-500 leading-relaxed whitespace-pre-line p-3 bg-white rounded-lg border border-slate-100">
                            {result.original_english_text}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <Sparkles size={36} className="text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400">
                      Enter a topic and click "Generate Content" to create AI-powered campaign content.
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Supports multilingual generation in Hindi, Kannada, Tamil, Telugu & Marathi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Channel Dispatch Modal */}
      {showDispatchModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Transmit Generated Content via Channel
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
                  Target Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["SMS", "WHATSAPP", "EMAIL"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => {
                        setDispatchChannel(ch);
                        if (ch === "EMAIL") {
                          setDispatchRecipient("citizen.alerts@domain.org");
                        } else {
                          setDispatchRecipient("+91 9876543210");
                        }
                      }}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        dispatchChannel === ch
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {ch === "SMS" && <MessageSquare size={13} />}
                      {ch === "WHATSAPP" && <Smartphone size={13} />}
                      {ch === "EMAIL" && <Mail size={13} />}
                      {ch === "WHATSAPP" ? "WhatsApp" : ch}
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
                  placeholder={dispatchChannel === "EMAIL" ? "citizen@example.com" : "+91 9876543210"}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs input-focus font-mono"
                />
              </div>

              {/* Language Indicator */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Content Language:</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {result.language}
                </span>
              </div>

              {/* Message preview */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Message Content Preview
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 max-h-36 overflow-y-auto whitespace-pre-line leading-relaxed">
                  {result.generated_text}
                </div>
              </div>

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
                        href={dispatchReceipt.whatsapp_url || `https://wa.me/${dispatchRecipient.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(result.generated_text)}`}
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
                        href={dispatchReceipt.sms_url || `sms:${dispatchRecipient.replace(/[^0-9+]/g, "")}?body=${encodeURIComponent(result.generated_text)}`}
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
                    Dispatch via {dispatchChannel}
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
