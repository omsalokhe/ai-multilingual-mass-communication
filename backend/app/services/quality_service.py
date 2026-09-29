import logging
import json
import re
import asyncio
import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.config import settings
from app.models.campaign import Campaign
from app.models.content import CampaignContent, ContentQualityReport
from app.services.llm_client import LLMClient

logger = logging.getLogger("uvicorn")

# ─── Language code mapping: ISO 639-1 → LanguageTool locale ──────────────
LANGUAGETOOL_LOCALES = {
    "en": "en-US",
    "hi": "hi",
    "kn": "kn",
    "ta": "ta",
    "te": "te",
    "mr": "mr",
    "bn": "bn",
    "gu": "gu",
    "ml": "ml",
    "pa": "pa",
    "ur": "ur",
    "or": "or",
}


class QualityService:
    """
    Step 5 — AI Quality & Compliance Check Service

    Pipeline:
    1. Grammar Check → LanguageTool public API (or local Docker server)
       with regex-based fallback for unsupported languages
    2. Compliance Rules Engine → Pure Python: banned-word list, channel
       length limits, required disclaimers, formatting checks
    3. Factual / Safety Check → Single Gemini/Groq LLM call per content:
       "Does this message contain unverified claims or unsafe advice?"
    4. Results upserted into content_quality_reports table
    """

    # ─── Banned Words (government/health messaging blacklist) ─────────
    BANNED_WORDS = [
        "guaranteed cure", "100% effective", "miracle", "no side effects",
        "scientifically proven cure", "wonder drug", "magic remedy",
        "instant cure", "secret formula", "home remedy guaranteed",
        "buy now", "limited offer", "act fast or die", "you will die",
        "fake news", "conspiracy", "hoax", "click here to claim",
        "send money", "lottery winner", "get rich quick",
    ]

    # ─── Channel-Specific Length Limits ───────────────────────────────
    CHANNEL_LIMITS = {
        "SMS": 480,
        "PUSH": 256,
        "WHATSAPP": 4096,
        "EMAIL": 50000,
        "WEB": 100000,
        "SOCIAL": 2200,
    }

    # ─── Required Disclaimers by Campaign Type ────────────────────────
    DISCLAIMER_RULES = {
        "health": {
            "keywords": ["dengue", "health", "disease", "fever", "medical", "vaccine",
                         "treatment", "hospital", "doctor", "prevention", "symptoms"],
            "required": ["helpline", "104", "hospital", "health center",
                         "PHC", "doctor", "medical", "official"],
            "message": "Health campaigns must include a helpline number or official health source reference"
        },
        "emergency": {
            "keywords": ["emergency", "flood", "earthquake", "cyclone", "evacuation",
                         "disaster", "tsunami", "fire", "storm", "landslide"],
            "required": ["112", "1070", "helpline", "emergency", "shelter",
                         "control room", "disaster management"],
            "message": "Emergency campaigns must include an emergency helpline (112/1070) or shelter information"
        },
    }

    # ─── Main Entry Point ────────────────────────────────────────────
    @classmethod
    async def check_campaign(
        cls,
        db: Session,
        campaign_id: int,
        req: Any
    ) -> dict:
        """
        Run quality & compliance checks for all campaign contents.
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

        # Determine campaign type keywords for compliance checks
        camp_type = campaign.campaign_type.name.lower() if campaign.campaign_type else "general"

        # 3. Run checks on each content item
        tasks = [
            cls._check_single_content(
                db=db,
                content=content,
                campaign_type=camp_type,
                include_factual_check=req.include_factual_check,
                provider=req.provider,
                languagetool_url=req.languagetool_url
            )
            for content in contents
        ]
        reports = await asyncio.gather(*tasks)

        grammar_pass = sum(1 for r in reports if r["grammar_ok"])
        compliance_pass = sum(1 for r in reports if r["compliance_ok"])
        factual_pass = sum(1 for r in reports if r["factual_ok"])

        # 4. Build summary
        total = len(reports)
        summary = {
            "total_contents": total,
            "grammar_pass": grammar_pass,
            "grammar_fail": total - grammar_pass,
            "compliance_pass": compliance_pass,
            "compliance_fail": total - compliance_pass,
            "factual_pass": factual_pass,
            "factual_fail": total - factual_pass,
            "overall_compliance_rate": round((grammar_pass + compliance_pass + factual_pass) / (total * 3) * 100, 1) if total else 0,
            "all_clear": grammar_pass == total and compliance_pass == total and factual_pass == total,
        }

        return {
            "success": True,
            "campaign_id": campaign_id,
            "total_checked": total,
            "reports": reports,
            "summary": summary
        }

    # ─── Single Content Check ────────────────────────────────────────
    @classmethod
    async def _check_single_content(
        cls,
        db: Session,
        content: CampaignContent,
        campaign_type: str,
        include_factual_check: bool = True,
        provider: Optional[str] = None,
        languagetool_url: Optional[str] = None
    ) -> dict:
        """Run all 3 quality checks on one CampaignContent row."""
        text = content.body or ""
        lang_code = content.language.code if content.language else "en"
        lang_name = content.language.name if content.language else "English"
        channel = content.channel or "SMS"

        # ── A: Grammar Check ─────────────────────────────────────────
        grammar_result = await cls._check_grammar(text, lang_code, languagetool_url)

        # ── B: Compliance Rules Check ────────────────────────────────
        compliance_result = cls._check_compliance(text, channel, campaign_type)

        # ── C: Factual / Safety Check ────────────────────────────────
        if include_factual_check:
            factual_result = await cls._check_factual(text, provider)
        else:
            factual_result = {
                "ok": True,
                "risk_level": "SKIPPED",
                "flagged_items": [],
                "recommendations": ["Factual check was skipped by request"]
            }

        # ── D: Compute combined quality score ────────────────────────
        overall_score = cls._compute_quality_score(grammar_result, compliance_result, factual_result)

        # Determine status
        if not grammar_result["ok"] or not compliance_result["ok"] or not factual_result["ok"]:
            if factual_result.get("risk_level") == "HIGH":
                status = "REJECTED"
            else:
                status = "NEEDS_REVIEW"
        else:
            status = "APPROVED" if overall_score >= 60 else "NEEDS_REVIEW"

        # ── E: Upsert into content_quality_reports ───────────────────
        existing_report = db.query(ContentQualityReport).filter(
            ContentQualityReport.campaign_content_id == content.id
        ).first()

        if existing_report:
            existing_report.grammar_ok = grammar_result["ok"]
            existing_report.grammar_issues = json.dumps(grammar_result.get("issues", []), ensure_ascii=False)
            existing_report.factual_ok = factual_result["ok"]
            existing_report.factual_issues = json.dumps({
                "risk_level": factual_result.get("risk_level", "UNKNOWN"),
                "flagged_items": factual_result.get("flagged_items", []),
                "recommendations": factual_result.get("recommendations", [])
            }, ensure_ascii=False)
            existing_report.compliance_ok = compliance_result["ok"]
            existing_report.compliance_issues = json.dumps(compliance_result.get("violations", []), ensure_ascii=False)
            existing_report.overall_score = overall_score
            existing_report.status = status
            existing_report.created_at = datetime.utcnow()
        else:
            existing_report = ContentQualityReport(
                campaign_content_id=content.id,
                sentiment=None,
                tone=None,
                clarity_score=None,
                grammar_ok=grammar_result["ok"],
                grammar_issues=json.dumps(grammar_result.get("issues", []), ensure_ascii=False),
                factual_ok=factual_result["ok"],
                factual_issues=json.dumps({
                    "risk_level": factual_result.get("risk_level", "UNKNOWN"),
                    "flagged_items": factual_result.get("flagged_items", []),
                    "recommendations": factual_result.get("recommendations", [])
                }, ensure_ascii=False),
                compliance_ok=compliance_result["ok"],
                compliance_issues=json.dumps(compliance_result.get("violations", []), ensure_ascii=False),
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
            "channel": channel,
            "body_preview": text[:120] + "..." if len(text) > 120 else text,
            "grammar_ok": grammar_result["ok"],
            "grammar_error_count": grammar_result.get("error_count", 0),
            "grammar_issues": grammar_result.get("issues", []),
            "compliance_ok": compliance_result["ok"],
            "compliance_violations": compliance_result.get("violations", []),
            "factual_ok": factual_result["ok"],
            "factual_risk_level": factual_result.get("risk_level", "UNKNOWN"),
            "factual_issues": factual_result.get("flagged_items", []),
            "overall_score": overall_score,
            "status": status,
            "report_id": existing_report.id
        }

    # ═══════════════════════════════════════════════════════════════════
    # CHECK 1: GRAMMAR (LanguageTool API)
    # ═══════════════════════════════════════════════════════════════════
    @classmethod
    async def _check_grammar(
        cls,
        text: str,
        lang_code: str,
        languagetool_url: Optional[str] = None
    ) -> dict:
        """
        Run grammar check via LanguageTool HTTP API.
        Falls back to basic regex checks if API is unreachable or language unsupported.
        """
        lt_url = languagetool_url or settings.LANGUAGETOOL_URL
        lt_locale = LANGUAGETOOL_LOCALES.get(lang_code, lang_code)

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.post(
                    lt_url,
                    data={
                        "text": text,
                        "language": lt_locale,
                        "enabledOnly": "false"
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    matches = data.get("matches", [])

                    issues = []
                    for m in matches[:20]:  # Cap at 20 issues
                        issue = {
                            "message": m.get("message", ""),
                            "context": m.get("context", {}).get("text", "")[:100],
                            "offset": m.get("offset", 0),
                            "length": m.get("length", 0),
                            "rule_id": m.get("rule", {}).get("id", "UNKNOWN"),
                            "rule_category": m.get("rule", {}).get("category", {}).get("name", ""),
                            "suggestions": [r.get("value", "") for r in m.get("replacements", [])[:3]]
                        }
                        issues.append(issue)

                    return {
                        "ok": len(issues) == 0,
                        "error_count": len(issues),
                        "issues": issues,
                        "source": f"LanguageTool ({lt_url.split('//')[1].split('/')[0] if '//' in lt_url else 'API'})"
                    }
                else:
                    logger.warning(
                        f"LanguageTool API returned {response.status_code} for lang={lt_locale}. "
                        f"Using regex fallback."
                    )
                    return cls._regex_grammar_check(text, lang_code)

        except Exception as exc:
            logger.warning(f"LanguageTool API unreachable: {exc}. Using regex fallback.")
            return cls._regex_grammar_check(text, lang_code)

    @classmethod
    def _regex_grammar_check(cls, text: str, lang_code: str) -> dict:
        """Basic regex-based grammar checks as fallback."""
        issues = []

        # Check 1: Double spaces
        doubles = list(re.finditer(r'  +', text))
        if doubles:
            issues.append({
                "message": f"Found {len(doubles)} instance(s) of multiple consecutive spaces",
                "context": text[max(0, doubles[0].start()-10):doubles[0].end()+10],
                "offset": doubles[0].start(),
                "length": doubles[0].end() - doubles[0].start(),
                "rule_id": "DOUBLE_SPACE",
                "rule_category": "Whitespace",
                "suggestions": [" "]
            })

        # Check 2: Repeated words (English only)
        if lang_code == "en":
            repeated = list(re.finditer(r'\b(\w+)\s+\1\b', text, re.IGNORECASE))
            for r in repeated[:3]:
                issues.append({
                    "message": f"Repeated word: '{r.group(1)}'",
                    "context": text[max(0, r.start()-10):r.end()+10],
                    "offset": r.start(),
                    "length": r.end() - r.start(),
                    "rule_id": "REPEATED_WORD",
                    "rule_category": "Grammar",
                    "suggestions": [r.group(1)]
                })

        # Check 3: Missing space after punctuation (English)
        if lang_code == "en":
            missing_space = list(re.finditer(r'[.!?,;:][A-Za-z]', text))
            for ms in missing_space[:3]:
                issues.append({
                    "message": "Missing space after punctuation",
                    "context": text[max(0, ms.start()-5):ms.end()+10],
                    "offset": ms.start(),
                    "length": 2,
                    "rule_id": "MISSING_SPACE_AFTER_PUNCT",
                    "rule_category": "Punctuation",
                    "suggestions": [ms.group()[0] + " " + ms.group()[1]]
                })

        # Check 4: Excessive punctuation (!!!, ???, ...)
        excessive = list(re.finditer(r'[!?]{3,}', text))
        for e in excessive[:3]:
            issues.append({
                "message": "Excessive punctuation — avoid more than two consecutive ! or ?",
                "context": text[max(0, e.start()-10):e.end()+10],
                "offset": e.start(),
                "length": e.end() - e.start(),
                "rule_id": "EXCESSIVE_PUNCTUATION",
                "rule_category": "Style",
                "suggestions": [e.group()[:1]]
            })

        return {
            "ok": len(issues) == 0,
            "error_count": len(issues),
            "issues": issues,
            "source": "Regex Fallback (local)"
        }

    # ═══════════════════════════════════════════════════════════════════
    # CHECK 2: COMPLIANCE RULES ENGINE (Pure Python)
    # ═══════════════════════════════════════════════════════════════════
    @classmethod
    def _check_compliance(
        cls,
        text: str,
        channel: str,
        campaign_type: str
    ) -> dict:
        """
        Pure Python rules engine — zero dependencies.
        Checks: banned words, channel length, required disclaimers,
        ALL-CAPS shouting, and excessive punctuation.
        """
        violations = []
        text_lower = text.lower()

        # ── Rule 1: Banned Words ─────────────────────────────────────
        for phrase in cls.BANNED_WORDS:
            if phrase in text_lower:
                violations.append({
                    "rule": "BANNED_WORD",
                    "severity": "HIGH",
                    "message": f"Contains banned phrase: '{phrase}'",
                    "detail": "Government/health messaging must not include misleading claims or spam language"
                })

        # ── Rule 2: Channel Length Limits ─────────────────────────────
        limit = cls.CHANNEL_LIMITS.get(channel.upper(), 50000)
        if len(text) > limit:
            violations.append({
                "rule": "LENGTH_EXCEEDED",
                "severity": "MEDIUM",
                "message": f"Message length ({len(text)} chars) exceeds {channel} limit ({limit} chars)",
                "detail": f"Trim content by {len(text) - limit} characters for {channel} delivery"
            })

        # ── Rule 3: Required Disclaimers ─────────────────────────────
        for category, rule in cls.DISCLAIMER_RULES.items():
            # Check if this campaign type matches the disclaimer category
            is_relevant = any(kw in campaign_type.lower() for kw in [category]) or \
                          any(kw in text_lower for kw in rule["keywords"])
            if is_relevant:
                has_disclaimer = any(req in text_lower for req in rule["required"])
                if not has_disclaimer:
                    violations.append({
                        "rule": "MISSING_DISCLAIMER",
                        "severity": "HIGH",
                        "message": rule["message"],
                        "detail": f"Suggested: include one of {rule['required'][:4]}"
                    })

        # ── Rule 4: ALL-CAPS Shouting ────────────────────────────────
        words = text.split()
        if len(words) > 5:
            caps_words = sum(1 for w in words if w.isupper() and len(w) > 2)
            caps_ratio = caps_words / len(words) if words else 0
            if caps_ratio > 0.5:
                violations.append({
                    "rule": "EXCESSIVE_CAPS",
                    "severity": "LOW",
                    "message": f"Over {int(caps_ratio*100)}% of words are ALL-CAPS — may appear as shouting",
                    "detail": "Use sentence case for professional government communications"
                })

        # ── Rule 5: Excessive Exclamation / Spam Indicators ──────────
        excl_count = text.count("!")
        if excl_count > 3:
            violations.append({
                "rule": "EXCESSIVE_EXCLAMATION",
                "severity": "LOW",
                "message": f"Contains {excl_count} exclamation marks — may appear unprofessional",
                "detail": "Limit exclamation marks to 1-2 per message for government communications"
            })

        # ── Rule 6: URL / Link Safety ────────────────────────────────
        suspicious_urls = re.findall(r'https?://(?:bit\.ly|tinyurl|goo\.gl|t\.co)\S*', text)
        if suspicious_urls:
            violations.append({
                "rule": "SHORTENED_URL",
                "severity": "MEDIUM",
                "message": f"Contains shortened URL(s): {suspicious_urls[:2]} — use official full URLs",
                "detail": "Government messages should use official domain URLs, not URL shorteners"
            })

        return {
            "ok": len(violations) == 0,
            "violations": violations
        }

    # ═══════════════════════════════════════════════════════════════════
    # CHECK 3: FACTUAL / SAFETY CHECK (LLM)
    # ═══════════════════════════════════════════════════════════════════
    @classmethod
    async def _check_factual(cls, text: str, provider: Optional[str] = None) -> dict:
        """
        Single LLM call to verify the message doesn't contain unverified
        claims, misleading statistics, or unsafe advice.
        Falls back to rule-based heuristic if no API key.
        """
        has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
        has_groq = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())

        if has_gemini or has_groq:
            try:
                return await cls._llm_factual_check(text, provider)
            except Exception as exc:
                logger.warning(f"LLM factual check failed: {exc}. Using rule-based fallback.")

        # Rule-based fallback
        return cls._rule_based_factual(text)

    @classmethod
    async def _llm_factual_check(cls, text: str, provider: Optional[str] = None) -> dict:
        """Call Gemini/Groq to check for unverified claims and unsafe advice."""
        prompt = (
            "You are a government communication compliance reviewer. Analyze the following "
            "broadcast message and return a JSON object with exactly these fields:\n\n"
            "1. \"risk_level\": one of \"LOW\", \"MEDIUM\", or \"HIGH\"\n"
            "2. \"flagged_items\": a JSON array of strings describing any concerning claims "
            "(e.g., \"Unverified statistic: '95% recovery rate'\", "
            "\"Potentially unsafe advice: 'take herbal remedies instead of medication'\")\n"
            "3. \"recommendations\": a JSON array of 1-3 short suggestions to improve factual "
            "accuracy and safety (e.g., \"Add source citation for statistics\", "
            "\"Replace home remedy advice with official medical guidance\")\n\n"
            "If the message is safe and factually sound, return risk_level=\"LOW\" with an empty "
            "flagged_items array.\n\n"
            "Return ONLY valid JSON, no markdown fences, no extra text.\n\n"
            f"MESSAGE:\n\"\"\"\n{text}\n\"\"\""
        )

        generated_text, provider_used, model_used = await LLMClient.generate(
            prompt=prompt,
            provider=provider,
            max_characters=500
        )

        if "mock" in provider_used.lower() or "offline" in str(model_used).lower():
            return cls._rule_based_factual(text)

        # Parse LLM response
        try:
            json_match = re.search(r'\{[^{}]*\}', generated_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
            else:
                data = json.loads(generated_text)

            risk_level = data.get("risk_level", "LOW").upper()
            if risk_level not in ("LOW", "MEDIUM", "HIGH"):
                risk_level = "LOW"

            flagged = data.get("flagged_items", [])
            if not isinstance(flagged, list):
                flagged = [str(flagged)] if flagged else []

            recommendations = data.get("recommendations", [])
            if not isinstance(recommendations, list):
                recommendations = [str(recommendations)] if recommendations else []

            return {
                "ok": risk_level == "LOW",
                "risk_level": risk_level,
                "flagged_items": flagged,
                "recommendations": recommendations,
                "source": f"LLM ({provider_used})"
            }
        except (json.JSONDecodeError, ValueError, KeyError) as exc:
            logger.warning(f"Failed to parse LLM factual response: {exc}. Raw: {generated_text[:200]}")
            # Try to extract risk level from raw text
            risk_level = "LOW"
            for level in ["HIGH", "MEDIUM"]:
                if level in generated_text.upper():
                    risk_level = level
                    break
            return {
                "ok": risk_level == "LOW",
                "risk_level": risk_level,
                "flagged_items": ["LLM response could not be fully parsed — review message manually"],
                "recommendations": ["Manual review recommended"],
                "source": f"LLM ({provider_used}, partial parse)"
            }

    @classmethod
    def _rule_based_factual(cls, text: str) -> dict:
        """Rule-based factual/safety check when no LLM key is available."""
        flagged = []
        text_lower = text.lower()

        # Check for unverified statistics
        stats = re.findall(r'\b\d{1,3}%\b', text)
        for stat in stats:
            flagged.append(f"Unverified statistic: '{stat}' — add a source citation")

        # Check for absolute medical claims
        absolute_phrases = [
            "will cure", "will prevent", "guaranteed to",
            "proven to cure", "eliminates all", "100% safe",
            "no risk", "completely harmless", "always works",
        ]
        for phrase in absolute_phrases:
            if phrase in text_lower:
                flagged.append(f"Absolute medical/safety claim: '{phrase}' — rephrase with appropriate hedging")

        # Check for unattributed quotes
        quotes = re.findall(r'"[^"]{10,}"', text)
        for q in quotes:
            if not any(attr in text_lower for attr in ["according to", "said", "stated", "source:", "—"]):
                flagged.append(f"Unattributed quote found — add source attribution")
                break

        risk_level = "LOW"
        if len(flagged) >= 3:
            risk_level = "HIGH"
        elif len(flagged) >= 1:
            risk_level = "MEDIUM"

        recommendations = []
        if flagged:
            recommendations.append("Review flagged items and add source citations where needed")
            recommendations.append("Consult department subject matter experts before publishing")

        return {
            "ok": risk_level == "LOW",
            "risk_level": risk_level,
            "flagged_items": flagged,
            "recommendations": recommendations,
            "source": "Rule-Based (local)"
        }

    # ═══════════════════════════════════════════════════════════════════
    # OVERALL QUALITY SCORE
    # ═══════════════════════════════════════════════════════════════════
    @classmethod
    def _compute_quality_score(
        cls,
        grammar: dict,
        compliance: dict,
        factual: dict
    ) -> int:
        """
        Combine all check results into a 0-100 quality score.

        Weights:
        - Grammar (30%): Deduct points per error, min 0
        - Compliance (40%): Pass = 100, each violation deducts 25
        - Factual (30%): LOW=100, MEDIUM=50, HIGH=10
        """
        # Grammar score (30%)
        error_count = grammar.get("error_count", 0)
        grammar_score = max(0, 100 - error_count * 15)

        # Compliance score (40%)
        violation_count = len(compliance.get("violations", []))
        high_violations = sum(
            1 for v in compliance.get("violations", [])
            if v.get("severity") == "HIGH"
        )
        compliance_score = max(0, 100 - violation_count * 20 - high_violations * 15)

        # Factual score (30%)
        risk_level = factual.get("risk_level", "LOW")
        factual_score_map = {"LOW": 100, "MEDIUM": 50, "HIGH": 10, "SKIPPED": 80}
        factual_score = factual_score_map.get(risk_level, 70)

        overall = int(grammar_score * 0.30 + compliance_score * 0.40 + factual_score * 0.30)
        return max(0, min(100, overall))
