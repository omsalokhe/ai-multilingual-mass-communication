import {
  Megaphone,
  Users,
  Mail,
  TrendingUp,
  Smile,
  Send,
  Eye,
  MousePointer,
  Sparkles,
  Copy,
  ArrowRight,
} from "lucide-react";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import { LineChart, DonutChart, ChartLegend } from "../components/MiniChart";
import StatusBadge from "../components/StatusBadge";
import { useState } from "react";

/* ─── Mock Data ──────────────────────────────────────────── */

const STATS = [
  { icon: <Megaphone size={20} className="text-blue-600" />, iconBg: "bg-blue-50", label: "Total Campaigns", value: "12", change: 3.2 },
  { icon: <Users size={20} className="text-indigo-600" />, iconBg: "bg-indigo-50", label: "Total Recipients", value: "48,192", change: 5.1 },
  { icon: <Mail size={20} className="text-emerald-600" />, iconBg: "bg-emerald-50", label: "Messages Delivered", value: "46,980", change: 8.4 },
  { icon: <TrendingUp size={20} className="text-amber-600" />, iconBg: "bg-amber-50", label: "Avg. Engagement Rate", value: "78.4%", change: 2.1 },
  { icon: <Smile size={20} className="text-green-600" />, iconBg: "bg-green-50", label: "Positive Sentiment", value: "86.2%", change: 1.5 },
];

const PERFORMANCE_LABELS = ["Sep 6", "Sep 7", "Sep 8", "Sep 9", "Sep 10", "Sep 11", "Sep 12", "Sep 13", "Sep 14", "Sep 15"];
const PERFORMANCE_DATA = [
  { label: "Delivered", values: [380, 420, 450, 430, 460, 480, 510, 495, 530, 550] },
  { label: "Opened", values: [280, 310, 340, 320, 350, 370, 390, 380, 410, 425] },
  { label: "Clicked", values: [120, 140, 155, 145, 160, 175, 185, 180, 200, 210] },
];

const DONUT_SLICES = [
  { label: "Email", value: 35, color: "#3b82f6" },
  { label: "SMS", value: 28, color: "#22c55e" },
  { label: "WhatsApp", value: 22, color: "#06b6d4" },
  { label: "Push Notification", value: 15, color: "#f59e0b" },
];

const RECENT_CAMPAIGNS = [
  { name: "Health Awareness Drive", channel: "All Channels", audience: "Completed", date: "Sep 10, 2025", status: "COMPLETED", engagement: "82%" },
  { name: "Education Policy Update", channel: "Students + Parents", audience: "Completed", date: "Sep 14, 2025", status: "SCHEDULED", engagement: "—" },
  { name: "Emergency Flood Alert", channel: "Rural Areas", audience: "Completed", date: "Sep 13, 2025", status: "COMPLETED", engagement: "91%" },
  { name: "Employee Onboarding", channel: "Employees", audience: "Draft", date: "Sep 12, 2025", status: "DRAFT", engagement: "—" },
  { name: "Vaccination Awareness", channel: "All Citizens", audience: "Scheduled", date: "Sep 20, 2025", status: "SCHEDULED", engagement: "—" },
];

const SEGMENTS = [
  { name: "ConnectPads", count: "18,432", icon: "👥", color: "bg-blue-50 border-blue-100" },
  { name: "Students", count: "7,846", icon: "🎓", color: "bg-indigo-50 border-indigo-100" },
  { name: "Employers", count: "6,723", icon: "💼", color: "bg-emerald-50 border-emerald-100" },
  { name: "Rural Communities", count: "6,391", icon: "🌾", color: "bg-amber-50 border-amber-100" },
];

export default function Dashboard() {
  const [perfFilter, setPerfFilter] = useState<"delivered" | "opened" | "clicked">("delivered");
  const [contentTopic, setContentTopic] = useState("");
  const [contentTone, setContentTone] = useState("Formal");
  const [contentLang, setContentLang] = useState("English");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    if (!contentTopic.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGeneratedContent(
        `Follow these preventive steps to protect against dengue: Keep your surroundings clean, eliminate standing water, use mosquito repellents, and wear protective clothing. Consult a doctor immediately if you experience high fever, severe headache, or joint pain. Together, we can prevent dengue and keep our families healthy.`
      );
      setGenerating(false);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Greeting */}
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-slate-800">Good Morning, Om! 👋</h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's an overview of your communication campaigns and engagement.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className={`delay-${(i + 1) * 100}`}>
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Performance */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Campaign Performance</h2>
              <div className="flex gap-1">
                {(["delivered", "opened", "clicked"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPerfFilter(f)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      perfFilter === f
                        ? "bg-blue-100 text-blue-700"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <LineChart
              data={PERFORMANCE_DATA}
              labels={PERFORMANCE_LABELS}
              colors={["#3b82f6", "#22c55e", "#f59e0b"]}
              height={220}
            />
            <ChartLegend
              items={[
                { label: "Delivered", color: "#3b82f6" },
                { label: "Opened", color: "#22c55e" },
                { label: "Clicked", color: "#f59e0b" },
              ]}
              className="mt-3"
            />
          </div>

          {/* Campaigns by Channel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fade-in">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Campaigns by Channel</h2>
            <div className="flex justify-center">
              <DonutChart
                slices={DONUT_SLICES}
                size={160}
                strokeWidth={24}
                centerValue="12"
                centerLabel="Total"
              />
            </div>
            <div className="mt-4 space-y-2">
              {DONUT_SLICES.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-600">{s.label}</span>
                  </div>
                  <span className="font-semibold text-slate-700">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Campaigns + AI Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Recent Campaigns</h2>
              <button className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Name</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Channel</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Audience</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Date</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_CAMPAIGNS.map((c, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-5 py-3 text-slate-600">{c.channel}</td>
                      <td className="px-5 py-3 text-slate-600">{c.audience}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{c.date}</td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{c.engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Content Generator Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">AI Content Generator</h2>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Powered by LLM</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Enter your campaign topic or idea</label>
                <input
                  type="text"
                  value={contentTopic}
                  onChange={(e) => setContentTopic(e.target.value)}
                  placeholder="e.g., Dengue prevention awareness"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm input-focus"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Tone</label>
                  <select
                    value={contentTone}
                    onChange={(e) => setContentTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
                  >
                    <option>Formal</option>
                    <option>Friendly</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Language</label>
                  <select
                    value={contentLang}
                    onChange={(e) => setContentLang(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Kannada</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !contentTopic.trim()}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Generate Content
                  </>
                )}
              </button>
              {generatedContent && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-700 leading-relaxed">{generatedContent}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium">
                      <Copy size={10} /> Copy
                    </button>
                    <button className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 font-medium">
                      <Eye size={10} /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audience Segments */}
        <div className="animate-fade-in">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Audience Segments</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SEGMENTS.map((seg, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl border p-4 card-hover cursor-pointer ${seg.color}`}
              >
                <div className="text-2xl mb-2">{seg.icon}</div>
                <div className="text-lg font-bold text-slate-800">{seg.count}</div>
                <div className="text-xs text-slate-500">{seg.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
