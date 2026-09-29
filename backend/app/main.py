import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import engine, Base, SessionLocal
from app.models import campaign, content
from app.api.campaigns import router as campaigns_router, seed_sample_data
from app.api.ai_generator import router as ai_router
from app.api.dashboard import router as dashboard_router
from app.api.audiences import router as audiences_router
from app.api.channels import router as channels_router
from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.crisis_monitor import router as crisis_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes tables and seeds sample data on server startup."""
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    # Automatically seed sample master data and test campaign if empty
    db = SessionLocal()
    try:
        seed_sample_data(db)
        logger.info("Database initialized and verified.")
    except Exception as exc:
        logger.warning(f"Could not auto-seed database: {exc}")
    finally:
        db.close()

    yield
    logger.info("Shutting down API server...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "### AI-Based Multilingual Mass Communication Platform\n"
        "**Milestone 2 - Steps 1–5: Generation, Translation, Personalization, Sentiment & Quality**\n\n"
        "- **Step 1:** AI Content Generation (`POST /campaigns/{id}/generate-content`) [ACTIVE]\n"
        "- **Step 2:** Multilingual Translation (`POST /campaigns/{id}/translate`) (Bhashini / AI4Bharat IndicTrans2 / Gemini) [ACTIVE]\n"
        "- **Step 3:** Audience Personalization (`POST /campaigns/{id}/personalize`) (Jinja2 dynamic templating) [ACTIVE]\n"
        "- **Step 4:** Sentiment & Tone Analysis (`POST /campaigns/{id}/analyze-sentiment`) (VADER + Gemini/Groq LLM) [ACTIVE]\n"
        "- **Step 5:** AI Quality & Compliance Check (`POST /campaigns/{id}/quality-check`) (LanguageTool + Rules + LLM) [ACTIVE]\n"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(campaigns_router)
app.include_router(ai_router)
app.include_router(dashboard_router)
app.include_router(audiences_router)
app.include_router(channels_router)
app.include_router(analytics_router)
app.include_router(auth_router)
app.include_router(crisis_router)
app.include_router(crisis_router, prefix="/api")


@app.get("/", tags=["Health & Status"])
def root():
    return {
        "status": "online",
        "active_modules": [
            "Step 1: AI Content Generation",
            "Step 2: Multilingual Translation (Bhashini / IndicTrans2)",
            "Step 3: Audience Personalization (Jinja2 Dynamic Templating)",
            "Step 4: Sentiment & Tone Analysis (VADER + Gemini/Groq LLM)",
            "Step 5: Quality & Compliance Check (LanguageTool + Rules + LLM)"
        ],
        "configured_llm_provider": settings.AI_PROVIDER,
        "configured_translation_provider": settings.TRANSLATION_PROVIDER,
        "gemini_configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip()),
        "groq_configured": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip()),
        "bhashini_configured": bool(settings.BHASHINI_USER_ID and settings.BHASHINI_API_KEY),
        "indictrans2_hf_configured": bool(settings.HUGGINGFACE_API_KEY and settings.HUGGINGFACE_API_KEY.strip()),
        "vader_available": True,
        "languagetool_url": settings.LANGUAGETOOL_URL,
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Health & Status"])
def health():
    return {"status": "healthy"}
