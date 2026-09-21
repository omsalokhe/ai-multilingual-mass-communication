import { useState } from "react";
import { Download, Calendar } from "lucide-react";
import TopBar from "../components/TopBar";
import DataTable from "../components/DataTable";

const REPORT_TABS = ["Campaign Reports", "Audience Reports", "Engagement Reports"];

const CAMPAIGN_REPORTS = [
  { id: 1, name: "Health Awareness Drive", reach: "15,400", delivered: "15,200", opened: "12,160", clicks: "4,560", engagement: "82%" },
  { id: 2, name: "Education Policy Update", reach: "6,700", delivered: "6,500", opened: "4,550", clicks: "1,300", engagement: "68%" },
  { id: 3, name: "Emergency Flood Alert", reach: "4,500", delivered: "4,350", opened: "4,100", clicks: "3,045", engagement: "91%" },
  { id: 4, name: "Employee Onboarding", reach: "4,200", delivered: "4,050", opened: "3,240", clicks: "1,215", engagement: "76%" },
  { id: 5, name: "Vaccination Awareness", reach: "1,800", delivered: "1,750", opened: "1,225", clicks: "525", engagement: "70%" },
];

const AUDIENCE_REPORTS = [
  { id: 1, name: "Urban Youth", totalRecipients: "5,420", activeRate: "87%", avgEngagement: "79%", topChannel: "WhatsApp", topLanguage: "English" },
  { id: 2, name: "Rural Communities", totalRecipients: "6,391", activeRate: "72%", avgEngagement: "68%", topChannel: "SMS", topLanguage: "Hindi" },
  { id: 3, name: "Students", totalRecipients: "4,120", activeRate: "91%", avgEngagement: "85%", topChannel: "Email", topLanguage: "English" },
  { id: 4, name: "Healthcare Workers", totalRecipients: "1,230", activeRate: "95%", avgEngagement: "88%", topChannel: "Email", topLanguage: "English" },
];

const ENGAGEMENT_REPORTS = [
  { id: 1, name: "Email Campaign Q3", sent: "18,400", delivered: "18,100", opened: "12,670", clicked: "4,525", bounceRate: "1.6%", unsubRate: "0.3%" },
  { id: 2, name: "SMS Blast - Sep", sent: "12,500", delivered: "12,250", opened: "N/A", clicked: "3,675", bounceRate: "2.0%", unsubRate: "0.5%" },
  { id: 3, name: "WhatsApp Outreach", sent: "8,300", delivered: "8,100", opened: "7,290", clicked: "5,670", bounceRate: "2.4%", unsubRate: "0.2%" },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("Campaign Reports");
  const [startDate, setStartDate] = useState("2025-09-01");
  const [endDate, setEndDate] = useState("2025-09-16");

  const campaignColumns = [
    { key: "name", label: "Campaign Name", sortable: true, render: (row: Record<string, unknown>) => <span className="font-medium text-slate-800">{String(row.name)}</span> },
    { key: "reach", label: "Reach", sortable: true },
    { key: "delivered", label: "Delivered", sortable: true },
    { key: "opened", label: "Opened", sortable: true },
    { key: "clicks", label: "Clicks", sortable: true },
    { key: "engagement", label: "Engagement", render: (row: Record<string, unknown>) => <span className="font-semibold text-blue-600">{String(row.engagement)}</span> },
  ];

  const audienceColumns = [
    { key: "name", label: "Segment Name", sortable: true, render: (row: Record<string, unknown>) => <span className="font-medium text-slate-800">{String(row.name)}</span> },
    { key: "totalRecipients", label: "Total Recipients", sortable: true },
    { key: "activeRate", label: "Active Rate" },
    { key: "avgEngagement", label: "Avg Engagement", render: (row: Record<string, unknown>) => <span className="font-semibold text-blue-600">{String(row.avgEngagement)}</span> },
    { key: "topChannel", label: "Top Channel" },
    { key: "topLanguage", label: "Top Language" },
  ];

  const engagementColumns = [
    { key: "name", label: "Campaign", sortable: true, render: (row: Record<string, unknown>) => <span className="font-medium text-slate-800">{String(row.name)}</span> },
    { key: "sent", label: "Sent", sortable: true },
    { key: "delivered", label: "Delivered", sortable: true },
    { key: "opened", label: "Opened" },
    { key: "clicked", label: "Clicked" },
    { key: "bounceRate", label: "Bounce Rate" },
    { key: "unsubRate", label: "Unsub Rate" },
  ];

  const handleExport = () => {
    // Mock export
    const blob = new Blob(["Campaign,Reach,Delivered,Opened,Clicks,Engagement\n" + CAMPAIGN_REPORTS.map(r => `${r.name},${r.reach},${r.delivered},${r.opened},${r.clicks},${r.engagement}`).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaign_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download size={16} />
          Export
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Reports</h1>
            <p className="text-sm text-slate-500 mt-1">View detailed reports of your campaigns and engagement.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm text-slate-600 border-none outline-none bg-transparent w-28"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm text-slate-600 border-none outline-none bg-transparent w-28"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-200">
          {REPORT_TABS.map((tab) => (
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

        {/* Tables */}
        <div className="animate-fade-in">
          {activeTab === "Campaign Reports" && (
            <DataTable
              columns={campaignColumns}
              data={CAMPAIGN_REPORTS as unknown as Record<string, unknown>[]}
              pageSize={5}
            />
          )}
          {activeTab === "Audience Reports" && (
            <DataTable
              columns={audienceColumns}
              data={AUDIENCE_REPORTS as unknown as Record<string, unknown>[]}
              pageSize={5}
            />
          )}
          {activeTab === "Engagement Reports" && (
            <DataTable
              columns={engagementColumns}
              data={ENGAGEMENT_REPORTS as unknown as Record<string, unknown>[]}
              pageSize={5}
            />
          )}
        </div>
      </div>
    </div>
  );
}
