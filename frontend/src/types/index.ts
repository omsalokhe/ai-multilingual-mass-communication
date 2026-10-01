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
// Create Campaign
// ──────────────────────────────────────────────

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  campaign_type_id: number;
  objective?: string;
  priority?: string;
  segment_ids?: number[];
  channel?: string;
  content_body?: string;
  content_subject?: string;
}

export interface CreateCampaignResponse {
  success: boolean;
  campaign_id: number;
  campaign_code: string;
  name: string;
  status: string;
  message: string;
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

// ──────────────────────────────────────────────
// Standalone AI Generation
// ──────────────────────────────────────────────

export interface AIGenerateRequest {
  topic: string;
  tone?: string;
  channel?: string;
  language?: string;
  max_characters?: number;
  guidance?: string;
  provider?: string;
}

export interface AIGenerateResponse {
  success: boolean;
  generated_text: string;
  language: string;
  provider_used: string;
  model_used: string;
  character_count: number;
  was_translated: boolean;
  original_english_text?: string;
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

export interface DashboardStats {
  total_campaigns: number;
  total_recipients: number;
  total_segments: number;
  total_contents: number;
  total_languages: number;
  campaigns_by_status: Record<string, number>;
  campaigns_by_priority: Record<string, number>;
  recent_campaigns: {
    id: number;
    name: string;
    campaign_code: string;
    status: string;
    priority: string;
    campaign_type: string;
    target_audiences: string[];
    content_count: number;
    created_at: string;
  }[];
  audience_segments: {
    id: number;
    name: string;
    description: string;
    member_count: number;
    status: string;
  }[];
  languages: {
    id: number;
    name: string;
    code: string;
    native_name: string;
  }[];
}

// ──────────────────────────────────────────────
// Audiences & Recipients
// ──────────────────────────────────────────────

export interface SegmentBrief {
  id: number;
  name: string;
  description?: string;
  member_count: number;
  status: string;
  created_at?: string;
}

export interface RecipientBrief {
  id: number;
  first_name: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  city?: string;
  occupation?: string;
  organization?: string;
  preferred_language?: string;
  status: string;
}

// ──────────────────────────────────────────────
// Channels & Dispatching
// ──────────────────────────────────────────────

export interface ChannelStatusItem {
  name: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  status: string;
  protocol: string;
  success_rate: string;
  dispatched_count: number;
  description: string;
}

export interface ChannelStatusResponse {
  channels: ChannelStatusItem[];
  total_dispatched: number;
}

export interface DispatchHistoryItem {
  id: number;
  campaign_id?: number | null;
  campaign_name: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  recipient_name: string;
  recipient_contact: string;
  language: string;
  subject?: string;
  message_preview: string;
  status: string;
  gateway_message_id?: string;
  details?: string;
  sent_at: string;
}

export interface SendTestRequest {
  channel: string;
  recipient: string;
  subject?: string;
  message: string;
  language?: string;
}

export interface SendTestResponse {
  success: boolean;
  channel: string;
  recipient: string;
  message_id: string;
  status: string;
  provider: string;
  details: string;
  log_id?: number;
  timestamp: string;
  whatsapp_url?: string;
  sms_url?: string;
  mailto_url?: string;
}

export interface DispatchCampaignRequest {
  campaign_id: number;
  channels: string[];
  language_code?: string;
  custom_message?: string;
  recipient_ids?: number[];
}

export interface DispatchCampaignDeliveryReceipt {
  channel: string;
  recipient_name: string;
  recipient_contact: string;
  message_id: string;
  status: string;
  timestamp: string;
}

export interface DispatchCampaignResponse {
  success: boolean;
  campaign_id: number;
  campaign_code: string;
  campaign_name: string;
  campaign_status: string;
  total_recipients: number;
  channels_used: string[];
  total_dispatched: number;
  channel_stats: Record<string, { sent: number; failed: number }>;
  deliveries: DispatchCampaignDeliveryReceipt[];
}

// ──────────────────────────────────────────────
// Analytics Overview
// ──────────────────────────────────────────────

export interface AnalyticsChannelMetric {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export interface AnalyticsLanguageMetric {
  language: string;
  reach: number;
  percentage: number;
  color: string;
}

export interface AnalyticsOverview {
  total_delivered: number;
  open_rate: number;
  click_through_rate: number;
  engagement_rate: number;
  engagement_trend_labels: string[];
  engagement_trend_data: number[];
  channel_performance: AnalyticsChannelMetric[];
  language_reach: AnalyticsLanguageMetric[];
  audience_active_percent: number;
  audience_inactive_percent: number;
  audience_total: number;
  total_campaigns: number;
  total_contents: number;
}

// ──────────────────────────────────────────────
// Authentication types
// ──────────────────────────────────────────────

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  role_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

// ──────────────────────────────────────────────
// Crisis & Weather Monitor types
// ──────────────────────────────────────────────

export interface CrisisNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  link: string;
  pub_date: string;
  category: string;
  severity: "CRITICAL" | "WARNING" | "ADVISORY" | "ANNOUNCEMENT" | string;
  region: string;
  suggested_language: string;
}

export interface CrisisWeatherAlert {
  id: string;
  region: string;
  state: string;
  lat: number;
  lon: number;
  alert_level: "RED" | "ORANGE" | "YELLOW" | "GREEN";
  condition: string;
  rainfall_mm: number;
  wind_kmh: number;
  flood_risk_pct: number;
  primary_language: string;
  description: string;
}
