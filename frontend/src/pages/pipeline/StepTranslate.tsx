import { useState } from "react";
import { Languages, Loader2, CheckCircle2 } from "lucide-react";
import { translateContent } from "../../lib/api";
import type { TranslateResponse, CampaignContent } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import LanguageComparison from "../../components/LanguageComparison";
import { useToast } from "../../components/Toast";
import { useAppSettings } from "../../context/AppSettingsContext";

interface Props {
  campaignId: number;
  existingContents?: CampaignContent[];
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

export default function StepTranslate({ campaignId, existingContents, onComplete }: Props) {
  const { toast } = useToast();
  const { generalSettings } = useAppSettings();
  const isDark = generalSettings.darkMode;

  const [selectedLangs, setSelectedLangs] = useState<string[]>(
    LANGUAGES.map((l) => l.code)
  );
  const [provider, setProvider] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateResponse | null>(null);

  // Existing translations in database
  const existingTranslations =
    existingContents?.filter(
      (c) => c.language !== "English" && c.language_id !== 1
    ) || [];

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
        <label className={`block text-xs font-bold mb-2 ${isDark ? "text-slate-300" : "text-black"}`}>
          Target Languages
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleAll}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
              selectedLangs.length === LANGUAGES.length
                ? "bg-indigo-600 border-indigo-600 text-white"
                : isDark
                ? "bg-slate-900 border-slate-700 text-slate-300"
                : "bg-white border-slate-300 text-black hover:bg-slate-50"
            }`}
          >
            Select All
          </button>
          {LANGUAGES.map((l) => (
            <label
              key={l.code}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                selectedLangs.includes(l.code)
                  ? "bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-600"
                  : isDark
                  ? "bg-slate-900 border-slate-700 text-slate-300"
                  : "bg-white border-slate-300 text-black hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedLangs.includes(l.code)}
                onChange={() => toggleLang(l.code)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              {l.label}
            </label>
          ))}
        </div>
      </div>

      {/* Provider dropdown */}
      <div className="max-w-xs">
        <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-black"}`}>
          Translation Provider
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className={`w-full px-3 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize ${
            isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-black"
          }`}
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p === "indictrans2"
                ? "IndicTrans2 (AI4Bharat)"
                : p === "bhashini"
                  ? "Bhashini (National Mission)"
                  : p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Submit button */}
      <button
        onClick={handleTranslate}
        disabled={loading || selectedLangs.length === 0}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Languages size={16} />
        )}
        {loading ? "Translating Content…" : "Translate Content"}
      </button>

      {/* Results from current translation */}
      {result ? (
        <div className="space-y-4">
          <div className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
            isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-black"
          }`}>
            <span className="font-semibold">
              Source: <span className="font-bold">{result.source_language_code?.toUpperCase()}</span>
            </span>
            <span>|</span>
            <span className="font-semibold">
              Translated: <span className="font-bold">{result.total_translated} language(s)</span>
            </span>
            <span>|</span>
            <span className="font-semibold">
              Channel: <span className="font-bold">{result.channel}</span>
            </span>
          </div>

          <LanguageComparison
            items={result.translations.map((t) => ({
              language: t.language_name,
              languageCode: t.language_code,
              children: (
                <div className="space-y-3">
                  {t.subject && (
                    <div>
                      <p className={`text-[11px] font-bold mb-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Subject
                      </p>
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                        {t.subject}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className={`text-[11px] font-bold mb-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Body
                    </p>
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed font-medium ${isDark ? "text-slate-200" : "text-black"}`}>
                      {t.body}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>{t.character_count} chars</span>
                    <StatusBadge status={t.status} />
                    <span className="ml-auto text-indigo-600 font-bold">{t.provider_used}</span>
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      ) : existingTranslations.length > 0 ? (
        <div className="space-y-4">
          <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${
            isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className={`font-bold ${isDark ? "text-white" : "text-black"}`}>
                Current Translated Versions ({existingTranslations.length} Languages)
              </span>
            </div>
            <span className="text-xs text-emerald-600 font-bold">
              ✓ Ready for Personalization
            </span>
          </div>

          <LanguageComparison
            items={existingTranslations.map((t) => ({
              language: t.language,
              languageCode: t.language.substring(0, 2).toLowerCase(),
              children: (
                <div className="space-y-3">
                  {t.subject && (
                    <div>
                      <p className={`text-[11px] font-bold mb-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Subject
                      </p>
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                        {t.subject}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className={`text-[11px] font-bold mb-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Body
                    </p>
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed font-medium ${isDark ? "text-slate-200" : "text-black"}`}>
                      {t.body}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>{t.body.length} chars</span>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}
