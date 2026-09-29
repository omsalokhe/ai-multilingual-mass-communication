import { useState, useEffect } from "react";
import { UserCheck, Loader2, Plus, Trash2 } from "lucide-react";
import { personalizeContent } from "../../lib/api";
import type { PersonalizeResponse } from "../../types";
import LanguageComparison from "../../components/LanguageComparison";
import { useToast } from "../../components/Toast";
import { useAppSettings } from "../../context/AppSettingsContext";

interface Props {
  campaignId: number;
  audiences: string[];
  onComplete: () => void;
}

export default function StepPersonalize({
  campaignId,
  audiences,
  onComplete,
}: Props) {
  const { toast } = useToast();
  const { generalSettings } = useAppSettings();
  const isDark = generalSettings.darkMode;

  const [segmentId, setSegmentId] = useState<string>("");
  const [customVars, setCustomVars] = useState<{ key: string; value: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PersonalizeResponse | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(`campaign_${campaignId}_personalized`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.contents_personalized && parsed.contents_personalized.length > 0) {
          setResult(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [campaignId]);

  const addVar = () => setCustomVars((v) => [...v, { key: "", value: "" }]);
  const removeVar = (i: number) =>
    setCustomVars((v) => v.filter((_, idx) => idx !== i));
  const updateVar = (i: number, field: "key" | "value", val: string) =>
    setCustomVars((v) =>
      v.map((item, idx) => (idx === i ? { ...item, [field]: val } : item))
    );

  const handlePersonalize = async () => {
    setLoading(true);
    try {
      const variables: Record<string, string> = {};
      for (const v of customVars) {
        if (v.key.trim()) variables[v.key.trim()] = v.value;
      }
      const res = await personalizeContent(campaignId, {
        ...(segmentId ? { segment_id: Number(segmentId) } : {}),
        ...(Object.keys(variables).length > 0
          ? { custom_variables: variables }
          : {}),
      });
      setResult(res);
      toast("success", `Personalized ${res.total_updated} content(s)`);
      onComplete();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Personalization failed";
      toast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Audience Segment
          </label>
          <select
            value={segmentId}
            onChange={(e) => setSegmentId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            <option value="">Default (first segment)</option>
            {audiences.map((a, i) => (
              <option key={a} value={i + 1}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Variables */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs font-medium text-slate-500">
            Custom Variables (optional)
          </label>
          <button
            onClick={addVar}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        {customVars.length > 0 && (
          <div className="space-y-2">
            {customVars.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  placeholder="Key"
                  value={v.key}
                  onChange={(e) => updateVar(i, "key", e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
                <input
                  placeholder="Value"
                  value={v.value}
                  onChange={(e) => updateVar(i, "value", e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
                <button
                  onClick={() => removeVar(i)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handlePersonalize}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <UserCheck size={16} />
        )}
        {loading ? "Personalizing…" : "Personalize"}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary strip */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
            <span className="text-slate-500">
              Segment:{" "}
              <span className="font-medium text-slate-700">
                {result.segment_name}
              </span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Recipients Analyzed:{" "}
              <span className="font-medium text-slate-700">
                {result.recipients_analyzed}
              </span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Contents Updated:{" "}
              <span className="font-medium text-slate-700">
                {result.total_updated}
              </span>
            </span>
          </div>

          {/* Per-language cards */}
          <LanguageComparison
            items={result.contents_personalized.map((c) => ({
              language:
                c.language_code === "en"
                  ? "English"
                  : c.language_code === "hi"
                    ? "Hindi"
                    : c.language_code === "kn"
                      ? "Kannada"
                      : c.language_code === "ta"
                        ? "Tamil"
                        : c.language_code === "te"
                          ? "Telugu"
                          : c.language_code === "mr"
                            ? "Marathi"
                            : c.language_code,
              languageCode: c.language_code,
              children: (
                <div className="space-y-3">
                  {c.subject && (
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 mb-0.5">
                        Subject
                      </p>
                      <p className="text-sm text-slate-700 font-medium">
                        {c.subject}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 mb-0.5">
                      Personalized Body
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {c.body}
                    </p>
                  </div>
                  {/* Variables applied chips */}
                  {c.variables_applied &&
                    Object.keys(c.variables_applied).length > 0 && (
                      <div>
                        <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                          Variables Applied
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(c.variables_applied).map(
                            ([k, v]) => (
                              <span
                                key={k}
                                className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200"
                              >
                                {k}: {v}
                              </span>
                            )
                          )}
                        </div>
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
