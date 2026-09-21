// ──────────────────────────────────────────────
// Campaign types
// ──────────────────────────────────────────────

export interface CampaignBrief {
  id: number;
  campaign_code: string;
  name: string;
  objective: string;
  priority: string;
  status: string;
  campaign_type: string;
  target_audiences: string[];
}

export interface CampaignContent {
  id: number;
  language_id: number;
  language: string;
  channel: string;
  subject: string;
  body: string;
  ai_generated: boolean;
  version: number;
  status: string;
  created_at: string;
}

export interface CampaignDetail {
  id: number;
  campaign_code: string;
  name: string;
  description: string;
  objective: string;
  campaign_type: string;
  priority: string;
  status: string;
  target_audiences: string[];
  contents: CampaignContent[];
}

// ──────────────────────────────────────────────
// Step 1 — Generate Content
// ──────────────────────────────────────────────

export interface GenerateContentRequest {
  tone?: string;
  channel?: string;
  max_characters?: number;
  provider?: string;
}

export interface GenerateContentResponse {
  success: boolean;
  content_id: number;
  campaign_id: number;
  language_id: number;
  language_code: string;
  channel: string;
  subject: string;
  title: string;
  body: string;
  character_count: number;
  ai_generated: boolean;
  version: number;
  status: string;
  provider_used: string;
  model_used: string;
  prompt_used: string;
  created_at: string;
}

// ──────────────────────────────────────────────
// Step 2 — Translate
// ──────────────────────────────────────────────

export interface TranslateRequest {
  target_language_codes?: string[];
  channel?: string;
  provider?: string;
  source_language_code?: string;
}

export interface TranslationItem {
  content_id: number;
  language_id: number;
  language_code: string;
  language_name: string;
  channel: string;
  subject: string;
  title: string;
  body: string;
  character_count: number;
  ai_generated: boolean;
  version: number;
  status: string;
  provider_used: string;
  created_at: string;
}

export interface TranslateResponse {
  success: boolean;
  campaign_id: number;
  source_language_code: string;
  source_text: string;
  channel: string;
  total_translated: number;
  translations: TranslationItem[];
}

// ──────────────────────────────────────────────
// Step 3 — Personalize
// ──────────────────────────────────────────────

export interface PersonalizeRequest {
  segment_id?: number;
  recipient_id?: number;
  template_id?: number;
  custom_variables?: Record<string, string>;
  language_id?: number;
}

export interface PersonalizedContent {
  content_id: number;
  language_id: number;
  language_code: string;
  channel: string;
  subject: string;
  body: string;
  character_count: number;
  version: number;
  variables_applied: Record<string, string>;
  updated_at: string;
}

export interface PersonalizeResponse {
  success: boolean;
  campaign_id: number;
  segment_id: number;
  segment_name: string;
  recipients_analyzed: number;
  phrasing_selected: Record<string, string>;
  contents_personalized: PersonalizedContent[];
  total_updated: number;
}

// ──────────────────────────────────────────────
// Step 4 — Sentiment Analysis
// ──────────────────────────────────────────────

export interface SentimentRequest {
  provider?: string;
  include_tone_suggestions?: boolean;
  language_id?: number;
}

export interface SentimentReport {
  content_id: number;
  language_id: number;
  language_code: string;
  language_name: string;
  channel: string;
  body_preview: string;
  sentiment: string;
  sentiment_scores: Record<string, number>;
  tone: string;
  tone_suggestions: string[];
  clarity_score: number;
  overall_score: number;
  status: string;
  report_id: number;
}

export interface SentimentResponse {
  success: boolean;
  campaign_id: number;
  total_analyzed: number;
  reports: SentimentReport[];
  summary: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// Step 5 — Quality Check
// ──────────────────────────────────────────────

export interface QualityCheckRequest {
  provider?: string;
  include_factual_check?: boolean;
  language_id?: number;
  languagetool_url?: string;
}

export interface QualityReport {
  content_id: number;
  language_id: number;
  language_code: string;
  language_name: string;
  channel: string;
  body_preview: string;
  grammar_ok: boolean;
  grammar_error_count: number;
  grammar_issues: Record<string, unknown>[];
  compliance_ok: boolean;
  compliance_violations: Record<string, unknown>[];
  factual_ok: boolean;
  factual_risk_level: string;
  factual_issues: unknown[];
  overall_score: number;
  status: string;
  report_id: number;
}

export interface QualityCheckResponse {
  success: boolean;
  campaign_id: number;
  total_checked: number;
  reports: QualityReport[];
  summary: Record<string, unknown>;
}
