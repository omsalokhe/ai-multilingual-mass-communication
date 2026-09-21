import { useState } from "react";
import { Sparkles, Copy, Save } from "lucide-react";
import TopBar from "../components/TopBar";

export default function AIContentGenerator() {
  const [topic, setTopic] = useState("");
  const [channel, setChannel] = useState("Email");
  const [tone, setTone] = useState("Formal");
  const [language, setLanguage] = useState("English");
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const content = tone === "Formal"
        ? `Subject: Important Advisory — ${topic}\n\nDear Citizen,\n\nWe would like to inform you about an important ${topic.toLowerCase()} initiative being undertaken by the government.\n\nKey Points:\n• This campaign aims to raise awareness about ${topic.toLowerCase()}\n• Please follow the recommended guidelines issued by the concerned authorities\n• For more information, contact your local government office or call the helpline at 104\n\nWe urge all citizens to actively participate in this initiative and help spread awareness in their communities.\n\nStay informed. Stay safe.\n\nWarm regards,\nPublic Communication Department`
        : tone === "Friendly"
          ? `Hey there! 👋\n\nWe've got some important news about ${topic.toLowerCase()} that we'd love to share with you!\n\nHere's what you need to know:\n✅ Stay updated with the latest developments\n✅ Share this information with your friends and family\n✅ Follow recommended guidelines\n\nTogether, we can make a real difference! 💪\n\nGot questions? Just reply to this message or call us at 104. We're here to help!\n\n#${topic.replace(/\s/g, "")} #PublicAwareness`
          : `⚠️ URGENT: ${topic.toUpperCase()} ALERT\n\nIMPORTANT NOTICE: This is an urgent communication regarding ${topic.toLowerCase()}.\n\nIMMEDIATE ACTION REQUIRED:\n🔴 Follow all safety guidelines immediately\n🔴 Contact emergency services if needed (Dial 112)\n🔴 Share this alert with your family and neighbors\n🔴 Do NOT ignore this advisory\n\nFor emergency assistance, call: 112 | Helpline: 104\n\nStay alert. Stay safe.`;

      setGenerated(content);
      setGenerating(false);
    }, 1800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">AI Content Generator</h1>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                Powered by LLM
              </span>
            </div>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Left: Input */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Campaign Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Vaccination awareness drive..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Select Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none"
                >
                  <option>Email</option>
                  <option>SMS</option>
                  <option>WhatsApp</option>
                  <option>Push Notification</option>
                  <option>Web Broadcast</option>
                  <option>Social Media</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Tone</label>
                <div className="flex gap-2">
                  {["Formal", "Friendly", "Urgent"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
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
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Language
                </label>
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
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
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

            {/* Right: Output */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-medium text-slate-600">
                  Generated Content
                </label>
                {generated && (
                  <div className="flex gap-2">
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

              <div className="min-h-[350px] p-4 rounded-lg border border-slate-200 bg-slate-50 overflow-y-auto">
                {generated ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line animate-fade-in">
                    {generated}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <Sparkles size={36} className="text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400">
                      Enter a topic and click "Generate Content" to create AI-powered campaign content.
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Your generated content will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
