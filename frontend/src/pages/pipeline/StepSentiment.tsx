import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { analyzeSentiment } from "../../lib/api";
import type { SentimentResponse } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import ScoreRing from "../../components/ScoreRing";
import LanguageComparison from "../../components/LanguageComparison";
import { useToast } from "../../components/Toast";

interface Props {
  campaignId: number;
  onComplete: () => void;
}

const PROVIDERS = ["default", "gemini", "groq"];

export default function StepSentiment({ campaignId, onComplete }: Props) {
  const { toast } = useToast();
  const [includeSuggestions, setIncludeSuggestions] = useState(true);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SentimentResponse | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await analyzeSentiment(campaignId, {
        include_tone_suggestions: includeSuggestions,
        ...(provider ? { provider } : {}),
      });
      setResult(res);
      toast("success", `Analyzed sentiment for ${res.total_analyzed} content(s)`);
      onComplete();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Sentiment analysis failed";
      toast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="flex flex-wrap gap-6 items-end">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-500">
            Include Tone Suggestions
          </label>
          <button
            onClick={() => setIncludeSuggestions(!includeSuggestions)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              includeSuggestions ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                includeSuggestions ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="max-w-xs">
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
        onClick={handleAnalyze}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Activity size={16} />
        )}
        {loading ? "Analyzing…" : "Analyze Sentiment"}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary strip */}
          {result.summary && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
              {Object.entries(result.summary).map(([k, v]) => (
                <span key={k} className="text-slate-500">
                  {k.replace(/_/g, " ")}:{" "}
                  <span className="font-medium text-slate-700">
                    {String(v)}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Per-language cards */}
          <LanguageComparison
            items={result.reports.map((r) => ({
              language: r.language_name,
              languageCode: r.language_code,
              children: (
                <div className="space-y-4">
                  {/* Sentiment + Tone */}
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.sentiment} />
                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                      Tone: {r.tone}
                    </span>
                  </div>

                  {/* Score rings */}
                  <div className="flex items-center gap-6 py-2">
                    <div className="relative flex flex-col items-center">
                      <ScoreRing
                        value={Math.round(r.clarity_score)}
                        size={64}
                        strokeWidth={5}
                      />
                      <span className="text-[10px] text-slate-400 mt-1">
                        Clarity
                      </span>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <ScoreRing
                        value={Math.round(r.overall_score)}
                        size={64}
                        strokeWidth={5}
                      />
                      <span className="text-[10px] text-slate-400 mt-1">
                        Overall
                      </span>
                    </div>
                  </div>

                  {/* Body preview */}
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 mb-0.5">
                      Preview
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-3">
                      {r.body_preview}
                    </p>
                  </div>

                  {/* Tone suggestions */}
                  {r.tone_suggestions && r.tone_suggestions.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                        Suggestions
                      </p>
                      <ul className="space-y-1">
                        {r.tone_suggestions.map((s, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-600 flex gap-1.5"
                          >
                            <span className="text-indigo-400 shrink-0">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        </div>
      )}
    </div>
  );
}
