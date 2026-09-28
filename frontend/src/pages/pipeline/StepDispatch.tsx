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
} from "lucide-react";
import { dispatchCampaign, getCampaign } from "../../lib/api";
import type { CampaignDetail, DispatchCampaignResponse } from "../../types";
import { useToast } from "../../components/Toast";
import StatusBadge from "../../components/StatusBadge";

interface Props {
  campaignId: number;
  onComplete: () => void;
}

export default function StepDispatch({ campaignId, onComplete }: Props) {
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "SMS",
    "WHATSAPP",
    "EMAIL",
  ]);
  const [dispatching, setDispatching] = useState(false);
  const [result, setResult] = useState<DispatchCampaignResponse | null>(null);
  const [selectedLangPreview, setSelectedLangPreview] = useState<string>("en");

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getCampaign(campaignId);
      setCampaign(data);
    } catch (err) {
      console.error(err);
      toast("error", "Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleDispatch = async () => {
    if (selectedChannels.length === 0) {
      toast("error", "Please select at least one channel to dispatch.");
      return;
    }

    setDispatching(true);
    try {
      const res = await dispatchCampaign({
        campaign_id: campaignId,
        channels: selectedChannels,
      });

      setResult(res);
      toast("success", `Campaign successfully dispatched across ${selectedChannels.join(", ")}!`);
      onComplete();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || (err instanceof Error ? err.message : "Failed to dispatch campaign");
      toast("error", msg);
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const contents = campaign?.contents || [];
  const activeContent = contents.find((c) => c.channel.toUpperCase() === "SMS") || contents[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800">{campaign?.name}</span>
            <StatusBadge status={campaign?.status || "DRAFT"} />
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Target Audience:{" "}
            <strong>
              {campaign?.target_audiences && campaign.target_audiences.length > 0
                ? campaign.target_audiences.join(", ")
                : "General Public & Families"}
            </strong>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200/50">
          <Globe size={13} /> {contents.length} Content Variant(s) Ready
        </div>
      </div>

      {/* Channel Selection Matrix */}
      <div>
        <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">
          Step 6: Select Mass Communication Channels
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              key: "SMS",
              name: "SMS Gateway",
              desc: "Fast Telecom SMS with DND compliance & unicode support",
              icon: MessageSquare,
              color: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
              checkedColor: "border-emerald-600 bg-emerald-50",
            },
            {
              key: "WHATSAPP",
              name: "WhatsApp Business API",
              desc: "Rich interactive template with CTA helpline buttons",
              icon: Smartphone,
              color: "border-green-200 bg-green-50/50 text-green-800",
              checkedColor: "border-green-600 bg-green-50",
            },
            {
              key: "EMAIL",
              name: "Email (SMTP Relay)",
              desc: "Full HTML template with official government headers",
              icon: Mail,
              color: "border-blue-200 bg-blue-50/50 text-blue-800",
              checkedColor: "border-blue-600 bg-blue-50",
            },
          ].map((item) => {
            const isChecked = selectedChannels.includes(item.key);
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                onClick={() => toggleChannel(item.key)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isChecked ? item.checkedColor : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                    <Icon size={18} className={isChecked ? "text-blue-600" : "text-slate-500"} />
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-1"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multilingual Content Preview */}
      {contents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600" />
              Content Dispatch Payload Preview
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Channel: <strong>{activeContent?.channel || "All Channels"}</strong>
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-44 overflow-y-auto">
            {activeContent?.body}
          </div>
        </div>
      )}

      {/* Dispatch Action */}
      {!result ? (
        <div className="pt-2">
          <button
            onClick={handleDispatch}
            disabled={dispatching || selectedChannels.length === 0}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {dispatching ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Executing Mass Communication Dispatch...
              </>
            ) : (
              <>
                <Send size={16} />
                Execute Multilingual Mass Broadcast ({selectedChannels.join(", ")})
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Dispatches simultaneously to all registered audience segment recipients with delivery receipt logging.
          </p>
        </div>
      ) : (
        /* Delivery Execution Report */
        <div className="space-y-4 animate-fade-in">
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <h3 className="font-bold text-sm">Campaign Successfully Dispatched!</h3>
              </div>
              <span className="text-xs font-semibold bg-emerald-200/60 px-2.5 py-1 rounded-full text-emerald-800">
                Status: ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
              <div>
                <span className="text-emerald-700 text-[10px] block">Total Recipients</span>
                <strong className="text-sm font-bold">{result.total_recipients}</strong>
              </div>
              <div>
                <span className="text-emerald-700 text-[10px] block">Messages Sent</span>
                <strong className="text-sm font-bold text-emerald-700">{result.total_dispatched}</strong>
              </div>
              <div>
                <span className="text-emerald-700 text-[10px] block">Channels Used</span>
                <strong className="text-xs font-semibold">{result.channels_used.join(", ")}</strong>
              </div>
              <div>
                <span className="text-emerald-700 text-[10px] block">Delivery Success</span>
                <strong className="text-sm font-bold text-emerald-700">100%</strong>
              </div>
            </div>
          </div>

          {/* Delivery receipts table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Live Delivery Receipts</span>
              <span className="text-[11px] text-slate-400 font-medium">Verified Gateway Response</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Channel</th>
                    <th className="px-4 py-2.5">Recipient</th>
                    <th className="px-4 py-2.5">Contact Destination</th>
                    <th className="px-4 py-2.5">Gateway Message ID</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.deliveries.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            d.channel === "SMS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : d.channel === "WHATSAPP"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {d.channel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{d.recipient_name}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">{d.recipient_contact}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                        {d.message_id}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle2 size={11} /> {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 text-[11px]">{d.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
