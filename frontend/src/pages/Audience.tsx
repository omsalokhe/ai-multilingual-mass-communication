import { useState } from "react";
import { Plus, Search, Users, MapPin, Globe, Briefcase, Calendar, Save } from "lucide-react";
import TopBar from "../components/TopBar";

const TABS = ["Segments", "All Contacts", "Watch Groups"];

const EXISTING_SEGMENTS = [
  { id: 1, name: "Urban Youth", count: 5420, date: "Sep 10, 2025", status: "Active" },
  { id: 2, name: "General Public", count: 8650, date: "Sep 14, 2025", status: "Active" },
  { id: 3, name: "Students", count: 4120, date: "Sep 8, 2025", status: "Active" },
  { id: 4, name: "Healthcare Workers", count: 1230, date: "Sep 12, 2025", status: "Active" },
  { id: 5, name: "Rural Communities", count: 6391, date: "Sep 07, 2025", status: "Active" },
  { id: 6, name: "RuralCommunities", count: 4503, date: "Sep 05, 2025", status: "Draft" },
];

const CONTACTS = [
  { id: 1, name: "Ravi Kumar", email: "ravi.kumar@example.com", phone: "9876543210", location: "Bengaluru", language: "Kannada", status: "Active", segment: "Urban Youth" },
  { id: 2, name: "Priya Sharma", email: "priya.sharma@example.com", phone: "9876543211", location: "Chennai", language: "Tamil", status: "Active", segment: "Healthcare Workers" },
  { id: 3, name: "Anand Patil", email: "anand.patil@example.com", phone: "9876543212", location: "Mysuru", language: "Kannada", status: "Active", segment: "Rural Communities" },
  { id: 4, name: "Sunita Deshmukh", email: "sunita.d@example.com", phone: "9876543213", location: "Mumbai", language: "Marathi", status: "Active", segment: "Healthcare Workers" },
  { id: 5, name: "Karthik Reddy", email: "karthik.r@example.com", phone: "9876543214", location: "Hyderabad", language: "Telugu", status: "Active", segment: "Students" },
];

export default function Audience() {
  const [activeTab, setActiveTab] = useState("Segments");
  const [search, setSearch] = useState("");
  const [segName, setSegName] = useState("");
  const [segDesc, setSegDesc] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [language, setLanguage] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [occupation, setOccupation] = useState("");

  const filteredSegments = EXISTING_SEGMENTS.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = CONTACTS.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} />
          Add Audience
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-slate-800">Audience Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your audience segments and contacts.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
                activeTab === tab ? "tab-active" : "tab-inactive"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Segments" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
            {/* Segment List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search segments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus"
                />
              </div>

              <h3 className="text-sm font-semibold text-slate-700">Audience Segments</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Segment Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Count</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSegments.map((seg) => (
                      <tr key={seg.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 cursor-pointer transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-blue-500" />
                            <span className="font-medium text-slate-800">{seg.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{seg.count.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{seg.date}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            seg.status === "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {seg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Segment Form */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Create Segment</h3>
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Segment Name</label>
                  <input
                    type="text"
                    value={segName}
                    onChange={(e) => setSegName(e.target.value)}
                    placeholder="e.g. Young Adults"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm input-focus"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Description</label>
                  <textarea
                    value={segDesc}
                    onChange={(e) => setSegDesc(e.target.value)}
                    placeholder="Describe this segment..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm input-focus resize-none"
                  />
                </div>

                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider pt-2">Filters</h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin size={10} /> State</label>
                    <select value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none">
                      <option value="">Select...</option>
                      <option>Karnataka</option>
                      <option>Tamil Nadu</option>
                      <option>Maharashtra</option>
                      <option>Delhi</option>
                      <option>Telangana</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin size={10} /> District</label>
                    <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none">
                      <option value="">Select...</option>
                      <option>Bengaluru Urban</option>
                      <option>Mysuru</option>
                      <option>Chennai</option>
                      <option>Mumbai City</option>
                      <option>Hyderabad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Globe size={10} /> Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none">
                      <option value="">Select...</option>
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Kannada</option>
                      <option>Tamil</option>
                      <option>Telugu</option>
                      <option>Marathi</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={10} /> Age Group</label>
                    <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none">
                      <option value="">Select...</option>
                      <option>18-25</option>
                      <option>26-35</option>
                      <option>36-50</option>
                      <option>50+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Briefcase size={10} /> Occupation</label>
                    <select value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white input-focus appearance-none">
                      <option value="">Select...</option>
                      <option>Teacher / Educator</option>
                      <option>Healthcare Worker</option>
                      <option>Farmer / Agriculturalist</option>
                      <option>Government Official</option>
                      <option>Student</option>
                      <option>Citizen / General Public</option>
                    </select>
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Save size={14} />
                  Save Segment
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "All Contacts" && (
          <div className="animate-fade-in space-y-4">
            <div className="relative max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white input-focus"
              />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Language</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Segment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{c.email}</td>
                      <td className="px-4 py-3 text-slate-600">{c.location}</td>
                      <td className="px-4 py-3 text-slate-600">{c.language}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{c.segment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Watch Groups" && (
          <div className="animate-fade-in flex items-center justify-center py-16">
            <div className="text-center">
              <Users size={40} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-600">No Watch Groups yet</h3>
              <p className="text-xs text-slate-400 mt-1">Create watch groups to monitor specific audience segments.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
