import { useState, useEffect } from "react";
import { User, Shield, Bell, Globe, Link as LinkIcon, Save, Camera, CheckCircle2 } from "lucide-react";
import TopBar from "../components/TopBar";
import { useAppSettings } from "../context/AppSettingsContext";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

const SETTINGS_TABS = [
  { label: "Profile", icon: User },
  { label: "Account", icon: Shield },
  { label: "Security", icon: Shield },
  { label: "General Settings", icon: Globe },
  { label: "Notification Settings", icon: Bell },
  { label: "Connected Channels", icon: LinkIcon },
];

function formatRole(r?: string) {
  const role = (r || "").toUpperCase();
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "Administrator";
  if (role === "CAMPAIGN_MANAGER") return "Campaign Manager";
  if (role === "USER") return "User (Citizen)";
  return r || "User";
}

export default function Settings() {
  const { profile, generalSettings, updateProfile, updateDefaultLanguage, updateTimezone, toggleDarkMode } = useAppSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const isDark = generalSettings.darkMode;

  const effectiveName = user?.full_name || profile.fullName || "User";
  const effectiveEmail = user?.email || profile.email || "";
  const effectivePhone = user?.phone || profile.phone || "";
  const effectiveRole = formatRole(user?.role || profile.role);

  const [activeTab, setActiveTab] = useState("Profile");
  const [fullName, setFullName] = useState(effectiveName);
  const [email, setEmail] = useState(effectiveEmail);
  const [phone, setPhone] = useState(effectivePhone);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    } else {
      setFullName(profile.fullName);
      setEmail(profile.email);
      setPhone(profile.phone);
    }
  }, [user, profile]);

  const handleSave = () => {
    const updatedName = fullName.trim() || effectiveName;
    const updatedEmail = email.trim();
    const updatedPhone = phone.trim();

    updateProfile({
      fullName: updatedName,
      email: updatedEmail,
      phone: updatedPhone,
      role: user?.role || profile.role,
    });

    // Synchronize localStorage mass_comm_user so TopBar and Sidebar update immediately
    try {
      const stored = localStorage.getItem("mass_comm_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.full_name = updatedName;
        parsed.email = updatedEmail;
        parsed.phone = updatedPhone;
        localStorage.setItem("mass_comm_user", JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn("Could not sync mass_comm_user in localStorage:", e);
    }

    setSaved(true);
    toast("success", "Profile updated successfully! Changes reflected across the platform.");
    setTimeout(() => setSaved(false), 2500);
  };

  // Compute initials directly from current active name
  const avatarInitials = (user?.full_name || fullName || profile.fullName || "US")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const userRoleKey = (user?.role || profile.role || "").toUpperCase();
  const isUserAdmin = userRoleKey === "ADMIN" || userRoleKey === "SUPER_ADMIN";
  const isUserManager = userRoleKey === "CAMPAIGN_MANAGER";

  // Reusable class helpers
  const cardBg = isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200";
  const headingText = isDark ? "text-slate-100" : "text-slate-800";
  const subText = isDark ? "text-slate-400" : "text-slate-500";
  const labelText = isDark ? "text-slate-300" : "text-slate-600";
  const inputCls = isDark
    ? "bg-slate-700/60 border-slate-600 text-slate-200 placeholder:text-slate-500 input-focus"
    : "bg-white border-slate-200 text-slate-800 input-focus";
  const rowBorder = isDark ? "border-slate-700" : "border-slate-200";
  const rowItemText = isDark ? "text-slate-200" : "text-slate-700";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="animate-fade-in mb-6">
          <h1 className={`text-xl font-bold ${headingText}`}>Settings</h1>
          <p className={`text-sm mt-1 ${subText}`}>Manage your account and platform settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tab navigation */}
          <div className="lg:col-span-1">
            <nav className={`rounded-xl border overflow-hidden ${cardBg}`}>
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-3 ${
                    activeTab === tab.label
                      ? isDark
                        ? "bg-blue-500/15 text-blue-400 border-blue-500"
                        : "bg-blue-50 text-blue-700 border-blue-600"
                      : isDark
                        ? "text-slate-400 border-transparent hover:bg-slate-700/50"
                        : "text-slate-600 border-transparent hover:bg-slate-50"
                  }`}
                >
                  <tab.icon size={16} className={
                    activeTab === tab.label
                      ? isDark ? "text-blue-400" : "text-blue-600"
                      : isDark ? "text-slate-500" : "text-slate-400"
                  } />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "Profile" && (
              <div className={`rounded-xl border p-6 animate-fade-in ${cardBg}`}>
                <h2 className={`text-sm font-bold mb-6 ${headingText}`}>Profile Information</h2>

                {/* Avatar & User Meta */}
                <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${isDark ? "border-slate-700/60" : "border-slate-100"}`}>
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {avatarInitials}
                    </div>
                    <button className={`absolute bottom-0 right-0 w-7 h-7 rounded-full border flex items-center justify-center shadow-sm transition-colors ${
                      isDark
                        ? "bg-slate-700 border-slate-600 hover:bg-slate-600"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}>
                      <Camera size={12} className={isDark ? "text-slate-300" : "text-slate-500"} />
                    </button>
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${headingText}`}>{fullName || effectiveName}</h3>
                    <p className={`text-xs ${subText}`}>{effectiveRole}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                      isUserAdmin
                        ? isDark
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : "text-emerald-600 bg-emerald-50 border-emerald-100"
                        : isUserManager
                        ? isDark
                          ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                          : "text-blue-600 bg-blue-50 border-blue-100"
                        : isDark
                          ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                          : "text-indigo-600 bg-indigo-50 border-indigo-100"
                    }`}>
                      <CheckCircle2 size={11} /> {isUserAdmin ? "Active Administrator" : isUserManager ? "Active Campaign Manager" : "Active User"}
                    </span>
                  </div>
                </div>

                {/* Form without Organization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${labelText}`}>Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Yash"
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm ${inputCls}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${labelText}`}>Role</label>
                    <input
                      type="text"
                      disabled
                      value={effectiveRole}
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm opacity-90 cursor-not-allowed ${inputCls} ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${labelText}`}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. user@connectai.gov.in"
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm ${inputCls}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${labelText}`}>Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm ${inputCls}`}
                    />
                  </div>
                </div>

                <div className={`mt-6 pt-6 border-t flex items-center justify-between ${isDark ? "border-slate-700/60" : "border-slate-100"}`}>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                  >
                    <Save size={15} />
                    {saved ? "Saved Successfully!" : "Update Profile"}
                  </button>
                  {saved && (
                    <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
                      ✓ Profile details updated and synchronized
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeTab === "Account" && (
              <div className={`rounded-xl border p-6 animate-fade-in ${cardBg}`}>
                <h2 className={`text-sm font-bold mb-4 ${headingText}`}>Account Settings</h2>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${rowBorder}`}>
                    <div>
                      <h3 className={`text-sm font-medium ${rowItemText}`}>Two-Factor Authentication</h3>
                      <p className={`text-xs ${subText}`}>Add an extra layer of security to your account.</p>
                    </div>
                    <button className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isDark
                        ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}>
                      Enable
                    </button>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${rowBorder}`}>
                    <div>
                      <h3 className={`text-sm font-medium ${rowItemText}`}>Session Management</h3>
                      <p className={`text-xs ${subText}`}>Manage your active sessions across devices.</p>
                    </div>
                    <button className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isDark
                        ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}>
                      View Sessions
                    </button>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDark ? "border-red-500/30 bg-red-500/10" : "border-red-100 bg-red-50"
                  }`}>
                    <div>
                      <h3 className={`text-sm font-medium ${isDark ? "text-red-400" : "text-red-700"}`}>Delete Account</h3>
                      <p className={`text-xs ${isDark ? "text-red-400/70" : "text-red-500"}`}>Permanently delete your account and all data.</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Security" && (
              <div className={`rounded-xl border p-6 animate-fade-in ${cardBg}`}>
                <h2 className={`text-sm font-bold mb-4 ${headingText}`}>Security Settings</h2>
                <div className="space-y-5">
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${labelText}`}>Current Password</label>
                    <input type="password" className={`w-full max-w-md px-3 py-2.5 rounded-lg border text-sm ${inputCls}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${labelText}`}>New Password</label>
                    <input type="password" className={`w-full max-w-md px-3 py-2.5 rounded-lg border text-sm ${inputCls}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${labelText}`}>Confirm New Password</label>
                    <input type="password" className={`w-full max-w-md px-3 py-2.5 rounded-lg border text-sm ${inputCls}`} />
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    <Save size={14} />
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === "General Settings" && (
              <div className={`rounded-xl border p-6 animate-fade-in ${cardBg}`}>
                <h2 className={`text-sm font-bold mb-4 ${headingText}`}>General Settings</h2>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${rowBorder}`}>
                    <div>
                      <h3 className={`text-sm font-medium ${rowItemText}`}>Default Language</h3>
                      <p className={`text-xs ${subText}`}>Set the default language across content generation and campaigns.</p>
                      <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                        isDark ? "text-blue-400 bg-blue-500/10" : "text-blue-600 bg-blue-50"
                      }`}>
                        Currently Active: {generalSettings.defaultLanguage}
                      </span>
                    </div>
                    <select
                      value={generalSettings.defaultLanguage}
                      onChange={(e) => {
                        const newLang = e.target.value;
                        updateDefaultLanguage(newLang);
                        toast("success", `Default language set to ${newLang}. Content templates and generator will default to this language.`);
                      }}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium input-focus cursor-pointer min-w-[160px] ${
                        isDark
                          ? "bg-slate-700 border-slate-600 text-slate-200"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                    </select>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${rowBorder}`}>
                    <div>
                      <h3 className={`text-sm font-medium ${rowItemText}`}>Timezone</h3>
                      <p className={`text-xs ${subText}`}>Set your timezone for scheduling campaigns.</p>
                    </div>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => {
                        updateTimezone(e.target.value);
                        toast("info", `Timezone updated to ${e.target.value}`);
                      }}
                      className={`px-3 py-2 rounded-lg border text-xs input-focus cursor-pointer ${
                        isDark
                          ? "bg-slate-700 border-slate-600 text-slate-200"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York (EST)">America/New_York (EST)</option>
                      <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${rowBorder}`}>
                    <div>
                      <h3 className={`text-sm font-medium ${rowItemText}`}>Dark Mode</h3>
                      <p className={`text-xs ${subText}`}>Switch between light and dark themes.</p>
                    </div>
                    <button
                      onClick={() => {
                        toggleDarkMode();
                        toast("info", !generalSettings.darkMode ? "Dark mode activated 🌙" : "Light mode activated ☀️");
                      }}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                        generalSettings.darkMode ? "bg-blue-600" : isDark ? "bg-slate-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          generalSettings.darkMode ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Notification Settings" && (
              <div className={`rounded-xl border p-6 animate-fade-in ${cardBg}`}>
                <h2 className={`text-sm font-bold mb-4 ${headingText}`}>Notification Settings</h2>
                <div className="space-y-4">
                  {[
                    { title: "Campaign Completion", desc: "Get notified when a campaign finishes" },
                    { title: "New Recipients", desc: "Get notified when new recipients are added" },
                    { title: "Quality Alerts", desc: "Get notified about content quality issues" },
                    { title: "Weekly Reports", desc: "Receive weekly engagement summaries" },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-lg border ${rowBorder}`}>
                      <div>
                        <h3 className={`text-sm font-medium ${rowItemText}`}>{item.title}</h3>
                        <p className={`text-xs ${subText}`}>{item.desc}</p>
                      </div>
                      <button className={`w-12 h-6 rounded-full relative transition-colors ${i < 2 ? "bg-blue-600" : isDark ? "bg-slate-600" : "bg-slate-200"}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${i < 2 ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Connected Channels" && (
              <div className={`rounded-xl border p-6 animate-fade-in ${cardBg}`}>
                <h2 className={`text-sm font-bold mb-4 ${headingText}`}>Connected Channels</h2>
                <div className="space-y-3">
                  {[
                    { name: "Email (SMTP)", status: true },
                    { name: "SMS Gateway", status: true },
                    { name: "WhatsApp Business", status: true },
                    { name: "Push Notifications", status: true },
                    { name: "Social Media", status: false },
                  ].map((ch, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-lg border ${rowBorder}`}>
                      <div className="flex items-center gap-3">
                        <span className={`status-dot ${ch.status ? "status-connected" : "status-disconnected"}`} />
                        <span className={`text-sm font-medium ${rowItemText}`}>{ch.name}</span>
                      </div>
                      <span className={`text-xs font-medium ${ch.status ? "text-emerald-600" : "text-red-500"}`}>
                        {ch.status ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
