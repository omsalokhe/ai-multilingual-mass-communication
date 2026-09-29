import { useState, useEffect } from "react";
import { Activity, Loader2 } from "lucide-react";
import { analyzeSentiment } from "../../lib/api";
import type { SentimentResponse } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import ScoreRing from "../../components/ScoreRing";
import LanguageComparison from "../../components/LanguageComparison";
import { useToast } from "../../components/Toast";
import { useAppSettings } from "../../context/AppSettingsContext";

interface Props {
  campaignId: number;
  onComplete: () => void;
}

const PROVIDERS = ["default", "gemini", "groq"];

export default function StepSentiment({ campaignId, onComplete }: Props) {
  const { toast } = useToast();
  const { generalSettings } = useAppSettings();
  const isDark = generalSettings.darkMode;

  const [includeSuggestions, setIncludeSuggestions] = useState(true);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SentimentResponse | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(`campaign_${campaignId}_sentiment`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.reports && parsed.reports.length > 0) {
          setResult(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [campaignId]);

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
          <label className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-black"}`}>
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
          <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-black"}`}>
            Provider (optional)
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-black"
            }`}
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
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
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
            <div className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-black"
            }`}>
              {Object.entries(result.summary).map(([k, v]) => (
                <span key={k} className={isDark ? "text-slate-400" : "text-slate-600"}>
                  {k.replace(/_/g, " ")}:{" "}
                  <span className={`font-bold ${isDark ? "text-white" : "text-black"}`}>
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
                    <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                      isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-800"
                    }`}>
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
                      <span className={`text-[10px] mt-1 font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Clarity
                      </span>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <ScoreRing
                        value={Math.round(r.overall_score)}
                        size={64}
                        strokeWidth={5}
                      />
                      <span className={`text-[10px] mt-1 font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Overall
                      </span>
                    </div>
                  </div>

                  {/* Body preview */}
                  <div>
                    <p className={`text-[11px] font-bold mb-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Preview
                    </p>
                    <p className={`text-xs line-clamp-3 leading-relaxed font-medium ${isDark ? "text-slate-200" : "text-black"}`}>
                      {r.body_preview}
                    </p>
                  </div>

                  {/* Tone suggestions */}
                  {r.tone_suggestions && r.tone_suggestions.length > 0 && (
                    <div>
                      <p className={`text-[11px] font-bold mb-1.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Suggestions
                      </p>
                      <ul className="space-y-1">
                        {r.tone_suggestions.map((s, idx) => (
                          <li
                            key={idx}
                            className={`text-xs flex gap-1.5 font-medium ${isDark ? "text-slate-300" : "text-black"}`}
                          >
                            <span className="text-indigo-500 font-bold shrink-0">•</span>
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
