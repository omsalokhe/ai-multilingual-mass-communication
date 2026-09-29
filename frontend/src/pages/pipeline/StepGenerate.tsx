import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp, FileText, CheckCircle2 } from "lucide-react";
import { generateContent } from "../../lib/api";
import type { GenerateContentResponse, CampaignContent } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/Toast";
import { useAppSettings } from "../../context/AppSettingsContext";

interface Props {
  campaignId: number;
  existingContents?: CampaignContent[];
  campaignObjective?: string;
  onComplete: () => void;
}

const TONES = [
  "Informative",
  "Urgent",
  "Empathetic",
  "Authoritative",
  "Action-oriented",
];
const CHANNELS = ["SMS", "EMAIL", "WHATSAPP", "PUSH", "WEB"];
const PROVIDERS = ["default", "gemini", "groq"];

export default function StepGenerate({
  campaignId,
  existingContents,
  campaignObjective,
  onComplete,
}: Props) {
  const { toast } = useToast();
  const { generalSettings } = useAppSettings();
  const isDark = generalSettings.darkMode;

  const [tone, setTone] = useState("Urgent");
  const [channel, setChannel] = useState("SMS");
  const [maxChars, setMaxChars] = useState(300);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateContentResponse | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check for existing source content
  const sourceContent =
    existingContents?.find((c) => c.language === "English" || c.language_id === 1) ||
    existingContents?.[0];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateContent(campaignId, {
        tone,
        channel,
        max_characters: maxChars,
        ...(provider ? { provider } : {}),
      });
      setResult(res);
      toast("success", "Content generated successfully");
      onComplete();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate content";
      toast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const displayBody = result?.body || sourceContent?.body;
  const displaySubject = result?.subject || sourceContent?.subject;
  const displayChannel = result?.channel || sourceContent?.channel || channel;
  const displayStatus = result?.status || sourceContent?.status || "DRAFT";
  const charCount = displayBody ? displayBody.length : 0;

  return (
    <div className="space-y-6">
      {/* ── Active Content Card (Shows if already exists or just generated) ── */}
      {displayBody ? (
        <div className={`rounded-xl border shadow-sm overflow-hidden ${
          isDark ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-300"
        }`}>
          <div className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? "border-slate-700 bg-slate-850" : "border-slate-200 bg-slate-50"
          }`}>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <CheckCircle2 size={16} />
              </span>
              <div>
                <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                  {result ? "Generated Content (Ready for Translation)" : "Current Campaign Content"}
                </h4>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>
                  Source Language: English • Channel: {displayChannel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={displayStatus} />
              {result?.provider_used && (
                <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded font-medium">
                  {result.provider_used}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {displaySubject && (
              <div>
                <p className={`text-xs font-bold mb-1 uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                  Subject Line
                </p>
                <p className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                  {displaySubject}
                </p>
              </div>
            )}

            <div>
              <p className={`text-xs font-bold mb-1 uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                Message Body
              </p>
              <div className={`p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-white font-normal"
                  : "bg-slate-50 border-slate-200 text-black font-medium"
              }`}>
                {displayBody}
              </div>
            </div>

            {/* Character & word metrics */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className={`font-semibold ${isDark ? "text-slate-300" : "text-black"}`}>
                Length: {charCount} characters • ~{displayBody.split(/\s+/).filter(Boolean).length} words
              </span>
              <span className="text-emerald-600 font-bold">
                ✓ Ready for Step 2: Translation
              </span>
            </div>

            {/* Collapsible prompt (if generated in this session) */}
            {result?.prompt_used && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                >
                  {showPrompt ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showPrompt ? "Hide AI Prompt" : "View AI Prompt Used"}
                </button>
                {showPrompt && (
                  <pre className="mt-2 p-3.5 rounded-lg bg-slate-900 text-slate-200 text-xs overflow-x-auto whitespace-pre-wrap border border-slate-700">
                    {result.prompt_used}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`p-5 rounded-xl border text-center ${
          isDark ? "bg-slate-800/60 border-slate-700" : "bg-amber-50/70 border-amber-200"
        }`}>
          <FileText size={24} className="mx-auto text-amber-500 mb-2" />
          <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
            No Campaign Content Generated Yet
          </h4>
          <p className={`text-xs max-w-md mx-auto mt-1 ${isDark ? "text-slate-300" : "text-black"}`}>
            {campaignObjective
              ? `Campaign Objective: "${campaignObjective}". Configure the generation settings below and click "Generate Content" to draft your message.`
              : "Configure the settings below and click 'Generate Content' to create your initial message."}
          </p>
        </div>
      )}

      {/* ── Generation Parameters Controls ── */}
      <div className={`p-5 rounded-xl border space-y-4 ${
        isDark ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-300 shadow-sm"
      }`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>
          {displayBody ? "Regenerate Content with New Parameters" : "AI Content Generation Parameters"}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-black"}`}>
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium ${
                isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-black"
              }`}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-black"}`}>
              Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium ${
                isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-black"
              }`}
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-black"}`}>
              Max Characters ({maxChars})
            </label>
            <input
              type="range"
              min={50}
              max={2000}
              step={10}
              value={maxChars}
              onChange={(e) => setMaxChars(Number(e.target.value))}
              className="w-full mt-2 accent-indigo-600"
            />
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-black"}`}>
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium ${
                isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-black"
              }`}
            >
              <option value="">Default (Configured Engine)</option>
              {PROVIDERS.filter((p) => p !== "default").map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {loading ? "Generating Content…" : displayBody ? "Regenerate Content" : "Generate Content"}
        </button>
      </div>
    </div>
  );
}
