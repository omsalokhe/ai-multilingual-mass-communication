import logging
import json
import re
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.config import settings
from app.models.campaign import Campaign, Language
from app.models.content import CampaignContent, ContentQualityReport
from app.services.llm_client import LLMClient

logger = logging.getLogger("uvicorn")

# ─── VADER (Local, Zero-Cost Sentiment Analyzer) ────────────────────────────
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    _vader = SentimentIntensityAnalyzer()
    VADER_AVAILABLE = True
    logger.info("VADER SentimentIntensityAnalyzer loaded successfully.")
except ImportError:
    _vader = None
    VADER_AVAILABLE = False
    logger.warning("vaderSentiment not installed. Run: pip install vaderSentiment")


class SentimentService:
    """
    Step 4 — Sentiment & Tone Analysis Service

    Pipeline:
    1. VADER (local, offline) → quick sentiment label (POSITIVE/NEUTRAL/NEGATIVE) + compound score
    2. LLM Tone Analysis (optional, uses existing Gemini/Groq key) → tone classification
       + actionable suggestions (e.g. "simplify sentences", "strengthen call to action")
    3. Rule-based fallback for tone if no LLM key is configured
    4. Results upserted into content_quality_reports table
    """

    # ─── Tone keywords for rule-based classification ─────────────────────
    TONE_RULES = {
        "URGENT": [
            "urgent", "immediately", "emergency", "critical", "alert", "warning",
            "danger", "evacuate", "act now", "do not delay"
        ],
        "EMPATHETIC": [
            "understand", "care", "support", "together", "help", "concern",
            "well-being", "family", "safe", "protect"
        ],
        "AUTHORITATIVE": [
            "advisory", "mandate", "regulation", "compliance", "directive",
            "government", "official", "administration", "department", "authority"
        ],
        "ACTION-ORIENTED": [
            "take action", "ensure", "report", "call", "visit", "submit",
            "register", "follow", "apply", "contact", "helpline"
        ],
        "INFORMATIVE": [
            "notice", "information", "awareness", "update", "learn",
            "guidelines", "instructions", "tips", "advice", "prevention"
        ],
    }

    # ─── Main Entry Point ────────────────────────────────────────────────
    @classmethod
    async def analyze_campaign(
        cls,
        db: Session,
        campaign_id: int,
        req: Any
    ) -> dict:
        """
        Analyze sentiment & tone for all campaign contents.
        Returns structured response with per-content reports + summary.
        """
        # 1. Validate campaign exists
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")

        # 2. Fetch campaign contents (optionally filtered by language)
        query = db.query(CampaignContent).filter(CampaignContent.campaign_id == campaign_id)
        if req.language_id:
            query = query.filter(CampaignContent.language_id == req.language_id)
        contents = query.all()

        if not contents:
            raise HTTPException(
                status_code=404,
                detail=f"No content found for campaign {campaign_id}. Generate content first (Step 1)."
            )

        # 3. Analyze each content item
        reports = []
        sentiment_counts = {"POSITIVE": 0, "NEUTRAL": 0, "NEGATIVE": 0}
        total_overall = 0

        for content in contents:
            report = await cls._analyze_single_content(
                db=db,
                content=content,
                include_tone_suggestions=req.include_tone_suggestions,
                provider=req.provider
            )
            reports.append(report)
            sentiment_counts[report["sentiment"]] = sentiment_counts.get(report["sentiment"], 0) + 1
            total_overall += report["overall_score"]

        # 4. Build summary
        avg_score = round(total_overall / len(reports), 1) if reports else 0
        dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get)

        summary = {
            "dominant_sentiment": dominant_sentiment,
            "sentiment_distribution": sentiment_counts,
            "average_overall_score": avg_score,
            "total_contents": len(reports),
            "vader_available": VADER_AVAILABLE,
        }

        return {
            "success": True,
            "campaign_id": campaign_id,
            "total_analyzed": len(reports),
            "reports": reports,
            "summary": summary
        }

    # ─── Single Content Analysis ─────────────────────────────────────────
    @classmethod
    async def _analyze_single_content(
        cls,
        db: Session,
        content: CampaignContent,
        include_tone_suggestions: bool = True,
        provider: Optional[str] = None
    ) -> dict:
        """Analyze one CampaignContent row: VADER → tone → upsert report."""
        text = content.body or ""
        lang_code = content.language.code if content.language else "en"
        lang_name = content.language.name if content.language else "English"

        # ── Step A: VADER Sentiment Analysis (always runs) ───────────────
        vader_result = cls._vader_sentiment(text)

        # ── Step B: Tone Analysis (LLM or rule-based) ────────────────────
        tone_data = await cls._get_tone_analysis(
            text=text,
            vader_result=vader_result,
            include_suggestions=include_tone_suggestions,
            provider=provider
        )

        # ── Step C: Compute overall score ────────────────────────────────
        overall_score = cls._compute_overall_score(vader_result, tone_data)

        # ── Step D: Upsert into content_quality_reports ──────────────────
        existing_report = db.query(ContentQualityReport).filter(
            ContentQualityReport.campaign_content_id == content.id
        ).first()

        status = "APPROVED" if overall_score >= 50 else "NEEDS_REVIEW"

        if existing_report:
            existing_report.sentiment = vader_result["label"]
            existing_report.tone = tone_data["tone"]
            existing_report.clarity_score = tone_data.get("clarity_score", 70)
            existing_report.overall_score = overall_score
            existing_report.status = status
            existing_report.created_at = datetime.utcnow()
        else:
            existing_report = ContentQualityReport(
                campaign_content_id=content.id,
                sentiment=vader_result["label"],
                tone=tone_data["tone"],
                clarity_score=tone_data.get("clarity_score", 70),
                grammar_ok=True,     # Placeholder — Step 5 will fill in
                factual_ok=True,     # Placeholder — Step 5 will fill in
                compliance_ok=True,  # Placeholder — Step 5 will fill in
                overall_score=overall_score,
                status=status
            )
            db.add(existing_report)

        db.commit()
        db.refresh(existing_report)

        return {
            "content_id": content.id,
            "language_id": content.language_id,
            "language_code": lang_code,
            "language_name": lang_name,
            "channel": content.channel,
            "body_preview": text[:120] + "..." if len(text) > 120 else text,
            "sentiment": vader_result["label"],
            "sentiment_scores": {
                "positive": vader_result["pos"],
                "negative": vader_result["neg"],
                "neutral": vader_result["neu"],
                "compound": vader_result["compound"]
            },
            "tone": tone_data["tone"],
            "tone_suggestions": tone_data.get("suggestions", []),
            "clarity_score": tone_data.get("clarity_score", 70),
            "overall_score": overall_score,
            "status": status,
            "report_id": existing_report.id
        }

    # ─── VADER Sentiment Scoring ─────────────────────────────────────────
    @classmethod
    def _vader_sentiment(cls, text: str) -> dict:
        """
        Run VADER on text. Returns dict with label + scores.
        VADER works best on English text; for non-English, returns NEUTRAL with note.
        """
        if not VADER_AVAILABLE or not _vader:
            # Fallback: keyword-based rough sentiment
            return cls._keyword_sentiment(text)

        try:
            scores = _vader.polarity_scores(text)
            compound = scores["compound"]

            # Standard VADER thresholds
            if compound >= 0.05:
                label = "POSITIVE"
            elif compound <= -0.05:
                label = "NEGATIVE"
            else:
                label = "NEUTRAL"

            return {
                "label": label,
                "compound": round(compound, 4),
                "pos": round(scores["pos"], 4),
                "neg": round(scores["neg"], 4),
                "neu": round(scores["neu"], 4)
            }
        except Exception as exc:
            logger.warning(f"VADER analysis failed: {exc}")
            return cls._keyword_sentiment(text)

    @classmethod
    def _keyword_sentiment(cls, text: str) -> dict:
        """Simple keyword-based fallback if VADER is not available."""
        text_lower = text.lower()
        negative_keywords = [
            "danger", "death", "disease", "emergency", "fatal", "warning",
            "risk", "threat", "evacuate", "flood", "destruction"
        ]
        positive_keywords = [
            "safe", "protect", "health", "support", "help", "care",
            "prevent", "free", "available", "benefit", "improvement"
        ]

        neg_count = sum(1 for w in negative_keywords if w in text_lower)
        pos_count = sum(1 for w in positive_keywords if w in text_lower)

        if neg_count > pos_count + 1:
            label = "NEGATIVE"
            compound = -0.5
        elif pos_count > neg_count + 1:
            label = "POSITIVE"
            compound = 0.5
        else:
            label = "NEUTRAL"
            compound = 0.0

        return {
            "label": label,
            "compound": compound,
            "pos": round(pos_count / max(pos_count + neg_count, 1), 4),
            "neg": round(neg_count / max(pos_count + neg_count, 1), 4),
            "neu": 0.5
        }

    # ─── Tone Analysis (LLM or Rule-Based) ───────────────────────────────
    @classmethod
    async def _get_tone_analysis(
        cls,
        text: str,
        vader_result: dict,
        include_suggestions: bool = True,
        provider: Optional[str] = None
    ) -> dict:
        """
        Attempt LLM-powered tone analysis, fall back to rule-based.
        """
        # Try LLM tone analysis if a key is configured
        has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
        has_groq = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())

        if include_suggestions and (has_gemini or has_groq):
            try:
                return await cls._llm_tone_analysis(text, provider)
            except Exception as exc:
                logger.warning(f"LLM tone analysis failed: {exc}. Using rule-based fallback.")

        # Rule-based fallback
        return cls._rule_based_tone(text, vader_result)

    @classmethod
    async def _llm_tone_analysis(cls, text: str, provider: Optional[str] = None) -> dict:
        """
        Call LLMClient with a structured prompt for tone classification + suggestions.
        Reuses the existing Gemini/Groq key — no new API cost.
        """
        prompt = (
            "You are a communication quality analyst. Analyze the following broadcast message "
            "and return a JSON object with exactly these fields:\n\n"
            "1. \"tone\": The primary tone of the message (one of: Urgent, Informative, Empathetic, "
            "Authoritative, Action-Oriented, Formal, Casual, Calm)\n"
            "2. \"suggestions\": A JSON array of 2-4 short, actionable suggestions to improve "
            "the message's tone and clarity (e.g., \"Simplify sentence structure\", "
            "\"Add a stronger call to action\", \"Use more empathetic language\")\n"
            "3. \"clarity_score\": An integer from 0-100 rating how clear and readable the message is\n\n"
            "Return ONLY valid JSON, no markdown fences, no extra text.\n\n"
            f"MESSAGE:\n\"\"\"\n{text}\n\"\"\""
        )

        generated_text, provider_used, model_used = await LLMClient.generate(
            prompt=prompt,
            provider=provider,
            max_characters=500
        )

        # Parse LLM response as JSON
        try:
            # Try to extract JSON from the response (handle markdown fences)
            json_match = re.search(r'\{[^{}]*\}', generated_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
            else:
                data = json.loads(generated_text)

            tone = data.get("tone", "Informative")
            suggestions = data.get("suggestions", [])
            clarity_score = int(data.get("clarity_score", 70))

            # Clamp clarity score
            clarity_score = max(0, min(100, clarity_score))

            return {
                "tone": tone,
                "suggestions": suggestions if isinstance(suggestions, list) else [str(suggestions)],
                "clarity_score": clarity_score,
                "source": f"LLM ({provider_used})"
            }
        except (json.JSONDecodeError, ValueError, KeyError) as exc:
            logger.warning(f"Failed to parse LLM tone response: {exc}. Raw: {generated_text[:200]}")
            # Extract tone from raw text if possible
            tone = "Informative"
            for t in ["Urgent", "Empathetic", "Authoritative", "Action-Oriented", "Formal", "Calm"]:
                if t.lower() in generated_text.lower():
                    tone = t
                    break
            return {
                "tone": tone,
                "suggestions": ["LLM response could not be fully parsed — review message manually"],
                "clarity_score": 70,
                "source": f"LLM ({provider_used}, partial parse)"
            }

    @classmethod
    def _rule_based_tone(cls, text: str, vader_result: dict) -> dict:
        """
        Rule-based tone classifier — uses keyword matching + VADER compound score.
        Always available, no API needed.
        """
        text_lower = text.lower()
        tone_scores: Dict[str, int] = {}

        for tone, keywords in cls.TONE_RULES.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                tone_scores[tone] = score

        if tone_scores:
            primary_tone = max(tone_scores, key=tone_scores.get)
        else:
            compound = vader_result.get("compound", 0)
            if compound >= 0.3:
                primary_tone = "EMPATHETIC"
            elif compound <= -0.3:
                primary_tone = "URGENT"
            else:
                primary_tone = "INFORMATIVE"

        # Generate rule-based suggestions
        suggestions = cls._generate_rule_suggestions(text, vader_result, primary_tone)

        # Estimate clarity from sentence structure
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        avg_sentence_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)

        if avg_sentence_len > 25:
            clarity_score = 55
        elif avg_sentence_len > 18:
            clarity_score = 70
        else:
            clarity_score = 85

        return {
            "tone": primary_tone,
            "suggestions": suggestions,
            "clarity_score": clarity_score,
            "source": "Rule-Based (local)"
        }

    @classmethod
    def _generate_rule_suggestions(cls, text: str, vader_result: dict, tone: str) -> List[str]:
        """Generate actionable improvement suggestions based on text analysis."""
        suggestions = []
        text_lower = text.lower()

        # Sentence length analysis
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        avg_words = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        if avg_words > 20:
            suggestions.append("Simplify long sentences — aim for 15-20 words per sentence for better readability")

        # Call to action check
        cta_keywords = ["call", "visit", "contact", "helpline", "register", "apply", "report"]
        has_cta = any(kw in text_lower for kw in cta_keywords)
        if not has_cta:
            suggestions.append("Add a clear call to action (e.g., helpline number, website, or next step)")

        # Urgency check for health/emergency content
        emergency_words = ["dengue", "flood", "emergency", "alert", "evacuation", "disaster"]
        is_emergency = any(w in text_lower for w in emergency_words)
        if is_emergency and tone != "URGENT":
            suggestions.append("Consider using more urgent language given the emergency nature of the content")

        # Empathy check
        compound = vader_result.get("compound", 0)
        if compound < -0.2 and "EMPATHETIC" not in tone:
            suggestions.append("Balance negative messaging with empathetic language to maintain reader engagement")

        # Character limit guidance
        if len(text) > 300:
            suggestions.append("Consider shortening the message for SMS delivery (recommended: under 300 characters)")

        # If no suggestions were generated
        if not suggestions:
            suggestions.append("Message tone and structure are well-suited for the target audience")

        return suggestions[:4]  # Cap at 4 suggestions

    # ─── Overall Score Computation ───────────────────────────────────────
    @classmethod
    def _compute_overall_score(cls, vader_result: dict, tone_data: dict) -> int:
        """
        Combine VADER compound score + clarity into a 0-100 overall score.

        Formula:
        - Sentiment intensity (40%): Based on absolute compound score (strong sentiment = good)
        - Clarity (40%): From tone analysis
        - Tone match (20%): Bonus for having a clear, identified tone
        """
        compound = abs(vader_result.get("compound", 0))
        clarity = tone_data.get("clarity_score", 70)

        # Sentiment intensity: compound 0→1 mapped to 40→100
        sentiment_score = min(100, 40 + compound * 60)

        # Tone match bonus: identified tone gets full marks
        tone = tone_data.get("tone", "")
        tone_bonus = 80 if tone and tone != "UNKNOWN" else 40

        overall = int(sentiment_score * 0.4 + clarity * 0.4 + tone_bonus * 0.2)
        return max(0, min(100, overall))
