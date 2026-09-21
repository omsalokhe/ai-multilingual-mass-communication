import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { translateContent } from "../../lib/api";
import type { TranslateResponse } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import LanguageComparison from "../../components/LanguageComparison";
import { useToast } from "../../components/Toast";

interface Props {
  campaignId: number;
  onComplete: () => void;
}

const LANGUAGES = [
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "mr", label: "मराठी (Marathi)" },
];

const PROVIDERS = ["auto", "bhashini", "indictrans2", "gemini", "groq"];

export default function StepTranslate({ campaignId, onComplete }: Props) {
  const { toast } = useToast();
  const [selectedLangs, setSelectedLangs] = useState<string[]>(
    LANGUAGES.map((l) => l.code)
  );
  const [provider, setProvider] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateResponse | null>(null);

  const toggleLang = (code: string) => {
    setSelectedLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleAll = () => {
    if (selectedLangs.length === LANGUAGES.length) {
      setSelectedLangs([]);
    } else {
      setSelectedLangs(LANGUAGES.map((l) => l.code));
    }
  };

  const handleTranslate = async () => {
    if (selectedLangs.length === 0) {
      toast("error", "Select at least one target language");
      return;
    }
    setLoading(true);
    try {
      const res = await translateContent(campaignId, {
        target_language_codes: selectedLangs,
        provider,
      });
      setResult(res);
      toast("success", `Translated to ${res.total_translated} language(s)`);
      onComplete();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Translation failed";
      toast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Language checkboxes */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">
          Target Languages
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleAll}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              selectedLangs.length === LANGUAGES.length
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Select All
          </button>
          {LANGUAGES.map((l) => (
            <label
              key={l.code}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                selectedLangs.includes(l.code)
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedLangs.includes(l.code)}
                onChange={() => toggleLang(l.code)}
                className="sr-only"
              />
              {l.label}
            </label>
          ))}
        </div>
      </div>

      {/* Provider */}
      <div className="max-w-xs">
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          Translation Provider
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleTranslate}
        disabled={loading || selectedLangs.length === 0}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Languages size={16} />
        )}
        {loading ? "Translating…" : "Translate"}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary strip */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
            <span className="text-slate-500">
              Source:{" "}
              <span className="font-medium text-slate-700">
                {result.source_language_code?.toUpperCase()}
              </span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Translated:{" "}
              <span className="font-medium text-slate-700">
                {result.total_translated} language(s)
              </span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Channel:{" "}
              <span className="font-medium text-slate-700">
                {result.channel}
              </span>
            </span>
          </div>

          {/* Side-by-side cards */}
          <LanguageComparison
            items={result.translations.map((t) => ({
              language: t.language_name,
              languageCode: t.language_code,
              children: (
                <div className="space-y-3">
                  {t.subject && (
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 mb-0.5">
                        Subject
                      </p>
                      <p className="text-sm text-slate-700 font-medium">
                        {t.subject}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 mb-0.5">
                      Body
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {t.body}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <span>{t.character_count} chars</span>
                    <StatusBadge status={t.status} />
                    <span className="ml-auto">{t.provider_used}</span>
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      )}
    </div>
  );
}
