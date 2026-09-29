import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CloudLightning,
  CloudRain,
  Wind,
  CloudSun,
  AlertTriangle,
  Megaphone,
  Sparkles,
  ExternalLink,
  Search,
  RefreshCw,
  MapPin,
  ShieldAlert,
  X,
  Languages,
  Activity,
  Droplets,
  Radio,
} from "lucide-react";
import TopBar from "../components/TopBar";
import { getCrisisNews, getWeatherAlerts } from "../lib/api";
import type { CrisisNewsItem, CrisisWeatherAlert } from "../types";
import { useAppSettings } from "../context/AppSettingsContext";

type MapOverlay = "rain" | "wind" | "clouds" | "alerts";

export default function CrisisMonitor() {
  const navigate = useNavigate();
  const { generalSettings } = useAppSettings();
  const isDark = generalSettings.darkMode;

  const [news, setNews] = useState<CrisisNewsItem[]>([]);
  const [alerts, setAlerts] = useState<CrisisWeatherAlert[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedOverlay, setSelectedOverlay] = useState<MapOverlay>("rain");
  const [activeAlert, setActiveAlert] = useState<CrisisWeatherAlert | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingNews(true);
    setLoadingAlerts(true);
    try {
      const [newsData, alertsData] = await Promise.all([
        getCrisisNews(),
        getWeatherAlerts(),
      ]);
      setNews(newsData);
      setAlerts(alertsData);
      if (alertsData.length > 0 && !activeAlert) {
        setActiveAlert(alertsData[0]);
      }
    } catch (err) {
      console.error("Error loading crisis monitor data:", err);
    } finally {
      setLoadingNews(false);
      setLoadingAlerts(false);
    }
  };

  // Filtered news items
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.region.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "ALL" ||
        (selectedCategory === "FLOOD" &&
          (item.category.toLowerCase().includes("flood") || item.category.toLowerCase().includes("rain"))) ||
        (selectedCategory === "CYCLONE" &&
          (item.category.toLowerCase().includes("cyclone") || item.category.toLowerCase().includes("storm"))) ||
        (selectedCategory === "CRITICAL" && item.severity === "CRITICAL");

      return matchesSearch && matchesCat;
    });
  }, [news, searchQuery, selectedCategory]);

  // Direct trigger handler: Navigate to Create Campaign
  const handleLaunchCampaign = (
    title: string,
    description: string,
    region: string,
    language: string,
    severity: string
  ) => {
    navigate("/campaigns/create", {
      state: {
        name: title.length > 70 ? title.substring(0, 70) + "..." : title,
        description: `Emergency alert for ${region}: ${description}. Recommended broadcast in ${language}.`,
        priority: severity === "CRITICAL" ? "CRITICAL" : "HIGH",
        campaignTypeId: 2, // Emergency Alert
        objective: `Immediate citizen disaster advisory for ${region}`,
        contentBody: `URGENT ALERT for ${region}: ${description}. Stay tuned to local disaster management instructions.`,
        contentSubject: `EMERGENCY ALERT: ${title.substring(0, 50)}`,
      },
    });
  };

  // Direct trigger handler: Navigate to AI Content Generator
  const handleLaunchAIGenerator = (
    title: string,
    region: string,
    language: string
  ) => {
    navigate("/ai-generator", {
      state: {
        topic: `Emergency public advisory regarding ${title} in ${region}. Include evacuation, safety guidelines, and helpline numbers.`,
        tone: "Urgent",
        language: language || "Hindi",
        channel: "SMS",
        maxChars: 300,
      },
    });
  };

  // Map embed URL generator
  const getWindyUrl = () => {
    const overlayParam = selectedOverlay === "alerts" ? "rain" : selectedOverlay;
    return `https://embed.windy.com/embed.html?lat=21.5&lon=79.5&detailLat=21.5&detailLon=79.5&width=750&height=520&zoom=5&level=surface&overlay=${overlayParam}&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-5 rounded-2xl text-white shadow-md animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                Live Situational Awareness
              </span>
              <span className="text-xs text-white/90">India Meteorological & Disaster Watch</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Crisis & Weather Monitor
            </h1>
            <p className="text-xs md:text-sm text-white/95 mt-1 max-w-2xl leading-relaxed">
              Track live weather radar, cyclones, floods, and national news feeds. Launch 1-click multilingual emergency broadcasts in local Indian languages.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={fetchData}
              disabled={loadingNews || loadingAlerts}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition-all backdrop-blur-md shadow-sm"
            >
              <RefreshCw
                size={13}
                className={loadingNews || loadingAlerts ? "animate-spin text-white" : ""}
              />
              <span>Refresh Feeds</span>
            </button>
            <button
              onClick={() =>
                handleLaunchCampaign(
                  "High Alert Disaster Advisory",
                  "Rapid mass broadcast triggered from Crisis Monitor",
                  "Multiple Regions",
                  "Hindi",
                  "CRITICAL"
                )
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm"
            >
              <Megaphone size={14} className="text-blue-600" />
              <span>Create Alert</span>
            </button>
          </div>
        </div>

        {/* Live Weather Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-3.5 rounded-xl border transition-all ${isDark ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-black"}`}>Red Alert States</span>
              <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
                <ShieldAlert size={14} />
              </span>
            </div>
            <p className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-black"}`}>2 Regions</p>
            <p className="text-[11px] text-red-600 font-bold">Maharashtra & Assam</p>
          </div>

          <div className={`p-3.5 rounded-xl border transition-all ${isDark ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-black"}`}>Max 24h Rainfall</span>
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <Droplets size={14} />
              </span>
            </div>
            <p className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-black"}`}>162.4 mm</p>
            <p className="text-[11px] text-blue-600 font-bold">Mumbai & Coastal Konkan</p>
          </div>

          <div className={`p-3.5 rounded-xl border transition-all ${isDark ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-black"}`}>Active Cyclone / Gale</span>
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Wind size={14} />
              </span>
            </div>
            <p className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-black"}`}>68 km/h</p>
            <p className="text-[11px] text-amber-700 font-bold">Bay of Bengal / Odisha Coast</p>
          </div>

          <div className={`p-3.5 rounded-xl border transition-all ${isDark ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-black"}`}>Monitored Feeds</span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Radio size={14} />
              </span>
            </div>
            <p className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-black"}`}>IMD + PIB</p>
            <p className="text-[11px] text-emerald-700 font-bold">Live sync active</p>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ──────────────────────────────────────────
              LEFT COLUMN: Live News & RSS Feed (5 cols)
             ────────────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col space-y-3.5">
            {/* News Filter & Search Header */}
            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-300 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-blue-600" />
                  <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                    Latest Disaster News & Bulletins
                  </h2>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isDark ? "bg-blue-950/50 text-blue-300" : "bg-blue-100 text-blue-800"}`}>
                  {filteredNews.length} Reports
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search
                  size={14}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by state, city, keyword (e.g. Mumbai, Flood)..."
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                    isDark
                      ? "bg-slate-900 border-slate-700 text-white placeholder-slate-400"
                      : "bg-slate-50 border-slate-300 text-black placeholder-slate-600"
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {[
                  { id: "ALL", label: "All" },
                  { id: "FLOOD", label: "🌧️ Flood & Rain" },
                  { id: "CYCLONE", label: "🌪️ Cyclone & Wind" },
                  { id: "CRITICAL", label: "⚠️ Red Alerts" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : isDark
                        ? "bg-slate-900 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-100 text-black hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* News Cards List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {loadingNews ? (
                <div className="py-16 text-center">
                  <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                  <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-black"}`}>Fetching live Indian disaster bulletins...</p>
                </div>
              ) : filteredNews.length === 0 ? (
                <div className={`p-8 text-center rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-300"}`}>
                  <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-black"}`}>No news articles match your filter criteria.</p>
                </div>
              ) : (
                filteredNews.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      isDark
                        ? "bg-slate-800/80 border-slate-700/80 hover:border-slate-600"
                        : "bg-white border-slate-300 hover:border-blue-400 shadow-xs"
                    }`}
                  >
                    {/* Severity & Source Bar */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                            item.severity === "CRITICAL"
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : item.severity === "WARNING"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-blue-100 text-blue-800 border border-blue-300"
                          }`}
                        >
                          {item.severity}
                        </span>
                        <span className={`text-[10px] font-bold ${isDark ? "text-slate-300" : "text-black"}`}>
                          {item.source}
                        </span>
                      </div>
                      <span className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-700"} whitespace-nowrap`}>
                        {item.pub_date}
                      </span>
                    </div>

                    {/* News Title */}
                    <h3 className={`text-xs font-bold leading-snug mb-1.5 ${isDark ? "text-white" : "text-black"}`}>
                      {item.title}
                    </h3>

                    {/* Summary */}
                    <p className={`text-[11px] leading-relaxed line-clamp-3 mb-3 font-normal ${isDark ? "text-slate-200" : "text-black"}`}>
                      {item.summary}
                    </p>

                    {/* Region & Language Badge */}
                    <div className="flex items-center justify-between text-[11px] border-t pt-2.5 mb-3 border-slate-200 dark:border-slate-700/60">
                      <div className={`flex items-center gap-1 font-bold ${isDark ? "text-slate-200" : "text-black"}`}>
                        <MapPin size={11} className="text-blue-600" />
                        <span>{item.region}</span>
                      </div>
                      <div className={`flex items-center gap-1 font-bold ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
                        <Languages size={11} />
                        <span>Lang: {item.suggested_language}</span>
                      </div>
                    </div>

                    {/* Action Bar: Direct Campaign Generation */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleLaunchCampaign(
                            item.title,
                            item.summary,
                            item.region,
                            item.suggested_language,
                            item.severity
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        <Megaphone size={12} />
                        <span>Generate Campaign</span>
                      </button>

                      <button
                        onClick={() =>
                          handleLaunchAIGenerator(
                            item.title,
                            item.region,
                            item.suggested_language
                          )
                        }
                        title="Generate multilingual broadcast with AI"
                        className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors ${
                          isDark
                            ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-indigo-300"
                            : "border-slate-300 bg-slate-50 hover:bg-slate-100 text-indigo-700"
                        }`}
                      >
                        <Sparkles size={12} />
                        <span>AI Broadcast</span>
                      </button>

                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        title="Open original bulletin"
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-700 hover:text-black"}`}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ──────────────────────────────────────────
              RIGHT COLUMN: India Weather & Disaster Map (7 cols)
             ────────────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col space-y-3.5">
            {/* Map Header & View Controls */}
            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-300 shadow-sm"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CloudLightning size={16} className="text-indigo-600" />
                  <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                    India Live Weather & Severe Event Radar
                  </h2>
                </div>

                {/* Overlay Switcher Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg text-xs">
                  <button
                    onClick={() => setSelectedOverlay("rain")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                      selectedOverlay === "rain"
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                        : isDark
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-black hover:text-blue-600"
                    }`}
                  >
                    <CloudRain size={12} />
                    <span>Rain Radar</span>
                  </button>
                  <button
                    onClick={() => setSelectedOverlay("wind")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                      selectedOverlay === "wind"
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                        : isDark
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-black hover:text-blue-600"
                    }`}
                  >
                    <Wind size={12} />
                    <span>Wind & Cyclones</span>
                  </button>
                  <button
                    onClick={() => setSelectedOverlay("clouds")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                      selectedOverlay === "clouds"
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                        : isDark
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-black hover:text-blue-600"
                    }`}
                  >
                    <CloudSun size={12} />
                    <span>Satellite</span>
                  </button>
                  <button
                    onClick={() => setSelectedOverlay("alerts")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                      selectedOverlay === "alerts"
                        ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-xs"
                        : isDark
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-black hover:text-red-600"
                    }`}
                  >
                    <AlertTriangle size={12} />
                    <span>Hotspots</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Embedded Live Map Display */}
            <div className={`relative rounded-xl border overflow-hidden shadow-sm ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}`}>
              {/* Map Iframe */}
              <iframe
                title="India Weather Radar & Wind Map"
                src={getWindyUrl()}
                className="w-full h-[400px] md:h-[450px] border-0"
                loading="lazy"
              />

              {/* Overlay Badge for Current Mode */}
              <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Live Doppler Radar:{" "}
                  {selectedOverlay === "rain"
                    ? "Precipitation & Flash Floods"
                    : selectedOverlay === "wind"
                    ? "Wind Velocity & Cyclone Stream"
                    : selectedOverlay === "clouds"
                    ? "Infrared Cloud Density"
                    : "State Disaster Hotspots"}
                </span>
              </div>
            </div>

            {/* Regional Hotspot Selector & Quick Action Panel */}
            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-300 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-500" />
                  <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>
                    Regional Alert Hotspots (Click to Target)
                  </h3>
                </div>
                <span className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-700"}`}>Select to trigger localized campaign</span>
              </div>

              {/* Horizontal Scroll of State Alert Pins */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setActiveAlert(alert)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      activeAlert?.id === alert.id
                        ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/60 dark:bg-blue-950/40"
                        : isDark
                        ? "bg-slate-900/60 border-slate-700 hover:border-slate-600"
                        : "bg-slate-50 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-xs truncate ${isDark ? "text-white" : "text-black"}`}>
                        {alert.region}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                          alert.alert_level === "RED"
                            ? "bg-red-500 text-white"
                            : alert.alert_level === "ORANGE"
                            ? "bg-amber-500 text-white"
                            : alert.alert_level === "YELLOW"
                            ? "bg-yellow-400 text-black"
                            : "bg-emerald-500 text-white"
                        }`}
                      >
                        {alert.alert_level}
                      </span>
                    </div>

                    <p className={`text-[11px] line-clamp-1 mb-2 font-medium ${isDark ? "text-slate-300" : "text-black"}`}>
                      {alert.condition}
                    </p>

                    <div className={`flex items-center justify-between text-[10px] font-bold ${isDark ? "text-slate-200" : "text-black"}`}>
                      <span>🌧️ {alert.rainfall_mm} mm</span>
                      <span>💨 {alert.wind_kmh} km/h</span>
                      <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>{alert.primary_language}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Region Detailed Action Card */}
              {activeAlert && (
                <div className={`mt-3.5 p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isDark
                    ? "bg-slate-900 border-slate-700"
                    : "bg-blue-50/80 border-blue-300"
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-black text-xs ${isDark ? "text-white" : "text-black"}`}>
                        📍 {activeAlert.region} ({activeAlert.state})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-100 text-red-800 border border-red-300">
                        Flood Risk: {activeAlert.flood_risk_pct}%
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                        Broadcast: {activeAlert.primary_language}
                      </span>
                    </div>
                    <p className={`text-[11px] max-w-xl font-medium leading-relaxed ${isDark ? "text-slate-200" : "text-black"}`}>
                      {activeAlert.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        handleLaunchCampaign(
                          `Urgent Weather Warning: ${activeAlert.region}`,
                          activeAlert.description,
                          activeAlert.state,
                          activeAlert.primary_language,
                          activeAlert.alert_level === "RED" ? "CRITICAL" : "HIGH"
                        )
                      }
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Megaphone size={13} />
                      <span>Launch Campaign</span>
                    </button>
                    <button
                      onClick={() =>
                        handleLaunchAIGenerator(
                          `Severe weather condition in ${activeAlert.region}: ${activeAlert.condition}`,
                          activeAlert.state,
                          activeAlert.primary_language
                        )
                      }
                      className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-1 transition-colors ${
                        isDark
                          ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                          : "border-slate-300 bg-white hover:bg-slate-50 text-black shadow-xs"
                      }`}
                    >
                      <Sparkles size={13} className="text-indigo-600" />
                      <span>AI Advisory</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
