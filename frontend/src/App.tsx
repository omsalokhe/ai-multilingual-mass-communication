import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAppSettings } from "./context/AppSettingsContext";
import Login from "./pages/Login";
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

function DashboardLayout() {
  const { generalSettings } = useAppSettings();
  const isDark = generalSettings.darkMode;

  return (
    <div className={`flex h-screen transition-colors duration-300 ${isDark ? "bg-[#0f172a]" : "bg-[#F8FAFC]"}`}>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppSettingsProvider>
            <ToastProvider>
              <Routes>
                {/* Public route */}
                <Route path="/login" element={<Login />} />

                {/* Protected dashboard routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </ToastProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
