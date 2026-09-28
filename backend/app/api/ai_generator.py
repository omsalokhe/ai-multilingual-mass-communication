"""
Standalone AI Content Generation & Translation endpoint.
Used by the AI Content Generator page on the frontend.
"""
import logging
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.llm_client import LLMClient
from app.services.translation_service import TranslationService

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/ai", tags=["AI Content Generation"])


class AIGenerateRequest(BaseModel):
    topic: str = Field(..., description="The campaign topic or idea to generate content about")
    tone: str = Field(default="Formal", description="Desired tone: Formal, Friendly, Urgent, Informative, Empathetic")
    channel: str = Field(default="Email", description="Target channel: Email, SMS, WhatsApp, Push Notification, Web Broadcast, Social Media")
    language: str = Field(default="English", description="Target language: English, Hindi, Kannada, Tamil, Telugu, Marathi")
    max_characters: int = Field(default=500, ge=50, le=3000, description="Max character limit for the generated content")
    guidance: Optional[str] = Field(default=None, description="Optional key points or instructions to include in the message")
    provider: Optional[str] = Field(default=None, description="Optional AI provider override: gemini, groq")


class AIGenerateResponse(BaseModel):
    success: bool
    generated_text: str
    language: str
    provider_used: str
    model_used: str
    character_count: int
    was_translated: bool = False
    original_english_text: Optional[str] = None


# Map language names to codes for translation
LANGUAGE_MAP = {
    "english": "en",
    "hindi": "hi",
    "kannada": "kn",
    "tamil": "ta",
    "telugu": "te",
    "marathi": "mr",
    "bengali": "bn",
    "gujarati": "gu",
    "punjabi": "pa",
    "malayalam": "ml",
}


@router.post(
    "/generate",
    response_model=AIGenerateResponse,
    summary="Standalone AI Content Generation",
    description=(
        "Generates campaign content using AI (Gemini/Groq) based on topic, tone, channel, and language. "
        "For non-English languages, generates in English first then translates using the multilingual pipeline."
    )
)
async def ai_generate(request: AIGenerateRequest):
    topic = request.topic.strip()
    tone = request.tone.strip()
    channel = request.channel.strip()
    language = request.language.strip()
    max_chars = request.max_characters
    guidance = request.guidance.strip() if request.guidance else ""

    # Map channel names to shorter forms for prompt
    channel_map = {
        "Push Notification": "PUSH",
        "Web Broadcast": "WEB",
        "Social Media": "SOCIAL",
    }
    channel_short = channel_map.get(channel, channel.upper())

    # Build the generation prompt with explicit language requirement
    guidance_part = f" Key points to include: {guidance}." if guidance else ""
    lang_inst = f" Write the entire message strictly in {language} language using native {language} script. Do not output English." if language.lower() != "english" else ""
    prompt = (
        f"Write a {tone.lower()} broadcast message about '{topic}' for a mass communication campaign. "
        f"{guidance_part} "
        f"{lang_inst} "
        f"The message is for {channel_short} channel. Keep it under {max_chars} characters. "
        f"Write clear, impactful content suitable for government or public sector communication. "
        f"Include relevant details, action items, and contact information where appropriate. "
        f"Output only the message text without any preamble or explanation."
    )

    context = {
        "objective": topic,
        "name": topic,
        "guidance": guidance,
        "tone": tone,
        "campaign_type": "Awareness",
        "channel": channel_short,
        "audiences": "citizens and general public",
        "language": language,
    }

    # Generate content using LLMClient (which generates in target language directly or via smart engine)
    generated_text, provider_used, model_used = await LLMClient.generate(
        prompt=prompt,
        provider=request.provider,
        max_characters=max_chars,
        campaign_context=context
    )

    # Check if translation pipeline is needed (if external LLM still returned English despite non-English request)
    lang_code = LANGUAGE_MAP.get(language.lower(), "en")
    was_translated = False
    original_english = None

    if lang_code != "en":
        # Check if text is already in native non-English script (has unicode characters beyond ASCII)
        has_indic_script = any(ord(c) > 127 for c in generated_text)
        if has_indic_script:
            was_translated = True
        else:
            # External LLM returned pure English; translate it
            original_english = generated_text
            try:
                translated_text, trans_provider, _ = await TranslationService.translate_text(
                    text=generated_text,
                    source_lang="en",
                    target_lang=lang_code,
                    campaign_objective=topic
                )
                generated_text = translated_text
                was_translated = True
                provider_used = f"{provider_used} + {trans_provider}"
            except Exception as exc:
                logger.warning(f"Translation to {language} failed: {exc}. Retrying offline engine.")
                from app.services.multilingual_content import get_multilingual_message
                generated_text = get_multilingual_message(topic=topic, language=language, guidance=guidance, tone=tone, channel=channel, max_chars=max_chars)
                was_translated = True

    return AIGenerateResponse(
        success=True,
        generated_text=generated_text,
        language=language,
        provider_used=provider_used,
        model_used=model_used,
        character_count=len(generated_text),
        was_translated=was_translated,
        original_english_text=original_english
    )
