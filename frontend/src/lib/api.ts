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

// ── Campaigns ─────────────────────────────────
export async function getCampaigns(): Promise<CampaignBrief[]> {
  const { data } = await client.get<CampaignBrief[]>("/campaigns");
  return data;
}

export async function getCampaign(id: number): Promise<CampaignDetail> {
  const { data } = await client.get<CampaignDetail>(`/campaigns/${id}`);
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
