import { useState, useEffect } from "react";
import {
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  Globe,
  Share2,
  Settings,
  Info,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import TopBar from "../components/TopBar";
import { useToast } from "../components/Toast";
import { useAppSettings } from "../context/AppSettingsContext";
import { getChannelStatus, getDispatchHistory, sendTestMessage } from "../lib/api";
import type { DispatchHistoryItem, SendTestResponse } from "../types";

interface ChannelCard {
  id: number;
  channelKey: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "WEB" | "SOCIAL";
  name: string;
  icon: React.ReactNode;
  status: "Connected" | "Disconnected";
  subscribers?: string;
  description: string;
  protocol: string;
  color: string;
  borderColor: string;
  badgeColor: string;
}

const INITIAL_CHANNELS: ChannelCard[] = [
  {
    id: 1,
    channelKey: "EMAIL",
    name: "Email (SMTP Relay)",
    icon: <Mail size={22} className="text-blue-600" />,
    status: "Connected",
    subscribers: "Active (TLS 1.3)",
    description: "Enterprise SMTP server for transactional, multilingual & alert communications.",
    protocol: "SMTP / TLS",
    color: "bg-blue-50/60",
    borderColor: "border-blue-200/80",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: 2,
    channelKey: "SMS",
    name: "SMS Gateway (Telecom)",
    icon: <MessageSquare size={22} className="text-emerald-600" />,
    status: "Connected",
    subscribers: "DND Compliant",
    description: "High-throughput DND-compliant telecom gateway with unicode Indic script support.",
    protocol: "HTTP / SMPP",
    color: "bg-emerald-50/60",
    borderColor: "border-emerald-200/80",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    id: 3,
    channelKey: "WHATSAPP",
    name: "WhatsApp Business API",
    icon: <Smartphone size={22} className="text-green-600" />,
    status: "Connected",
    subscribers: "Meta Cloud API",
    description: "Official Meta WhatsApp Business Cloud API with rich interactive templates & delivery receipts.",
    protocol: "Meta Graph API v20.0",
    color: "bg-green-50/60",
    borderColor: "border-green-200/80",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    id: 4,
    channelKey: "PUSH",
    name: "Push Notifications",
    icon: <Bell size={22} className="text-amber-600" />,
    status: "Connected",
    subscribers: "WebPush & FCM",
    description: "Browser and mobile push notification delivery with badge and sound payload support.",
    protocol: "WebPush / VAPID",
    color: "bg-amber-50/60",
    borderColor: "border-amber-200/80",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    id: 5,
    channelKey: "WEB",
    name: "Web Broadcast Banner",
    icon: <Globe size={22} className="text-indigo-600" />,
    status: "Connected",
    subscribers: "Active Portal",
    description: "Public portal overlays, alert banners, and citizen notification ticker widgets.",
    protocol: "WebSocket / CDN",
    color: "bg-indigo-50/60",
    borderColor: "border-indigo-200/80",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
  {
    id: 6,
    channelKey: "SOCIAL",
    name: "Social Media Broadcast",
    icon: <Share2 size={22} className="text-pink-600" />,
    status: "Connected",
    subscribers: "API Connected",
    description: "Broadcast simultaneously to official Twitter/X and Facebook district pages.",
    protocol: "OAuth 2.0 Webhooks",
    color: "bg-pink-50/60",
    borderColor: "border-pink-200/80",
    badgeColor: "bg-pink-100 text-pink-700",
  },
];

export default function Channels() {
  const { toast } = useToast();
  const { generalSettings } = useAppSettings();

  const [channels, setChannels] = useState<ChannelCard[]>(INITIAL_CHANNELS);
  const [history, setHistory] = useState<DispatchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dispatchedCount, setDispatchedCount] = useState<number>(0);

  // Test send modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [targetChannel, setTargetChannel] = useState<"EMAIL" | "SMS" | "WHATSAPP">("SMS");
  const [recipient, setRecipient] = useState("+91 9876543210");
  const [subject, setSubject] = useState("Public Advisory Alert");
  const [message, setMessage] = useState(
    "Urgent Public Advisory: Heavy rainfall alert issued for district areas. Please stay indoors and call helpline 1070 for assistance."
  );
  const [language, setLanguage] = useState(generalSettings.defaultLanguage);
  const [sending, setSending] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<SendTestResponse | null>(null);

  useEffect(() => {
    setLanguage(generalSettings.defaultLanguage);
  }, [generalSettings.defaultLanguage]);

  useEffect(() => {
    fetchChannelData();
  }, []);

  const fetchChannelData = async () => {
    setLoadingHistory(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        getChannelStatus().catch(() => null),
        getDispatchHistory(20).catch(() => []),
      ]);

      if (statusRes) {
        setDispatchedCount(statusRes.total_dispatched);
      }
      if (historyRes) {
        setHistory(historyRes);
      }
    } catch (err) {
      console.error("Error loading channels", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenTest = (ch: "EMAIL" | "SMS" | "WHATSAPP") => {
    setTargetChannel(ch);
    setLastReceipt(null);
    if (ch === "EMAIL") {
      setRecipient("citizen.alerts@domain.org");
      setSubject("Official Health Advisory - Vector Control");
      setMessage(
        "Dear Citizen,\n\nPlease inspect flower pots and stagnant water sources to prevent mosquito breeding during monsoon. Free medical consultation available at all primary health centers.\n\nHelpline: 104"
      );
    } else if (ch === "SMS") {
      setRecipient("+91 9579333426");
      setSubject("SMS Advisory");
      setMessage(
        "GOVT-ALERT: Heavy rainfall warning. Move to higher ground. Free emergency shelter list at seva.gov.in. Helpline: 1070"
      );
    } else {
      setRecipient("+91 9579333426");
      setSubject("WhatsApp Public Alert");
      setMessage(
        "📢 *OFFICIAL DISASTER ADVISORY*\n\nHeavy rainfall alert for your area. Emergency shelters active across all municipal wards.\n\n📞 Emergency Helpline: 1070 / 112\n🌐 Live Updates: https://masscomm.gov.in"
      );
    }
    setShowTestModal(true);
  };

  const handleSendTest = async () => {
    if (!recipient.trim() || !message.trim()) {
      toast("error", "Please provide both recipient and message.");
      return;
    }

    setSending(true);
    setLastReceipt(null);
    try {
      const res = await sendTestMessage({
        channel: targetChannel,
        recipient: recipient.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
        language,
      });

      setLastReceipt(res);
      toast("success", `Test message successfully transmitted via ${targetChannel}!`);
      // Refresh history
      fetchChannelData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || (err instanceof Error ? err.message : "Failed to send test message");
      toast("error", msg);
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = (id: number) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === id
          ? { ...ch, status: ch.status === "Connected" ? "Disconnected" : "Connected" }
          : ch
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar>
        <button
          onClick={() => handleOpenTest("SMS")}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm cursor-pointer"
        >
          <Send size={14} />
          Send Test Broadcast
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Header banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Communication Channels</h1>
            <p className="text-sm text-slate-500 mt-1">
              Live gateway integrations for SMS, WhatsApp Business, and Email mass dispatching.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-medium">
              Total Dispatches: <strong className="text-blue-600">{dispatchedCount}</strong>
            </span>
            <button
              onClick={fetchChannelData}
              title="Refresh status"
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            >
              <RefreshCw size={14} className={loadingHistory ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Channel cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className={`rounded-xl border p-5 card-hover transition-all bg-white hover:shadow-md ${ch.borderColor}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg shadow-2xs border ${ch.color}`}>
                  {ch.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  {(ch.channelKey === "EMAIL" || ch.channelKey === "SMS" || ch.channelKey === "WHATSAPP") && (
                    <button
                      onClick={() => handleOpenTest(ch.channelKey as "EMAIL" | "SMS" | "WHATSAPP")}
                      className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send size={11} /> Test Send
                    </button>
                  )}
                  <button
                    onClick={() => toggleStatus(ch.id)}
                    className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <Settings size={14} className="text-slate-400" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-800 mb-1">{ch.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{ch.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`status-dot ${
                      ch.status === "Connected" ? "status-connected" : "status-disconnected"
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      ch.status === "Connected" ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {ch.status}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 font-mono">
                  {ch.protocol}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Channel Activity & Dispatch History */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs animate-fade-in">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Recent Communication Dispatches</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Real-time gateway logs</span>
          </div>

          <div className="overflow-x-auto">
            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No recent dispatches found. Click "Test Send" above to transmit a message through SMS, WhatsApp, or Email.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Campaign / Subject</th>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Message ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            item.channel === "SMS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.channel === "WHATSAPP"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {item.channel === "SMS" ? (
                            <MessageSquare size={11} />
                          ) : item.channel === "WHATSAPP" ? (
                            <Smartphone size={11} />
                          ) : (
                            <Mail size={11} />
                          )}
                          {item.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{item.recipient_name}</div>
                        <div className="text-[11px] text-slate-400">{item.recipient_contact}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {item.campaign_name || item.subject || "Direct Alert"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={item.message_preview}>
                        {item.message_preview}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                        {item.gateway_message_id || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle2 size={11} /> {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(item.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 animate-fade-in">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-700 leading-relaxed">
              All 3 mass channels (<strong>Email, SMS Gateway, and WhatsApp Business API</strong>) are actively operational.
              You can dispatch multilingual campaigns to targeted citizen groups directly from the Campaign Pipeline or Content Templates library.
            </p>
          </div>
        </div>
      </div>

      {/* Test Send Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Transmit Test Communication
                </h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Select Communication Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["SMS", "WHATSAPP", "EMAIL"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => handleOpenTest(ch)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        targetChannel === ch
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {ch === "SMS" && <MessageSquare size={13} />}
                      {ch === "WHATSAPP" && <Smartphone size={13} />}
                      {ch === "EMAIL" && <Mail size={13} />}
                      {ch === "WHATSAPP" ? "WhatsApp" : ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Recipient {targetChannel === "EMAIL" ? "Email Address" : "Phone Number"}
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={targetChannel === "EMAIL" ? "citizen@example.com" : "+91 9876543210"}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs input-focus font-mono"
                />
              </div>

              {/* Subject (for Email/WhatsApp) */}
              {targetChannel !== "SMS" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs input-focus"
                  />
                </div>
              )}

              {/* Language Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Communication Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white input-focus"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 text-xs input-focus leading-relaxed"
                />
              </div>

              {/* Receipt feedback */}
              {lastReceipt && (
                <div className={`p-3.5 rounded-xl border space-y-2.5 animate-fade-in text-xs ${
                  lastReceipt.status === "DELIVERED"
                    ? "bg-emerald-50/80 border-emerald-200"
                    : "bg-amber-50/80 border-amber-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 font-bold ${
                      lastReceipt.status === "DELIVERED" ? "text-emerald-800" : "text-amber-800"
                    }`}>
                      <CheckCircle2 size={14} className={lastReceipt.status === "DELIVERED" ? "text-emerald-600" : "text-amber-600"} />
                      {lastReceipt.status === "DELIVERED" ? "Live Gateway Delivery Recorded" : "Gateway Notice / Sandbox Delivery"}
                    </div>
                    {lastReceipt.provider && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 font-medium text-slate-700 shadow-2xs">
                        {lastReceipt.provider}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] leading-relaxed ${
                    lastReceipt.status === "DELIVERED" ? "text-emerald-700" : "text-amber-800"
                  }`}>
                    {lastReceipt.details}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    Gateway ID: {lastReceipt.message_id}
                  </p>

                  {/* Real-life Direct Actions */}
                  {targetChannel === "WHATSAPP" && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                      <a
                        href={lastReceipt.whatsapp_url || `https://wa.me/${recipient.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <ExternalLink size={13} />
                        Open & Send in WhatsApp (Web / Phone)
                      </a>
                      <span className="text-[10px] text-slate-500 text-center">
                        Bypasses sandbox template limits to send 100% authentic, full multilingual message directly.
                      </span>
                    </div>
                  )}

                  {targetChannel === "SMS" && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                      <a
                        href={lastReceipt.sms_url || `sms:${recipient.replace(/[^0-9+]/g, "")}?body=${encodeURIComponent(message)}`}
                        className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <MessageSquare size={13} />
                        Open in Phone SMS App (Send Live SMS)
                      </a>
                      <span className="text-[10px] text-slate-500 text-center">
                        To enable automated live SMS via API: Fast2SMS requires a 1-time ₹100 account transaction on fast2sms.com.
                      </span>
                    </div>
                  )}

                  {targetChannel === "EMAIL" && lastReceipt.mailto_url && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                      <a
                        href={lastReceipt.mailto_url}
                        className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <ExternalLink size={13} />
                        Open in Default Email App
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={sending || !recipient.trim() || !message.trim()}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Transmitting...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Send via {targetChannel}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
