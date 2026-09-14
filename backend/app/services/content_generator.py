import logging
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.campaign import Campaign, CampaignType, Language, CampaignAudience, AudienceSegment
from app.models.content import CampaignContent
from app.schemas.campaign import GenerateContentRequest
from app.services.llm_client import LLMClient

logger = logging.getLogger("uvicorn")


class ContentGeneratorService:
    """Service to handle AI-based content generation for campaigns."""

    @classmethod
    async def generate_campaign_content(
        cls,
        db: Session,
        campaign_id: int,
        req: GenerateContentRequest
    ) -> Tuple[CampaignContent, str, str, str]:
        """
        1. Fetch campaign and joined campaign_type, audiences.
        2. Format prompt:
           "Write a {tone} message about {objective} for a {campaign_type} campaign targeting {audience}. Keep it under {max_characters} characters for {channel}."
        3. Invoke Free LLM Provider (Google Gemini / Groq / Fallback).
        4. Save/update campaign_contents with language_id = English (1), ai_generated = True, status = DRAFT.
        """
        # 1. Fetch Campaign
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail=f"Campaign with ID {campaign_id} not found.")

        # Resolve Campaign Type name
        camp_type_name = "Public Awareness"
        if campaign.campaign_type:
            camp_type_name = campaign.campaign_type.name
        elif campaign.campaign_type_id:
            c_type = db.query(CampaignType).filter(CampaignType.id == campaign.campaign_type_id).first()
            if c_type:
                camp_type_name = c_type.name

        # Resolve Audience Segments
        audiences = (
            db.query(AudienceSegment.name)
            .join(CampaignAudience, CampaignAudience.segment_id == AudienceSegment.id)
            .filter(CampaignAudience.campaign_id == campaign_id)
            .all()
        )
        audience_desc = ", ".join([a[0] for a in audiences]) if audiences else "Citizens and general public"

        # Resolve English Language row
        english_lang = db.query(Language).filter(Language.code == "en").first()
        if not english_lang:
            # Fallback to ID 1 or create default
            english_lang = db.query(Language).filter(Language.id == 1).first()
            if not english_lang:
                english_lang = Language(id=1, name="English", code="en", native_name="English", is_active=True)
                db.add(english_lang)
                db.commit()
                db.refresh(english_lang)

        # 2. Build Prompt
        channel = req.channel.upper()
        tone = req.tone.strip()
        objective = (campaign.objective or campaign.description or campaign.name).strip()
        max_chars = req.max_characters

        prompt = (
            f"Write a {tone} message about {objective} for a {camp_type_name} campaign "
            f"targeting {audience_desc}. Keep it under {max_chars} characters for {channel}."
        )

        context = {
            "name": campaign.name,
            "objective": objective,
            "tone": tone,
            "campaign_type": camp_type_name,
            "audiences": audience_desc,
            "channel": channel
        }

        # 3. Call LLM
        generated_body, provider_used, model_used = await LLMClient.generate(
            prompt=prompt,
            provider=req.provider,
            max_characters=max_chars,
            campaign_context=context
        )

        # Create brief subject line
        subject_line = f"{camp_type_name}: {campaign.name}"
        if len(subject_line) > 100:
            subject_line = subject_line[:97] + "..."

        # 4. Save into campaign_contents
        existing_content = (
            db.query(CampaignContent)
            .filter(
                CampaignContent.campaign_id == campaign_id,
                CampaignContent.language_id == english_lang.id,
                CampaignContent.channel == channel
            )
            .first()
        )

        if existing_content:
            existing_content.subject = subject_line
            existing_content.title = campaign.name
            existing_content.body = generated_body
            existing_content.ai_generated = True
            existing_content.version = (existing_content.version or 1) + 1
            existing_content.status = "DRAFT"
            saved_content = existing_content
        else:
            saved_content = CampaignContent(
                campaign_id=campaign_id,
                language_id=english_lang.id,
                channel=channel,
                subject=subject_line,
                title=campaign.name,
                body=generated_body,
                ai_generated=True,
                version=1,
                status="DRAFT"
            )
            db.add(saved_content)

        db.commit()
        db.refresh(saved_content)

        return saved_content, provider_used, model_used, prompt
