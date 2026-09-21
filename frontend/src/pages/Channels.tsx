import { useState } from "react";
import { Plus, Mail, MessageSquare, Smartphone, Bell, Globe, Share2, Settings, Info } from "lucide-react";
import TopBar from "../components/TopBar";

interface Channel {
  id: number;
  name: string;
  icon: React.ReactNode;
  status: "Connected" | "Disconnected";
  subscribers?: string;
  description: string;
  color: string;
  borderColor: string;
}

const CHANNELS: Channel[] = [
  {
    id: 1,
    name: "Email",
    icon: <Mail size={24} className="text-blue-600" />,
    status: "Connected",
    subscribers: "Connected",
    description: "SMTP integration for transactional and campaign emails.",
    color: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  {
    id: 2,
    name: "SMS",
    icon: <MessageSquare size={24} className="text-emerald-600" />,
    status: "Connected",
    subscribers: "Connected",
    description: "SMS gateway for mass text messaging.",
    color: "bg-emerald-50",
    borderColor: "border-emerald-100",
  },
  {
    id: 3,
    name: "WhatsApp Business",
    icon: <Smartphone size={24} className="text-green-600" />,
    status: "Connected",
    subscribers: "Connected",
    description: "WhatsApp Business API for rich media messaging.",
    color: "bg-green-50",
    borderColor: "border-green-100",
  },
  {
    id: 4,
    name: "Push Notifications",
    icon: <Bell size={24} className="text-amber-600" />,
    status: "Connected",
    subscribers: "400 subscribers",
    description: "Browser and mobile push notification support.",
    color: "bg-amber-50",
    borderColor: "border-amber-100",
  },
  {
    id: 5,
    name: "Website / Web Broadcast",
    icon: <Globe size={24} className="text-indigo-600" />,
    status: "Connected",
    subscribers: "150 subscribers",
    description: "Web broadcast overlays and announcement banners.",
    color: "bg-indigo-50",
    borderColor: "border-indigo-100",
  },
  {
    id: 6,
    name: "Social Media",
    icon: <Share2 size={24} className="text-pink-600" />,
    status: "Connected",
    subscribers: "400 subscribers",
    description: "Integration with Facebook, Twitter, and Instagram.",
    color: "bg-pink-50",
    borderColor: "border-pink-100",
  },
];

export default function Channels() {
  const [channels, setChannels] = useState(CHANNELS);

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
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} />
          Add Channel
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-slate-800">Communication Channels</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your communication channels and integrations.</p>
        </div>

        {/* Channel cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className={`rounded-xl border p-5 card-hover ${ch.color} ${ch.borderColor}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-white rounded-lg shadow-sm border border-white/50">
                  {ch.icon}
                </div>
                <button
                  onClick={() => toggleStatus(ch.id)}
                  className="p-1.5 rounded-md hover:bg-white/50 transition-colors"
                >
                  <Settings size={14} className="text-slate-400" />
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-800 mb-1">{ch.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{ch.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`status-dot ${
                      ch.status === "Connected" ? "status-connected" : "status-disconnected"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      ch.status === "Connected" ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {ch.status}
                  </span>
                </div>
                {ch.subscribers && ch.subscribers !== "Connected" && (
                  <span className="text-[11px] text-slate-500">{ch.subscribers}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 animate-fade-in">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-700 leading-relaxed">
              All channels are connected and operational. You can manage channel settings, 
              configure delivery options, and monitor channel health from each channel's settings panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
