import logging
import json
import httpx
from typing import Tuple, Optional
from app.config import settings

logger = logging.getLogger("uvicorn")


class LLMClient:
    """
    Client for Free LLM APIs:
    - Google Gemini API (Recommended free tier: 1,500 req/day on Gemini Flash)
    - Groq API (High speed open models: Llama 3.3/3.1)
    - Built-in Realistic Mock Generator (Fallback when API keys are not yet configured)
    """

    @classmethod
    async def generate(
        cls,
        prompt: str,
        provider: Optional[str] = None,
        max_characters: int = 300,
        campaign_context: Optional[dict] = None
    ) -> Tuple[str, str, str]:
        """
        Executes prompt on selected provider.
        Returns: (generated_text, provider_name, model_name)
        """
        chosen_provider = (provider or settings.AI_PROVIDER or "gemini").lower()

        # 1. Try Gemini if configured or requested
        if chosen_provider == "gemini":
            if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
                try:
                    text = await cls._call_gemini(prompt)
                    return text, "Google Gemini", settings.GEMINI_MODEL
                except Exception as exc:
                    logger.warning(f"Gemini API call failed: {exc}. Falling back...")
            else:
                logger.info("GEMINI_API_KEY not configured. Falling back to local high-fidelity generator.")

        # 2. Try Groq if configured or requested
        elif chosen_provider == "groq":
            if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
                try:
                    text = await cls._call_groq(prompt)
                    return text, "Groq (Llama 3)", settings.GROQ_MODEL
                except Exception as exc:
                    logger.warning(f"Groq API call failed: {exc}. Falling back...")
            else:
                logger.info("GROQ_API_KEY not configured. Falling back to local high-fidelity generator.")

        # 3. Fallback: If Gemini was default but Groq has key, try Groq
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
            try:
                text = await cls._call_groq(prompt)
                return text, "Groq (Llama 3)", settings.GROQ_MODEL
            except Exception as exc:
                logger.warning(f"Groq fallback failed: {exc}")

        # 4. Realistic Local AI Generator (Fallback)
        text = cls._generate_mock(prompt, campaign_context, max_characters)
        return text, "Local Intelligent Mock (set GEMINI_API_KEY or GROQ_API_KEY in .env)", "offline-simulated-llm"

    @classmethod
    async def _call_gemini(cls, prompt: str) -> str:
        """Call Google Gemini Flash via REST API with smart model fallback."""
        candidate_models = [
            settings.GEMINI_MODEL,
            "gemini-2.5-flash",
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-1.5-flash"
        ]
        # remove empty or duplicates while preserving order
        candidate_models = list(dict.fromkeys([m for m in candidate_models if m]))

        system_instruction = (
            "You are an expert government and public welfare communication specialist. "
            "Write concise, clear, and impactful broadcast messages adhering strictly to character limits. "
            "Do not include conversational filler or markdown fences. Output only the campaign text."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\nTask: {prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 300
            }
        }

        last_error = None
        async with httpx.AsyncClient(timeout=25.0) as client:
            for model in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
                try:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidate = data["candidates"][0]["content"]["parts"][0]["text"]
                        return candidate.strip()
                    elif response.status_code == 404:
                        logger.info(f"Model {model} returned 404, trying next available model...")
                        continue
                    else:
                        response.raise_for_status()
                except Exception as e:
                    last_error = e
                    continue

        if last_error:
            raise last_error
        raise RuntimeError("All candidate Gemini models failed to respond.")

    @classmethod
    async def _call_groq(cls, prompt: str) -> str:
        """Call Groq API (Llama 3.3/3.1) via OpenAI-compatible endpoint."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL or "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert government and public sector mass communication copywriter. "
                        "Write clear, impactful messages adhering strictly to character limits. "
                        "Return only the message text without extra preamble."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 300
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    @classmethod
    def _generate_mock(cls, prompt: str, ctx: Optional[dict], max_chars: int) -> str:
        """Generate high-quality context-aware message when no API key is provided."""
        ctx = ctx or {}
        topic = ctx.get("objective") or ctx.get("name") or "Public Awareness Alert"
        tone = (ctx.get("tone") or "Informative").upper()
        camp_type = ctx.get("campaign_type") or "Awareness"
        channel = ctx.get("channel") or "SMS"
        audiences = ctx.get("audiences") or "citizens"

        if "dengue" in topic.lower() or "health" in topic.lower():
            if "URGENT" in tone:
                msg = (
                    "URGENT HEALTH NOTICE: Protect your family from Dengue! "
                    "Ensure no stagnant water in coolers/pots. Use mosquito nets & repellents. "
                    "Report high fever immediately. Helpline: 104."
                )
            else:
                msg = (
                    "Public Health Advisory: Prevent mosquito breeding by emptying standing water weekly. "
                    "Stay protected with mosquito repellents and wear covered clothing. "
                    "Free health checkups available at nearest PHC. Call 104 for support."
                )
        elif "flood" in topic.lower() or "emergency" in topic.lower():
            msg = (
                "EMERGENCY ADVISORY: Heavy rainfall & flood alert in your district. "
                "Move to designated higher shelter zones. Keep emergency kits ready. "
                "Do not enter flooded roads. State Disaster Helpline: 1070 / 112."
            )
        elif "education" in topic.lower() or "scholarship" in topic.lower():
            msg = (
                f"Notice for {audiences}: National scholarship & educational portal registration is now open. "
                "Submit your application and verified documents before the upcoming deadline. "
                "Visit the official portal or your school office for guidance."
            )
        else:
            msg = (
                f"PUBLIC NOTICE ({camp_type.upper()}): {topic}. "
                f"Attention {audiences}: Please follow official department guidelines. "
                "For inquiries and verified updates, contact your district administrative office."
            )

        # Truncate to limit if needed
        if len(msg) > max_chars:
            msg = msg[:max_chars - 3].rstrip() + "..."
        return msg
