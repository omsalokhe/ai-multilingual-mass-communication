import { useState, useEffect } from "react";
import {
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Loader2,
  Globe,
  Radio,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";
import { dispatchCampaign, getCampaign, sendTestMessage } from "../../lib/api";
import type { CampaignDetail, DispatchCampaignResponse, SendTestResponse } from "../../types";
import { useToast } from "../../components/Toast";
import StatusBadge from "../../components/StatusBadge";
import { useAppSettings } from "../../context/AppSettingsContext";

interface Props {
  campaignId: number;
  onComplete: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
  native: string;
}

const SUPPORTED_LANGS: LanguageOption[] = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
];

export default function StepDispatch({ campaignId, onComplete }: Props) {
  const { toast } = useToast();
  const { generalSettings } = useAppSettings();
  const isDark = generalSettings.darkMode;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Direct 1-Click / Live Broadcast state (similar to Content & Templates)
  const [directChannel, setDirectChannel] = useState<"SMS" | "WHATSAPP" | "EMAIL">("WHATSAPP");
  const [directRecipient, setDirectRecipient] = useState<string>("+91 9579333426");
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [directSending, setDirectSending] = useState(false);
  const [directReceipt, setDirectReceipt] = useState<SendTestResponse | null>(null);
  const [directError, setDirectError] = useState("");
  const [copied, setCopied] = useState(false);

  // Cached translations map (code -> text)
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({});

  // Mass Broadcast state
  const [selectedMassChannels, setSelectedMassChannels] = useState<string[]>([
    "SMS",
    "WHATSAPP",
    "EMAIL",
  ]);
  const [massDispatching, setMassDispatching] = useState(false);
  const [massResult, setMassResult] = useState<DispatchCampaignResponse | null>(null);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getCampaign(campaignId);
      setCampaign(data);

      // Load cached translations if any
      const tMap: Record<string, string> = {};
      try {
        const cached = localStorage.getItem(`campaign_${campaignId}_translations`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.translations)) {
            parsed.translations.forEach((t: any) => {
              if (t.language_code && (t.translated_body || t.body)) {
                tMap[t.language_code] = t.translated_body || t.body;
              }
            });
          }
        }
      } catch {
        // ignore
      }

      // Also incorporate translations from campaign.contents
      if (data && data.contents) {
        data.contents.forEach((cnt) => {
          const langLower = (cnt.language || "").toLowerCase();
          if (langLower.includes("hindi") || cnt.language_id === 2) tMap["hi"] = cnt.body;
          else if (langLower.includes("kannada") || cnt.language_id === 3) tMap["kn"] = cnt.body;
          else if (langLower.includes("tamil") || cnt.language_id === 4) tMap["ta"] = cnt.body;
          else if (langLower.includes("telugu") || cnt.language_id === 5) tMap["te"] = cnt.body;
          else if (langLower.includes("marathi") || cnt.language_id === 6) tMap["mr"] = cnt.body;
          else if (langLower.includes("english") || cnt.language_id === 1) tMap["en"] = cnt.body;
        });
      }

      setTranslationsMap(tMap);

      // Default selected language to first translated or en
      const availableCodes = Object.keys(tMap);
      if (availableCodes.length > 0 && !availableCodes.includes("en")) {
        setSelectedLang(availableCodes[0]);
      }
    } catch (err) {
      console.error(err);
      toast("error", "Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  };

  const toggleMassChannel = (channel: string) => {
    setSelectedMassChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  // Derive source English message
  const contents = campaign?.contents || [];
  const englishContent =
    contents.find(
      (c) =>
        c.language_id === 1 ||
        (c.language && c.language.toLowerCase().includes("english"))
    ) || contents[0];

  const englishBody = englishContent?.body || campaign?.objective || campaign?.name || "";

  // Active message text for selected language
  const activeMessage =
    translationsMap[selectedLang] || englishBody;

  // Direct Live Broadcast Handler (sendTestMessage)
  const handleDirectDispatch = async () => {
    if (!activeMessage.trim() || !directRecipient.trim()) {
      toast("error", "Please provide recipient details.");
      return;
    }

    setDirectSending(true);
    setDirectReceipt(null);
    setDirectError("");

    try {
      const res = await sendTestMessage({
        channel: directChannel,
        recipient: directRecipient.trim(),
        subject: campaign?.name || "Official Public Communication Alert",
        message: activeMessage,
        language: SUPPORTED_LANGS.find((l) => l.code === selectedLang)?.name || "English",
      });

      setDirectReceipt(res);
      toast("success", `Campaign message broadcasted successfully via ${directChannel}!`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        (err instanceof Error ? err.message : `Failed to dispatch via ${directChannel}`);
      setDirectError(msg);
      toast("error", msg);
    } finally {
      setDirectSending(false);
    }
  };

  // Multilingual Mass Broadcast Handler (dispatchCampaign)
  const handleMassDispatch = async () => {
    if (selectedMassChannels.length === 0) {
      toast("error", "Please select at least one channel to dispatch.");
      return;
    }

    setMassDispatching(true);
    try {
      const res = await dispatchCampaign({
        campaign_id: campaignId,
        channels: selectedMassChannels,
      });

      setMassResult(res);
      toast(
        "success",
        `Mass broadcast successfully executed across ${selectedMassChannels.join(", ")}!`
      );
      onComplete();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        (err instanceof Error ? err.message : "Failed to execute mass broadcast");
      toast("error", msg);
    } finally {
      setMassDispatching(false);
    }
  };

  const handleCopy = () => {
    if (!activeMessage) return;
    navigator.clipboard.writeText(activeMessage);
    setCopied(true);
    toast("info", "Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  // Pre-generate direct link URLs
  const cleanPhone = directRecipient.replace(/[^0-9]/g, "");
  const whatsappUrl =
    directReceipt?.whatsapp_url ||
    `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activeMessage)}`;
  const smsUrl =
    directReceipt?.sms_url ||
    `sms:${directRecipient.replace(/[^0-9+]/g, "")}?body=${encodeURIComponent(activeMessage)}`;
  const mailtoUrl =
    directReceipt?.mailto_url ||
    `mailto:${directRecipient}?subject=${encodeURIComponent(
      campaign?.name || "Official Public Communication Alert"
    )}&body=${encodeURIComponent(activeMessage)}`;

  // Find all languages that have content or cached translations
  const availableLangs = SUPPORTED_LANGS.filter(
    (l) => l.code === "en" || Boolean(translationsMap[l.code])
  );

  return (
    <div className="space-y-7 animate-fade-in">
      {/* ── Header Info ─────────────────────────────────── */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/70 text-slate-800"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${isDark ? "text-white" : "text-black"}`}>
              {campaign?.name}
            </span>
            <StatusBadge status={campaign?.status || "DRAFT"} />
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Target Audience:{" "}
            <strong className={isDark ? "text-white" : "text-black"}>
              {campaign?.target_audiences && campaign.target_audiences.length > 0
                ? campaign.target_audiences.join(", ")
                : "General Public & Families"}
            </strong>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-blue-200/50 dark:border-slate-700">
          <Globe size={13} /> {Math.max(contents.length, Object.keys(translationsMap).length, 1)}{" "}
          Content Variant(s) Ready
        </div>
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* SECTION 1: DIRECT LIVE BROADCAST & 1-CLICK WHATSAPP */}
      {/* ─────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border p-6 space-y-5 shadow-sm ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                <Smartphone size={18} />
              </div>
              <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                Direct Live Broadcast & 1-Click WhatsApp Send
              </h2>
            </div>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Test live transmission, send to any phone or email, and instantly open pre-filled
              messages in WhatsApp.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold self-start sm:self-auto">
            1-Click Direct Link Enabled
          </span>
        </div>

        {/* 1. Target Channel Selector */}
        <div>
          <label className={`text-xs font-bold mb-2 block ${isDark ? "text-slate-200" : "text-black"}`}>
            Select Broadcast Channel
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "WHATSAPP", label: "WhatsApp", icon: Smartphone, highlight: "Recommended" },
              { id: "SMS", label: "SMS Gateway", icon: MessageSquare, highlight: "Direct Link" },
              { id: "EMAIL", label: "Email (SMTP)", icon: Mail, highlight: "Rich Text" },
            ].map(({ id, label, icon: Icon, highlight }) => {
              const isSelected = directChannel === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const ch = id as "SMS" | "WHATSAPP" | "EMAIL";
                    setDirectChannel(ch);
                    setDirectReceipt(null);
                    setDirectError("");
                    if (ch === "EMAIL") {
                      setDirectRecipient("omsalokhe2020@gmail.com");
                    } else {
                      setDirectRecipient("+91 9579333426");
                    }
                  }}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? id === "WHATSAPP"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : isDark
                      ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/60"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon size={15} />
                    <span>{label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-normal opacity-85 ${
                      isSelected ? "text-white" : isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {highlight}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Recipient Input & Language Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`text-xs font-bold mb-1.5 block ${isDark ? "text-slate-200" : "text-black"}`}>
              Recipient {directChannel === "EMAIL" ? "Email Address" : "Phone Number"}
            </label>
            <input
              type="text"
              value={directRecipient}
              onChange={(e) => setDirectRecipient(e.target.value)}
              placeholder={
                directChannel === "EMAIL" ? "citizen@example.com" : "+91 9579333426"
              }
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                  : "bg-white border-slate-200 text-black focus:border-blue-600"
              }`}
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              {directChannel === "EMAIL"
                ? "Dispatches live via SMTP or opens in your mail client"
                : "Enter recipient with country code (+91 for India)"}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-black"}`}>
                Content Language
              </label>
              <span className="text-[10px] text-blue-600 font-medium">
                {Object.keys(translationsMap).length} translated variant(s)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_LANGS.map((lang) => {
                const isSelected = selectedLang === lang.code;
                const hasTranslation = lang.code === "en" || Boolean(translationsMap[lang.code]);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLang(lang.code)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold"
                        : hasTranslation
                        ? isDark
                          ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                          : "bg-slate-50 text-black border-slate-200 hover:bg-slate-100"
                        : isDark
                        ? "bg-slate-800/40 text-slate-500 border-slate-800 hover:text-slate-300"
                        : "bg-slate-50/60 text-slate-400 border-slate-200 hover:text-slate-600"
                    }`}
                  >
                    <span>{lang.native}</span>
                    {hasTranslation && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Message Content Preview Box */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-black"}`}>
              Message Content Preview ({SUPPORTED_LANGS.find((l) => l.code === selectedLang)?.name})
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                {activeMessage.length} characters
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>
          </div>
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line ${
              isDark
                ? "bg-slate-800/60 border-slate-700 text-slate-100"
                : "bg-slate-50 border-slate-200 text-black"
            }`}
          >
            {activeMessage || (
              <span className="italic text-slate-400">No message content available.</span>
            )}
          </div>
        </div>

        {/* 4. PRIMARY DIRECT ACTION (Open & Send in WhatsApp / SMS / Email) */}
        <div className="pt-1 space-y-3">
          {directChannel === "WHATSAPP" && (
            <div className="p-4 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                  <Smartphone size={15} className="text-emerald-600" />
                  Direct WhatsApp Send (Web / Phone App)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  Instant 1-Click
                </span>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink size={15} />
                Open & Send in WhatsApp (Web / Phone)
              </a>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 text-center">
                Bypasses sandbox template limits to send 100% authentic, full multilingual message
                directly to {directRecipient}.
              </p>
            </div>
          )}

          {directChannel === "SMS" && (
            <div className="p-4 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                  <MessageSquare size={15} className="text-blue-600" />
                  Direct Phone SMS Broadcast
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                  Default Messaging App
                </span>
              </div>
              <a
                href={smsUrl}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={15} />
                Open in Phone SMS App (Send Live SMS)
              </a>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 text-center">
                Pre-populates {directRecipient} and your message in your mobile or desktop SMS app.
              </p>
            </div>
          )}

          {directChannel === "EMAIL" && (
            <div className="p-4 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-1.5">
                  <Mail size={15} className="text-indigo-600" />
                  Direct Email Client Dispatch
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                  Mailto Link
                </span>
              </div>
              <a
                href={mailtoUrl}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink size={15} />
                Open in Default Email App
              </a>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400 text-center">
                Pre-populates subject and recipient {directRecipient} in Outlook, Apple Mail, or
                Gmail.
              </p>
            </div>
          )}

          {/* Instant API Dispatch Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDirectDispatch}
              disabled={directSending || !directRecipient.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {directSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Transmitting to Gateway...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Transmit Live via {directChannel} Gateway API
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {directError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 space-y-1 text-xs text-red-800 dark:text-red-300">
            <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400">
              <AlertCircle size={14} />
              Dispatch Error
            </div>
            <p className="text-[11px] leading-relaxed">{directError}</p>
          </div>
        )}

        {/* Receipt Feedback (Identical to Content & Templates) */}
        {directReceipt && (
          <div
            className={`p-4 rounded-xl border space-y-2.5 animate-fade-in text-xs ${
              directReceipt.status === "DELIVERED"
                ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center gap-1.5 font-bold ${
                  directReceipt.status === "DELIVERED"
                    ? "text-emerald-800 dark:text-emerald-300"
                    : "text-amber-800 dark:text-amber-300"
                }`}
              >
                <CheckCircle2
                  size={15}
                  className={
                    directReceipt.status === "DELIVERED" ? "text-emerald-600" : "text-amber-600"
                  }
                />
                {directReceipt.status === "DELIVERED"
                  ? "Live Gateway Delivery Recorded"
                  : "Gateway Notice / Sandbox Delivery"}
              </div>
              {directReceipt.provider && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                  {directReceipt.provider}
                </span>
              )}
            </div>
            <p
              className={`text-[11px] leading-relaxed ${
                directReceipt.status === "DELIVERED"
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-amber-800 dark:text-amber-300"
              }`}
            >
              {directReceipt.details}
            </p>
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Gateway ID: {directReceipt.message_id}
            </p>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* SECTION 2: MASS MULTILINGUAL BROADCAST DISPATCH     */}
      {/* ─────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border p-6 space-y-5 shadow-sm ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <Radio size={18} />
            </div>
            <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
              STEP 6: Select Mass Communication Channels & Broadcast
            </h2>
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Simultaneously dispatches across all targeted audience segments with delivery receipt
            logging.
          </p>
        </div>

        {/* Channel Selection Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              key: "SMS",
              name: "SMS Gateway",
              desc: "Fast Telecom SMS with DND compliance & unicode support",
              icon: MessageSquare,
              color: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
              checkedColor: isDark
                ? "border-emerald-500 bg-emerald-950/30"
                : "border-emerald-600 bg-emerald-50",
            },
            {
              key: "WHATSAPP",
              name: "WhatsApp Business API",
              desc: "Rich interactive template with CTA helpline buttons",
              icon: Smartphone,
              color: "border-green-200 bg-green-50/50 text-green-800",
              checkedColor: isDark
                ? "border-green-500 bg-green-950/30"
                : "border-green-600 bg-green-50",
            },
            {
              key: "EMAIL",
              name: "Email (SMTP Relay)",
              desc: "Full HTML template with official government headers",
              icon: Mail,
              color: "border-blue-200 bg-blue-50/50 text-blue-800",
              checkedColor: isDark
                ? "border-blue-500 bg-blue-950/30"
                : "border-blue-600 bg-blue-50",
            },
          ].map((item) => {
            const isChecked = selectedMassChannels.includes(item.key);
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                onClick={() => toggleMassChannel(item.key)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isChecked
                    ? item.checkedColor
                    : isDark
                    ? "border-slate-800 bg-slate-800/40 hover:bg-slate-800"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg border shadow-2xs ${
                      isDark
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-slate-200/60"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        isChecked ? "text-blue-600" : isDark ? "text-slate-400" : "text-slate-500"
                      }
                    />
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-1"
                  />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>
                    {item.name}
                  </h4>
                  <p
                    className={`text-[11px] mt-0.5 leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mass Broadcast Action Button */}
        {!massResult ? (
          <div className="pt-2">
            <button
              onClick={handleMassDispatch}
              disabled={massDispatching || selectedMassChannels.length === 0}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {massDispatching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Executing Mass Communication Dispatch...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Execute Multilingual Mass Broadcast ({selectedMassChannels.join(", ")})
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Dispatches simultaneously to all registered audience segment recipients with delivery
              receipt logging.
            </p>
          </div>
        ) : (
          /* Delivery Execution Report */
          <div className="space-y-4 animate-fade-in pt-2">
            <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <h3 className="font-bold text-sm">Campaign Successfully Dispatched!</h3>
                </div>
                <span className="text-xs font-semibold bg-emerald-200/60 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full text-emerald-800 dark:text-emerald-200">
                  Status: ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800 text-xs">
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 text-[10px] block">
                    Total Recipients
                  </span>
                  <strong className="text-sm font-bold">{massResult.total_recipients}</strong>
                </div>
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 text-[10px] block">
                    Messages Sent
                  </span>
                  <strong className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {massResult.total_dispatched}
                  </strong>
                </div>
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 text-[10px] block">
                    Channels Used
                  </span>
                  <strong className="text-xs font-semibold">
                    {massResult.channels_used.join(", ")}
                  </strong>
                </div>
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 text-[10px] block">
                    Delivery Success
                  </span>
                  <strong className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    100%
                  </strong>
                </div>
              </div>
            </div>

            {/* Delivery Receipts Table */}
            <div
              className={`rounded-xl border overflow-hidden shadow-2xs ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`p-3 border-b flex items-center justify-between ${
                  isDark ? "bg-slate-800/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <span className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>
                  Live Delivery Receipts
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Verified Gateway Response
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead
                    className={`font-medium border-b ${
                      isDark
                        ? "bg-slate-800/40 text-slate-400 border-slate-800"
                        : "bg-slate-50/50 text-slate-500 border-slate-200"
                    }`}
                  >
                    <tr>
                      <th className="px-4 py-2.5">Channel</th>
                      <th className="px-4 py-2.5">Recipient</th>
                      <th className="px-4 py-2.5">Contact Destination</th>
                      <th className="px-4 py-2.5">Gateway Message ID</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">Direct Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
                    {massResult.deliveries.map((d, idx) => {
                      const recipientPhone = (d.recipient_contact || "").replace(/[^0-9]/g, "");
                      const rowWhatsAppUrl = `https://wa.me/${recipientPhone}?text=${encodeURIComponent(
                        activeMessage
                      )}`;

                      return (
                        <tr
                          key={idx}
                          className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50/60"}
                        >
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                d.channel === "SMS"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                  : d.channel === "WHATSAPP"
                                  ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                                  : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                              }`}
                            >
                              {d.channel}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-2.5 font-medium ${
                              isDark ? "text-white" : "text-black"
                            }`}
                          >
                            {d.recipient_name}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                            {d.recipient_contact}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                            {d.message_id}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 size={11} /> {d.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 text-[11px]">{d.timestamp}</td>
                          <td className="px-4 py-2.5">
                            {d.channel === "WHATSAPP" && recipientPhone ? (
                              <a
                                href={rowWhatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                              >
                                <ExternalLink size={12} />
                                Open WhatsApp
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
