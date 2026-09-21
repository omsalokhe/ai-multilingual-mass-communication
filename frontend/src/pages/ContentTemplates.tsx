import { useState } from "react";
import { Sparkles, Copy, Save, FileText, AlertTriangle, BookOpen, Building2 } from "lucide-react";
import TopBar from "../components/TopBar";

const TEMPLATES = [
  {
    id: 1,
    name: "Health Awareness",
    description: "Promote healthy practices and wellness campaigns for public benefit.",
    icon: <FileText size={20} className="text-blue-600" />,
    category: "Awareness",
    color: "bg-blue-50 border-blue-100",
  },
  {
    id: 2,
    name: "Emergency Alert",
    description: "Urgent alerts for natural disasters, disease outbreaks and emergencies.",
    icon: <AlertTriangle size={20} className="text-red-600" />,
    category: "Emergency",
    color: "bg-red-50 border-red-100",
  },
  {
    id: 3,
    name: "Policy Update",
    description: "Government policy and rule updates for public awareness.",
    icon: <Building2 size={20} className="text-amber-600" />,
    category: "Educational",
    color: "bg-amber-50 border-amber-100",
  },
  {
    id: 4,
    name: "Educational Notice",
    description: "Academic notifications, exam updates, and scholarship alerts.",
    icon: <BookOpen size={20} className="text-emerald-600" />,
    category: "Educational",
    color: "bg-emerald-50 border-emerald-100",
  },
];

const CATEGORY_TABS = ["All", "Awareness", "Emergency", "Educational"];

export default function ContentTemplates() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Formal");
  const [language, setLanguage] = useState("English");
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerated(
        `Follow these preventive measures to stay safe from dengue this monsoon season:\n\n1. Eliminate standing water around your home and workplace\n2. Use mosquito repellents and wear protective clothing\n3. Keep windows and doors screened\n4. Seek immediate medical attention if you experience high fever, severe headaches, or joint pain\n\nTogether, we can prevent dengue and protect our community. For health helpline, call 104.\n\n#DenguePrevention #StaySafe #PublicHealth`
      );
      setGenerating(false);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTemplates = TEMPLATES.filter(
    (t) => activeCategory === "All" || t.category === activeCategory
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-slate-800">Content & Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Generate AI-powered content and manage templates.</p>
        </div>

        {/* AI Content Generator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">AI Content Generator</h2>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Powered by LLM</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input side */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Campaign Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Health Awareness for Monsoon"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Say with the message?</label>
                <textarea
                  placeholder="Follow these preventive steps to protect against dengue disease and keep your family healthy..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Tone</label>
                <div className="flex gap-2">
                  {["Formal", "Friendly", "Urgent"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                        tone === t
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Kannada</option>
                  <option>Tamil</option>
                  <option>Telugu</option>
                  <option>Marathi</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate Content
                  </>
                )}
              </button>
            </div>

            {/* Generated content */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Generated Content</label>
              <div className="h-[280px] p-4 rounded-lg border border-slate-200 bg-slate-50 overflow-y-auto">
                {generated ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{generated}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Generated content will appear here...</p>
                )}
              </div>
              {generated && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Copy size={12} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <Save size={12} />
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="animate-fade-in">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Templates</h2>

          <div className="flex gap-0 border-b border-slate-200 mb-4">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCategory(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
                  activeCategory === tab ? "tab-active" : "tab-inactive"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className={`rounded-xl border p-5 card-hover cursor-pointer ${tmpl.color}`}
              >
                <div className="mb-3">{tmpl.icon}</div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">{tmpl.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{tmpl.description}</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                    Use Template
                  </button>
                  <button className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-white transition-colors">
                    View Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
