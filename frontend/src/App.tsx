import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CampaignPipeline from "./pages/CampaignPipeline";
import CreateCampaign from "./pages/CreateCampaign";
import Audience from "./pages/Audience";
import ContentTemplates from "./pages/ContentTemplates";
import Channels from "./pages/Channels";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AIContentGenerator from "./pages/AIContentGenerator";

export default function App() {
  return (
    <BrowserRouter>
      <AppSettingsProvider>
        <ToastProvider>
          <div className="flex h-screen bg-[#F8FAFC]">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/campaigns/create" element={<CreateCampaign />} />
                <Route path="/campaigns/:id" element={<CampaignPipeline />} />
                <Route path="/audience" element={<Audience />} />
                <Route path="/content-templates" element={<ContentTemplates />} />
                <Route path="/channels" element={<Channels />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/ai-generator" element={<AIContentGenerator />} />
              </Routes>
            </main>
          </div>
        </ToastProvider>
      </AppSettingsProvider>
    </BrowserRouter>
  );
}
