import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { generateContent } from "../../lib/api";
import type { GenerateContentResponse } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/Toast";

interface Props {
  campaignId: number;
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

export default function StepGenerate({ campaignId, onComplete }: Props) {
  const { toast } = useToast();
  const [tone, setTone] = useState("Informative");
  const [channel, setChannel] = useState("SMS");
  const [maxChars, setMaxChars] = useState(300);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateContentResponse | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

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

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
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
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Provider (optional)
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            <option value="">Default</option>
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Sparkles size={16} />
        )}
        {loading ? "Generating…" : "Generate Content"}
      </button>

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-slate-800">
              Generated Content
            </h4>
            <StatusBadge status={result.status} />
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
              {result.provider_used}
            </span>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
              {result.model_used}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {result.subject && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">
                  Subject
                </p>
                <p className="text-sm text-slate-700 font-medium">
                  {result.subject}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Body</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {result.body}
              </p>
            </div>

            {/* Character count progress */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Character Count</span>
                <span>
                  {result.character_count} / {maxChars}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    result.character_count > maxChars
                      ? "bg-red-500"
                      : result.character_count > maxChars * 0.8
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (result.character_count / maxChars) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Collapsible prompt */}
            {result.prompt_used && (
              <div>
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {showPrompt ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                  {showPrompt ? "Hide prompt used" : "View prompt used"}
                </button>
                {showPrompt && (
                  <pre className="mt-2 p-4 rounded-lg bg-slate-50 text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap border border-slate-200">
                    {result.prompt_used}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
