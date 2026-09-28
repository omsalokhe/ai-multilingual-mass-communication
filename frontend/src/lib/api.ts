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
} from "../types";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

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
