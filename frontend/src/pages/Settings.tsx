import { useState } from "react";
import { User, Shield, Bell, Globe, Link as LinkIcon, Save, Camera } from "lucide-react";
import TopBar from "../components/TopBar";

const SETTINGS_TABS = [
  { label: "Profile", icon: User },
  { label: "Account", icon: Shield },
  { label: "Security", icon: Shield },
  { label: "General Settings", icon: Globe },
  { label: "Notification Settings", icon: Bell },
  { label: "Connected Channels", icon: LinkIcon },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [fullName, setFullName] = useState("Om Sabitha");
  const [email, setEmail] = useState("om.sabitha@masscomm.gov.in");
  const [phone, setPhone] = useState("+91 9876543210");
  const [organization, setOrganization] = useState("PSG College of Engineering");
  const [role, setRole] = useState("Campaign Manager");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="animate-fade-in mb-6">
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account and platform settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tab navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-3 ${
                    activeTab === tab.label
                      ? "bg-blue-50 text-blue-700 border-blue-600"
                      : "text-slate-600 border-transparent hover:bg-slate-50"
                  }`}
                >
                  <tab.icon size={16} className={activeTab === tab.label ? "text-blue-600" : "text-slate-400"} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "Profile" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
                <h2 className="text-sm font-bold text-slate-800 mb-6">Profile Information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      OM
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
                      <Camera size={12} className="text-slate-500" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Om Sabitha</h3>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Role</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus bg-slate-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Organization</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={14} />
                    {saved ? "Saved!" : "Update Profile"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Account" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Account Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Two-Factor Authentication</h3>
                      <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Session Management</h3>
                      <p className="text-xs text-slate-500">Manage your active sessions across devices.</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      View Sessions
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-red-100 bg-red-50">
                    <div>
                      <h3 className="text-sm font-medium text-red-700">Delete Account</h3>
                      <p className="text-xs text-red-500">Permanently delete your account and all data.</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Security" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Security Settings</h2>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Current Password</label>
                    <input type="password" className="w-full max-w-md px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">New Password</label>
                    <input type="password" className="w-full max-w-md px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Confirm New Password</label>
                    <input type="password" className="w-full max-w-md px-3 py-2.5 rounded-lg border border-slate-200 text-sm input-focus" />
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    <Save size={14} />
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === "General Settings" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
                <h2 className="text-sm font-bold text-slate-800 mb-4">General Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Default Language</h3>
                      <p className="text-xs text-slate-500">Set the default language for content generation.</p>
                    </div>
                    <select className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white input-focus appearance-none cursor-pointer">
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Kannada</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Timezone</h3>
                      <p className="text-xs text-slate-500">Set your timezone for scheduling campaigns.</p>
                    </div>
                    <select className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white input-focus appearance-none cursor-pointer">
                      <option>Asia/Kolkata (IST)</option>
                      <option>UTC</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Dark Mode</h3>
                      <p className="text-xs text-slate-500">Switch between light and dark themes.</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-slate-200 relative transition-colors">
                      <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Notification Settings" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Notification Settings</h2>
                <div className="space-y-4">
                  {[
                    { title: "Campaign Completion", desc: "Get notified when a campaign finishes" },
                    { title: "New Recipients", desc: "Get notified when new recipients are added" },
                    { title: "Quality Alerts", desc: "Get notified about content quality issues" },
                    { title: "Weekly Reports", desc: "Receive weekly engagement summaries" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                      <div>
                        <h3 className="text-sm font-medium text-slate-700">{item.title}</h3>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <button className={`w-12 h-6 rounded-full relative transition-colors ${i < 2 ? "bg-blue-600" : "bg-slate-200"}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${i < 2 ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Connected Channels" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Connected Channels</h2>
                <div className="space-y-3">
                  {[
                    { name: "Email (SMTP)", status: true },
                    { name: "SMS Gateway", status: true },
                    { name: "WhatsApp Business", status: true },
                    { name: "Push Notifications", status: true },
                    { name: "Social Media", status: false },
                  ].map((ch, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className={`status-dot ${ch.status ? "status-connected" : "status-disconnected"}`} />
                        <span className="text-sm font-medium text-slate-700">{ch.name}</span>
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
