import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Languages,
  UserCheck,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
} from "lucide-react";
import { getCampaign } from "../lib/api";
import type { CampaignDetail } from "../types";
import TopBar from "../components/TopBar";
import StatusBadge from "../components/StatusBadge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import StepGenerate from "./pipeline/StepGenerate";
import StepTranslate from "./pipeline/StepTranslate";
import StepPersonalize from "./pipeline/StepPersonalize";
import StepSentiment from "./pipeline/StepSentiment";
import StepQuality from "./pipeline/StepQuality";
import StepDispatch from "./pipeline/StepDispatch";
import { Send } from "lucide-react";

const STEPS = [
  { key: "generate", label: "Generate", icon: Sparkles },
  { key: "translate", label: "Translate", icon: Languages },
  { key: "personalize", label: "Personalize", icon: UserCheck },
  { key: "sentiment", label: "Sentiment", icon: Activity },
  { key: "quality", label: "Quality", icon: ShieldCheck },
  { key: "dispatch", label: "Dispatch / Send", icon: Send },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export default function CampaignPipeline() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<StepKey>("generate");
  const [completed, setCompleted] = useState<Set<StepKey>>(new Set());
  const [showFullObjective, setShowFullObjective] = useState(false);

  const fetchCampaign = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getCampaign(Number(id));
      setCampaign(data);
      // If content already exists, enable later steps
      const completedSteps = new Set<StepKey>();
      if (data.contents && data.contents.length > 0) {
        completedSteps.add("generate");
        if (data.contents.some((c) => c.language !== "English" && c.language_id !== 1)) {
          completedSteps.add("translate");
        }
      }

      // Check cached pipeline completions
      try {
        if (localStorage.getItem(`campaign_${id}_translations`)) {
          completedSteps.add("generate");
          completedSteps.add("translate");
        }
        if (localStorage.getItem(`campaign_${id}_personalized`)) {
          completedSteps.add("personalize");
        }
        if (localStorage.getItem(`campaign_${id}_sentiment`)) {
          completedSteps.add("sentiment");
        }
        if (localStorage.getItem(`campaign_${id}_quality`)) {
          completedSteps.add("quality");
        }
      } catch {
        // ignore
      }
      setCompleted(completedSteps);
    } catch (err) {
      toast("error", "Failed to load campaign");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const hasContent = campaign && campaign.contents && campaign.contents.length > 0;
  const contentExists = hasContent || completed.has("generate");

  const markComplete = (step: StepKey) => {
    setCompleted((prev) => new Set([...prev, step]));
    // Re-fetch to get updated contents
    fetchCampaign();
  };

  const isStepEnabled = (stepKey: StepKey) => {
    if (stepKey === "generate") return true;
    return contentExists;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Loading…"
          crumbs={[
            { label: "Dashboard", to: "/" },
            { label: "Campaign" },
          ]}
        />
        <div className="p-6 md:p-8 overflow-y-auto">
          <LoadingSkeleton type="detail" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Not Found"
          crumbs={[
            { label: "Dashboard", to: "/" },
            { label: "Campaign" },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 mb-4">Campaign not found</p>
            <button
              onClick={() => navigate("/")}
              className="text-indigo-600 text-sm hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        title={campaign.name}
        crumbs={[
          { label: "Dashboard", to: "/" },
          { label: campaign.campaign_code },
        ]}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to campaigns
        </button>

        {/* ── Campaign Header ───────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-slate-800">
                  {campaign.name}
                </h2>
                <StatusBadge status={campaign.status} />
                <StatusBadge status={campaign.priority} />
              </div>
              <p className="text-xs text-slate-400 font-mono mb-3">
                {campaign.campaign_code}
                {campaign.campaign_type && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-slate-500">
                      {campaign.campaign_type}
                    </span>
                  </>
                )}
              </p>

              {/* Objective */}
              {campaign.objective && (
                <div className="mb-3">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {showFullObjective || campaign.objective.length <= 150
                      ? campaign.objective
                      : `${campaign.objective.slice(0, 150)}…`}
                  </p>
                  {campaign.objective.length > 150 && (
                    <button
                      onClick={() =>
                        setShowFullObjective(!showFullObjective)
                      }
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mt-1 font-medium"
                    >
                      {showFullObjective ? (
                        <>
                          <ChevronUp size={12} /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} /> Show more
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Audiences */}
              {campaign.target_audiences.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {campaign.target_audiences.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"
                    >
                      <Users size={10} className="text-slate-400" />
                      {a}
                    </span>
                  ))}
                </div>
              )}

              {/* Primary Content Preview if present */}
              {hasContent && campaign.contents[0] && (
                <div className="mt-3.5 p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <FileText size={14} className="text-blue-600" />
                      Active Campaign Message (English Source)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Channel: {campaign.contents[0].channel}
                    </span>
                  </div>
                  {campaign.contents[0].subject && (
                    <p className="text-xs font-bold text-slate-800 dark:text-white mb-1">
                      {campaign.contents[0].subject}
                    </p>
                  )}
                  <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed font-medium">
                    {campaign.contents[0].body}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stepper ───────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Step tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {STEPS.map((step, i) => {
              const enabled = isStepEnabled(step.key);
              const isActive = activeStep === step.key;
              const isDone = completed.has(step.key);
              const Icon = step.icon;

              return (
                <button
                  key={step.key}
                  onClick={() => enabled && setActiveStep(step.key)}
                  disabled={!enabled}
                  title={
                    !enabled
                      ? "Run Step 1 first to generate content"
                      : undefined
                  }
                  className={`
                    relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors
                    ${
                      isActive
                        ? "text-indigo-700 bg-indigo-50/50"
                        : enabled
                          ? "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                          : "text-slate-300 cursor-not-allowed"
                    }
                  `}
                >
                  {/* Step number / check */}
                  {isDone ? (
                    <CheckCircle2
                      size={18}
                      className="text-emerald-500 shrink-0"
                    />
                  ) : !enabled ? (
                    <Lock size={14} className="text-slate-300 shrink-0" />
                  ) : (
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? "text-indigo-600"
                        : enabled
                          ? "text-slate-400"
                          : "text-slate-300"
                    }
                  />
                  <span className="hidden sm:inline">{step.label}</span>

                  {/* Active underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Step content */}
          <div className="p-5 md:p-6">
            {activeStep === "generate" && (
              <StepGenerate
                campaignId={campaign.id}
                existingContents={campaign.contents}
                campaignObjective={campaign.objective}
                onComplete={() => markComplete("generate")}
              />
            )}
            {activeStep === "translate" && (
              <StepTranslate
                campaignId={campaign.id}
                existingContents={campaign.contents}
                onComplete={() => markComplete("translate")}
              />
            )}
            {activeStep === "personalize" && (
              <StepPersonalize
                campaignId={campaign.id}
                audiences={campaign.target_audiences}
                onComplete={() => markComplete("personalize")}
              />
            )}
            {activeStep === "sentiment" && (
              <StepSentiment
                campaignId={campaign.id}
                onComplete={() => markComplete("sentiment")}
              />
            )}
            {activeStep === "quality" && (
              <StepQuality
                campaignId={campaign.id}
                onComplete={() => {
                  markComplete("quality");
                  setActiveStep("dispatch");
                }}
              />
            )}
            {activeStep === "dispatch" && (
              <StepDispatch
                campaignId={campaign.id}
                onComplete={() => markComplete("dispatch")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
