import axios from "axios";
import type {
  CampaignBrief,
  CampaignDetail,
  GenerateContentRequest,
  GenerateContentResponse,
  TranslateRequest,
  TranslateResponse,
  PersonalizeRequest,
  PersonalizeResponse,
  SentimentRequest,
  SentimentResponse,
  QualityCheckRequest,
  QualityCheckResponse,
  AIGenerateRequest,
  AIGenerateResponse,
  DashboardStats,
  CreateCampaignRequest,
  CreateCampaignResponse,
  SegmentBrief,
  RecipientBrief,
  ChannelStatusResponse,
  DispatchHistoryItem,
  SendTestRequest,
  SendTestResponse,
  DispatchCampaignRequest,
  DispatchCampaignResponse,
  AnalyticsOverview,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  CrisisNewsItem,
  CrisisWeatherAlert,
} from "../types";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer token to all requests if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("mass_comm_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-handle 401 Unauthorized responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/register");
      if (!isAuthRoute) {
        localStorage.removeItem("mass_comm_token");
        localStorage.removeItem("mass_comm_user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Health ────────────────────────────────────
export async function checkHealth(): Promise<{ status: string }> {
  const { data } = await client.get<{ status: string }>("/health");
  return data;
}

// ── Dashboard ─────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await client.get<DashboardStats>("/dashboard/stats");
  return data;
}

// ── Campaigns ─────────────────────────────────
export async function getCampaigns(): Promise<CampaignBrief[]> {
  const { data } = await client.get<CampaignBrief[]>("/campaigns");
  return data;
}

export async function getCampaign(id: number): Promise<CampaignDetail> {
  const { data } = await client.get<CampaignDetail>(`/campaigns/${id}`);
  return data;
}

export async function createCampaign(
  body: CreateCampaignRequest
): Promise<CreateCampaignResponse> {
  const { data } = await client.post<CreateCampaignResponse>(
    "/campaigns",
    body
  );
  return data;
}

export async function deleteCampaign(
  id: number
): Promise<{ success: boolean; message: string }> {
  const { data } = await client.delete<{ success: boolean; message: string }>(
    `/campaigns/${id}`
  );
  return data;
}

export async function seedSampleData(): Promise<{
  message: string;
  campaign_id: number;
}> {
  const { data } = await client.post<{ message: string; campaign_id: number }>(
    "/campaigns/seed-sample"
  );
  return data;
}

// ── Step 1 — Generate Content ─────────────────
export async function generateContent(
  id: number,
  body: GenerateContentRequest
): Promise<GenerateContentResponse> {
  const { data } = await client.post<GenerateContentResponse>(
    `/campaigns/${id}/generate-content`,
    body
  );
  return data;
}

// ── Step 2 — Translate ────────────────────────
export async function translateContent(
  id: number,
  body: TranslateRequest
): Promise<TranslateResponse> {
  const { data } = await client.post<TranslateResponse>(
    `/campaigns/${id}/translate`,
    body
  );
  return data;
}

// ── Step 3 — Personalize ──────────────────────
export async function personalizeContent(
  id: number,
  body: PersonalizeRequest
): Promise<PersonalizeResponse> {
  const { data } = await client.post<PersonalizeResponse>(
    `/campaigns/${id}/personalize`,
    body
  );
  return data;
}

// ── Step 4 — Sentiment Analysis ───────────────
export async function analyzeSentiment(
  id: number,
  body: SentimentRequest
): Promise<SentimentResponse> {
  const { data } = await client.post<SentimentResponse>(
    `/campaigns/${id}/analyze-sentiment`,
    body
  );
  return data;
}

// ── Step 5 — Quality Check ────────────────────
export async function qualityCheck(
  id: number,
  body: QualityCheckRequest
): Promise<QualityCheckResponse> {
  const { data } = await client.post<QualityCheckResponse>(
    `/campaigns/${id}/quality-check`,
    body
  );
  return data;
}

// ── Standalone AI Generation ──────────────────
export async function aiGenerate(
  body: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const { data } = await client.post<AIGenerateResponse>(
    "/ai/generate",
    body
  );
  return data;
}

// ── Audiences & Segments ──────────────────────
export async function getSegments(): Promise<SegmentBrief[]> {
  const { data } = await client.get<SegmentBrief[]>("/audiences/segments");
  return data;
}

export async function createSegment(body: {
  name: string;
  description?: string;
}): Promise<{ success: boolean; segment_id: number; name: string; message: string }> {
  const { data } = await client.post("/audiences/segments", body);
  return data;
}

// ── Recipients ────────────────────────────────
export async function getRecipients(): Promise<RecipientBrief[]> {
  const { data } = await client.get<RecipientBrief[]>("/recipients");
  return data;
}

// ── Languages ─────────────────────────────────
export async function getLanguages(): Promise<
  { id: number; name: string; code: string; native_name: string }[]
> {
  const { data } = await client.get("/languages");
  return data;
}

// ── Communication Channels & Dispatching ───────
export async function getChannelStatus(): Promise<ChannelStatusResponse> {
  const { data } = await client.get<ChannelStatusResponse>("/channels/status");
  return data;
}

export async function getDispatchHistory(limit = 30): Promise<DispatchHistoryItem[]> {
  const { data } = await client.get<DispatchHistoryItem[]>(`/channels/history?limit=${limit}`);
  return data;
}

export async function sendTestMessage(
  body: SendTestRequest
): Promise<SendTestResponse> {
  const { data } = await client.post<SendTestResponse>("/channels/send-test", body);
  return data;
}

export async function dispatchCampaign(
  body: DispatchCampaignRequest
): Promise<DispatchCampaignResponse> {
  const { data } = await client.post<DispatchCampaignResponse>("/channels/dispatch-campaign", body);
  return data;
}

// ── Analytics ──────────────────────────────────
export async function getAnalytics(days = 7): Promise<AnalyticsOverview> {
  const { data } = await client.get<AnalyticsOverview>(`/analytics/overview?days=${days}`);
  return data;
}

// ── Authentication ────────────────────────────
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await client.get<AuthUser>("/auth/me");
  return data;
}

export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    const { data } = await client.post<{ success: boolean }>("/auth/logout");
    return data;
  } catch {
    return { success: true };
  }
}

// ── Crisis & Weather Monitor ──────────────────
export async function getCrisisNews(): Promise<CrisisNewsItem[]> {
  try {
    const { data } = await client.get<CrisisNewsItem[]>("/crisis/news");
    return data;
  } catch (err) {
    console.warn("Could not reach /crisis/news, using client fallback:", err);
    return [
      {
        id: "fb-1",
        title: "IMD issues Red Alert for Coastal Maharashtra and Mumbai: Extremely Heavy Rainfall Predicted",
        summary: "India Meteorological Department (IMD) has issued a red alert warning of localized flooding, urban waterlogging, and travel disruptions across Mumbai and Thane over the next 24 hours.",
        source: "IMD Weather Bulletin",
        link: "https://mausam.imd.gov.in",
        pub_date: "Just now",
        category: "Heavy Rain",
        severity: "CRITICAL",
        region: "Maharashtra",
        suggested_language: "Marathi",
      },
      {
        id: "fb-2",
        title: "Assam Flood Alert: Brahmaputra River crosses danger mark in 6 districts, SDRF deployed",
        summary: "State Disaster Management Authority has issued evacuation advisories for low-lying riparian villages. Emergency relief camps and medical centers activated across upper Assam.",
        source: "State Disaster Mgmt (ASDMA)",
        link: "https://pib.gov.in",
        pub_date: "1 hour ago",
        category: "Flood",
        severity: "CRITICAL",
        region: "Assam",
        suggested_language: "Assamese",
      },
      {
        id: "fb-3",
        title: "Deep Depression in Bay of Bengal: Coastal Odisha & Andhra Fishermen Advised Not to Venture into Sea",
        summary: "Wind speeds expected to reach 65-75 kmph along Ganjam, Puri, and Visakhapatnam coasts. High tidal waves and coastal rain showers expected over the weekend.",
        source: "NDMA India",
        link: "https://ndma.gov.in",
        pub_date: "2 hours ago",
        category: "Cyclone",
        severity: "WARNING",
        region: "Odisha",
        suggested_language: "Odia",
      },
      {
        id: "fb-4",
        title: "Uttarakhand & Himachal Weather Warning: Cloudburst alert for Chamoli & Mandi hills",
        summary: "District magistrates urge residents near mountain streams to move to higher ground. Border Roads Organisation (BRO) clearing debris on high-altitude transit highways.",
        source: "PIB Disaster Desk",
        link: "https://pib.gov.in",
        pub_date: "3 hours ago",
        category: "Heavy Rain",
        severity: "WARNING",
        region: "Uttarakhand",
        suggested_language: "Hindi",
      },
      {
        id: "fb-5",
        title: "Monsoon Active in Southern Peninsula: Heavy Downpour Forecast for Wayanad & Idukki",
        summary: "District collectors place disaster response teams on high alert following continuous overnight downpours. Landslide warning issued for vulnerable slope settlements.",
        source: "Kerala SDMA",
        link: "https://sdma.kerala.gov.in",
        pub_date: "4 hours ago",
        category: "Flood",
        severity: "WARNING",
        region: "Kerala",
        suggested_language: "Malayalam",
      },
      {
        id: "fb-6",
        title: "Coastal Tamil Nadu & Chennai: Northeast Monsoon Influx triggers localized cloudbursts",
        summary: "Greater Chennai Corporation opens 24x7 control rooms and deploys dewatering pump stations across vulnerable low-lying neighborhoods.",
        source: "The Hindu Weather",
        link: "https://www.thehindu.com",
        pub_date: "5 hours ago",
        category: "Heavy Rain",
        severity: "ADVISORY",
        region: "Tamil Nadu",
        suggested_language: "Tamil",
      },
    ];
  }
}

export async function getWeatherAlerts(): Promise<CrisisWeatherAlert[]> {
  try {
    const { data } = await client.get<CrisisWeatherAlert[]>("/crisis/alerts");
    return data;
  } catch (err) {
    console.warn("Could not reach /crisis/alerts, using client fallback:", err);
    return [
      {
        id: "alert-mum",
        region: "Mumbai & Coastal Konkan",
        state: "Maharashtra",
        lat: 19.0760,
        lon: 72.8777,
        alert_level: "RED",
        condition: "Intense Monsoon Downpour & High Tide",
        rainfall_mm: 162.4,
        wind_kmh: 48.0,
        flood_risk_pct: 88,
        primary_language: "Marathi",
        description: "Red alert in effect. Widespread waterlogging in low-lying suburban wards. Citizen advisory: avoid non-essential transit."
      },
      {
        id: "alert-asm",
        region: "Brahmaputra Valley & Guwahati",
        state: "Assam",
        lat: 26.1445,
        lon: 91.7362,
        alert_level: "RED",
        condition: "Major River Inundation & Bank Erosion",
        rainfall_mm: 135.0,
        wind_kmh: 32.0,
        flood_risk_pct: 92,
        primary_language: "Assamese",
        description: "Water levels above danger mark. SDRF relief battalions operational. High-priority public evacuation alerts required."
      },
      {
        id: "alert-odi",
        region: "Puri & Coastal Ganjam",
        state: "Odisha",
        lat: 19.8135,
        lon: 85.8312,
        alert_level: "ORANGE",
        condition: "Deep Depression & Coastal Gale",
        rainfall_mm: 94.5,
        wind_kmh: 68.0,
        flood_risk_pct: 65,
        primary_language: "Odia",
        description: "Squally weather along shoreline. Port warning signal 3 hoisted. Fishermen strictly barred from sea."
      },
      {
        id: "alert-utt",
        region: "Chamoli & Rudraprayag Hills",
        state: "Uttarakhand",
        lat: 30.2937,
        lon: 79.2974,
        alert_level: "ORANGE",
        condition: "Cloudburst & Landslide Risk",
        rainfall_mm: 82.0,
        wind_kmh: 28.0,
        flood_risk_pct: 72,
        primary_language: "Hindi",
        description: "Flash flood vigilance along Alaknanda river basin. Pilgrims and tourists halted at designated shelters."
      },
      {
        id: "alert-ker",
        region: "Wayanad & Idukki Ghats",
        state: "Kerala",
        lat: 11.6854,
        lon: 76.1320,
        alert_level: "ORANGE",
        condition: "Hill Slope Heavy Downpour",
        rainfall_mm: 112.0,
        wind_kmh: 35.0,
        flood_risk_pct: 78,
        primary_language: "Malayalam",
        description: "Slope stability caution issued. Quarry activities suspended. Local authorities maintaining round-the-clock watch."
      },
      {
        id: "alert-che",
        region: "Chennai & North Coastal TN",
        state: "Tamil Nadu",
        lat: 13.0827,
        lon: 80.2707,
        alert_level: "YELLOW",
        condition: "Intermittent Thunderstorms & Coastal Wind",
        rainfall_mm: 54.0,
        wind_kmh: 42.0,
        flood_risk_pct: 45,
        primary_language: "Tamil",
        description: "Localized water stagnation in vulnerable zones. Civic pump crews deployed across metro arterials."
      },
      {
        id: "alert-del",
        region: "Delhi-NCR Metro Region",
        state: "Delhi",
        lat: 28.6139,
        lon: 77.2090,
        alert_level: "YELLOW",
        condition: "Thunderstorm & Waterlogging Advisory",
        rainfall_mm: 38.5,
        wind_kmh: 36.0,
        flood_risk_pct: 35,
        primary_language: "Hindi",
        description: "Yamuna floodplain watch maintained. Traffic police advisories issued for underpass diversions."
      },
      {
        id: "alert-beng",
        region: "Sundarbans & South 24 Parganas",
        state: "West Bengal",
        lat: 22.5726,
        lon: 88.3639,
        alert_level: "YELLOW",
        condition: "Tidal Surge & Coastal Influx",
        rainfall_mm: 62.0,
        wind_kmh: 45.0,
        flood_risk_pct: 52,
        primary_language: "Bengali",
        description: "Embankment monitoring active in coastal delta blocks. Relief supplies pre-positioned."
      },
      {
        id: "alert-guj",
        region: "Saurashtra & Kutch Coast",
        state: "Gujarat",
        lat: 22.3039,
        lon: 70.8022,
        alert_level: "GREEN",
        condition: "Scattered Light Rain & Clear Skies",
        rainfall_mm: 12.0,
        wind_kmh: 22.0,
        flood_risk_pct: 15,
        primary_language: "Gujarati",
        description: "Normal meteorological conditions. Port operations and shipping activities running smoothly."
      },
    ];
  }
}
