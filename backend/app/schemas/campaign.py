from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class GenerateContentRequest(BaseModel):
    tone: str = Field(
        default="Informative",
        description="Desired tone of the message (e.g. Urgent, Informative, Empathetic, Authoritative, Action-oriented)"
    )
    channel: str = Field(
        default="SMS",
        description="Target communication channel: SMS, EMAIL, WHATSAPP, PUSH, WEB"
    )
    max_characters: int = Field(
        default=300,
        ge=50,
        le=2000,
        description="Character limit for the generated message (e.g. 300 for SMS)"
    )
    provider: Optional[str] = Field(
        default=None,
        description="Optional override for AI provider: 'gemini' or 'groq'. If omitted, uses server default."
    )


class CampaignBrief(BaseModel):
    id: int
    campaign_code: str
    name: str
    objective: Optional[str] = None
    priority: Optional[str] = None
    status: str
    campaign_type: Optional[str] = None
    target_audiences: List[str] = []

    class Config:
        from_attributes = True


class GenerateContentResponse(BaseModel):
    success: bool
    content_id: int
    campaign_id: int
    language_id: int
    language_code: str
    channel: str
    subject: Optional[str] = None
    title: Optional[str] = None
    body: str
    character_count: int
    ai_generated: bool
    version: int
    status: str
    provider_used: str
    model_used: str
    prompt_used: str
    created_at: datetime


class TranslateCampaignRequest(BaseModel):
    target_language_codes: Optional[List[str]] = Field(
        default=None,
        description="List of target language codes (e.g. ['hi', 'kn', 'ta', 'te', 'mr']). If omitted, translates to all active Indian languages."
    )
    channel: Optional[str] = Field(
        default=None,
        description="Target channel (SMS, EMAIL, WHATSAPP, etc.). Defaults to matching the source campaign content's channel."
    )
    provider: Optional[str] = Field(
        default=None,
        description="Translation provider override ('bhashini', 'indictrans2', 'gemini', 'groq', or 'auto')."
    )
    source_language_code: Optional[str] = Field(
        default="en",
        description="Source content language code (default 'en')."
    )


class TranslatedContentItem(BaseModel):
    content_id: int
    language_id: int
    language_code: str
    language_name: str
    channel: str
    subject: Optional[str] = None
    title: Optional[str] = None
    body: str
    character_count: int
    ai_generated: bool
    version: int
    status: str
    provider_used: str
    created_at: datetime


class TranslateCampaignResponse(BaseModel):
    success: bool
    campaign_id: int
    source_language_code: str
    source_text: str
    channel: str
    total_translated: int
    translations: List[TranslatedContentItem]


class PersonalizeCampaignRequest(BaseModel):
    segment_id: Optional[int] = Field(
        default=None,
        description="Audience segment to personalize for. If omitted, uses campaign's linked segments."
    )
    recipient_id: Optional[int] = Field(
        default=None,
        description="Optional specific recipient ID to use for sample phrasing extraction."
    )
    template_id: Optional[int] = Field(
        default=None,
        description="Optional communication template ID to use for body and subject templates."
    )
    custom_variables: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional overrides for template variables (e.g. {'action_url': 'https://health.gov.in'})."
    )
    language_id: Optional[int] = Field(
        default=None,
        description="Optional language ID to restrict personalization to a single language."
    )


class PersonalizedContentItem(BaseModel):
    content_id: int
    language_id: int
    language_code: str
    channel: str
    subject: Optional[str] = None
    body: str
    character_count: int
    version: int
    variables_applied: Dict[str, Any]
    updated_at: datetime


class PersonalizeCampaignResponse(BaseModel):
    success: bool
    campaign_id: int
    segment_id: Optional[int]
    segment_name: str
    recipients_analyzed: int
    phrasing_selected: Dict[str, Any]
    contents_personalized: List[PersonalizedContentItem]
    total_updated: int


class SentimentAnalysisRequest(BaseModel):
    provider: Optional[str] = Field(
        default=None,
        description="Optional override for tone analysis LLM provider: 'gemini' or 'groq'. Uses server default if omitted."
    )
    include_tone_suggestions: bool = Field(
        default=True,
        description="If True, uses LLM (Gemini/Groq) for tone classification and actionable suggestions. If False, uses only VADER + rule-based analysis."
    )
    language_id: Optional[int] = Field(
        default=None,
        description="Optional language ID to restrict analysis to a single language's content."
    )


class SentimentReportItem(BaseModel):
    content_id: int
    language_id: int
    language_code: str
    language_name: str
    channel: str
    body_preview: str
    sentiment: str
    sentiment_scores: Dict[str, float]
    tone: str
    tone_suggestions: List[str]
    clarity_score: int
    overall_score: int
    status: str
    report_id: int


class SentimentAnalysisResponse(BaseModel):
    success: bool
    campaign_id: int
    total_analyzed: int
    reports: List[SentimentReportItem]
    summary: Dict[str, Any]


class QualityCheckRequest(BaseModel):
    provider: Optional[str] = Field(
        default=None,
        description="Optional override for factual-check LLM provider: 'gemini' or 'groq'. Uses server default if omitted."
    )
    include_factual_check: bool = Field(
        default=True,
        description="If True, uses LLM (Gemini/Groq) for factual/safety verification. If False, runs only grammar + compliance rules."
    )
    language_id: Optional[int] = Field(
        default=None,
        description="Optional language ID to restrict quality checks to a single language's content."
    )
    languagetool_url: Optional[str] = Field(
        default=None,
        description="Optional override for LanguageTool API URL (e.g. 'http://localhost:8010/v2/check' for local Docker server)."
    )


class QualityReportItem(BaseModel):
    content_id: int
    language_id: int
    language_code: str
    language_name: str
    channel: str
    body_preview: str
    grammar_ok: bool
    grammar_error_count: int
    grammar_issues: List[Dict[str, Any]]
    compliance_ok: bool
    compliance_violations: List[Dict[str, Any]]
    factual_ok: bool
    factual_risk_level: str
    factual_issues: List[Any]
    overall_score: int
    status: str
    report_id: int


class QualityCheckResponse(BaseModel):
    success: bool
    campaign_id: int
    total_checked: int
    reports: List[QualityReportItem]
    summary: Dict[str, Any]

