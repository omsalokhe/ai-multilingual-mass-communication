import { useState } from "react";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { qualityCheck } from "../../lib/api";
import type { QualityCheckResponse, QualityReport } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import ScoreRing from "../../components/ScoreRing";
import LanguageComparison from "../../components/LanguageComparison";
import { useToast } from "../../components/Toast";

interface Props {
  campaignId: number;
  onComplete: () => void;
}

const PROVIDERS = ["default", "gemini", "groq"];

function QualityRow({
  label,
  ok,
  issues,
}: {
  label: string;
  ok: boolean;
  issues: unknown[];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasIssues = issues && issues.length > 0;

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => hasIssues && setExpanded(!expanded)}
        className={`flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm ${
          hasIssues ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
        }`}
      >
        {ok ? (
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
        ) : (
          <XCircle size={16} className="text-red-500 shrink-0" />
        )}
        <span className="text-slate-700 font-medium flex-1">{label}</span>
        {hasIssues && (
          <>
            <span className="text-xs text-slate-400">
              {issues.length} issue{issues.length !== 1 ? "s" : ""}
            </span>
            {expanded ? (
              <ChevronUp size={14} className="text-slate-400" />
            ) : (
              <ChevronDown size={14} className="text-slate-400" />
            )}
          </>
        )}
      </button>
      {expanded && hasIssues && (
        <div className="px-3 pb-3">
          <div className="rounded-lg bg-red-50 border border-red-100 p-3 space-y-2">
            {issues.map((issue, idx) => (
              <div key={idx} className="text-xs text-red-700">
                {typeof issue === "object" && issue !== null
                  ? JSON.stringify(issue, null, 2)
                  : String(issue)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: QualityReport }) {
  return (
    <div className="space-y-4">
      {/* Overall score + status */}
      <div className="flex items-center gap-4">
        <div className="relative flex flex-col items-center">
          <ScoreRing
            value={Math.round(report.overall_score)}
            size={80}
            strokeWidth={6}
          />
          <span className="text-[10px] text-slate-400 mt-1">Overall</span>
        </div>
        <div className="flex-1">
          <StatusBadge
            status={report.status}
            className="text-sm px-3 py-1"
          />
        </div>
      </div>

      {/* Quality rows */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <QualityRow
          label="Grammar"
          ok={report.grammar_ok}
          issues={report.grammar_issues}
        />
        <QualityRow
          label="Compliance"
          ok={report.compliance_ok}
          issues={report.compliance_violations}
        />
        <QualityRow
          label="Factual Accuracy"
          ok={report.factual_ok}
          issues={report.factual_issues}
        />
      </div>

      {/* Body preview */}
      <div>
        <p className="text-[11px] font-medium text-slate-400 mb-0.5">
          Preview
        </p>
        <p className="text-xs text-slate-600 line-clamp-3">
          {report.body_preview}
        </p>
      </div>
    </div>
  );
}

export default function StepQuality({ campaignId, onComplete }: Props) {
  const { toast } = useToast();
  const [includeFactual, setIncludeFactual] = useState(true);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QualityCheckResponse | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await qualityCheck(campaignId, {
        include_factual_check: includeFactual,
        ...(provider ? { provider } : {}),
      });
      setResult(res);
      toast("success", `Quality checked ${res.total_checked} content(s)`);
      onComplete();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Quality check failed";
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
            Include Factual Check
          </label>
          <button
            onClick={() => setIncludeFactual(!includeFactual)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              includeFactual ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                includeFactual ? "translate-x-5" : "translate-x-0"
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
        onClick={handleCheck}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShieldCheck size={16} />
        )}
        {loading ? "Checking…" : "Run Quality Check"}
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
              children: <ReportCard report={r} />,
            }))}
          />
        </div>
      )}
    </div>
  );
}
