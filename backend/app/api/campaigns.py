import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.campaign import Campaign, CampaignType, AudienceSegment, CampaignAudience, Language
from app.models.content import CampaignContent
from app.models.recipient import (
    Occupation,
    Organization,
    Recipient,
    AudienceSegmentMember,
    CommunicationTemplate
)
from app.models.admin import Role, Admin
from app.services.security import hash_password, get_current_admin, require_role
from app.schemas.campaign import (
    GenerateContentRequest,
    GenerateContentResponse,
    CampaignBrief,
    TranslateCampaignRequest,
    TranslateCampaignResponse,
    PersonalizeCampaignRequest,
    PersonalizeCampaignResponse,
    SentimentAnalysisRequest,
    SentimentAnalysisResponse,
    QualityCheckRequest,
    QualityCheckResponse
)
from app.services.content_generator import ContentGeneratorService
from app.services.translation_service import TranslationService
from app.services.personalization_service import PersonalizationService
from app.services.sentiment_service import SentimentService
from app.services.quality_service import QualityService

router = APIRouter(prefix="/campaigns", tags=["Campaigns & Multilingual AI Pipeline"])


# ── Create Campaign Schema ─────────────────────
class CreateCampaignRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    campaign_type_id: int = Field(default=1, description="Campaign type ID (1=Awareness, 2=Emergency, 3=Educational)")
    objective: Optional[str] = None
    priority: str = Field(default="NORMAL", description="LOW, NORMAL, HIGH, CRITICAL")
    segment_ids: List[int] = Field(default=[], description="List of audience segment IDs to link")
    channel: Optional[str] = Field(default=None, description="Primary channel: EMAIL, SMS, WHATSAPP, PUSH, WEB, SOCIAL")
    content_body: Optional[str] = Field(default=None, description="Initial campaign message body")
    content_subject: Optional[str] = Field(default=None, description="Initial campaign subject line")


class CreateCampaignResponse(BaseModel):
    success: bool
    campaign_id: int
    campaign_code: str
    name: str
    status: str
    message: str


@router.post(
    "",
    response_model=CreateCampaignResponse,
    summary="Create a new campaign",
    description="Creates a new campaign with the given details, links audience segments, and returns the campaign ID."
)
def create_campaign(request: CreateCampaignRequest, db: Session = Depends(get_db)):
    # Validate campaign type exists
    camp_type = db.query(CampaignType).filter(CampaignType.id == request.campaign_type_id).first()
    if not camp_type:
        raise HTTPException(status_code=400, detail=f"Campaign type ID {request.campaign_type_id} not found.")

    # Generate unique campaign code
    short_id = uuid.uuid4().hex[:6].upper()
    campaign_code = f"CAMP-{short_id}"

    # Create the campaign
    campaign = Campaign(
        campaign_code=campaign_code,
        name=request.name,
        description=request.description,
        campaign_type_id=request.campaign_type_id,
        objective=request.objective or request.description or request.name,
        priority=request.priority.upper(),
        status="DRAFT",
        created_by=1,
    )
    db.add(campaign)
    db.flush()  # Get the ID

    # Link audience segments
    for seg_id in request.segment_ids:
        segment = db.query(AudienceSegment).filter(AudienceSegment.id == seg_id).first()
        if segment:
            mapping = CampaignAudience(campaign_id=campaign.id, segment_id=seg_id)
            db.add(mapping)

    # If content_body is provided, persist initial source content into campaign_contents
    if request.content_body and request.content_body.strip():
        en_lang = db.query(Language).filter(Language.code == "en").first()
        initial_content = CampaignContent(
            campaign_id=campaign.id,
            language_id=en_lang.id if en_lang else 1,
            channel=(request.channel or "SMS").upper(),
            subject=request.content_subject or campaign.name,
            body=request.content_body.strip(),
            ai_generated=False,
            version=1,
            status="DRAFT"
        )
        db.add(initial_content)

    db.commit()
    db.refresh(campaign)

    return CreateCampaignResponse(
        success=True,
        campaign_id=campaign.id,
        campaign_code=campaign.campaign_code,
        name=campaign.name,
        status=campaign.status,
        message=f"Campaign '{campaign.name}' created successfully."
    )


@router.delete(
    "/{id}",
    summary="Delete a campaign",
    description="Deletes a campaign and all its associated contents, audience mappings, etc."
)
def delete_campaign(id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(campaign)
    db.commit()
    return {"success": True, "message": f"Campaign {id} deleted successfully."}


@router.post(
    "/{id}/generate-content",
    response_model=GenerateContentResponse,
    summary="Step 1: AI Content Generation",
    description=(
        "Pulls campaign details (type, objective, target audiences, tone) and prompts an LLM "
        "(Google Gemini Flash or Groq Llama 3) to generate message content. "
        "Saves the response into `campaign_contents` with `language_id = English (1)`, "
        "`ai_generated = TRUE`, and `status = DRAFT`."
    )
)
async def generate_campaign_content(
    id: int,
    request: GenerateContentRequest,
    db: Session = Depends(get_db)
):
    saved_content, provider_used, model_used, prompt_used = (
        await ContentGeneratorService.generate_campaign_content(
            db=db,
            campaign_id=id,
            req=request
        )
    )

    lang_code = "en"
    if saved_content.language:
        lang_code = saved_content.language.code

    return GenerateContentResponse(
        success=True,
        content_id=saved_content.id,
        campaign_id=saved_content.campaign_id,
        language_id=saved_content.language_id,
        language_code=lang_code,
        channel=saved_content.channel,
        subject=saved_content.subject,
        title=saved_content.title,
        body=saved_content.body,
        character_count=len(saved_content.body),
        ai_generated=saved_content.ai_generated,
        version=saved_content.version or 1,
        status=saved_content.status,
        provider_used=provider_used,
        model_used=model_used,
        prompt_used=prompt_used,
        created_at=saved_content.created_at
    )


@router.post(
    "/{id}/translate",
    response_model=TranslateCampaignResponse,
    summary="Step 2: Multilingual Translation (Bhashini / IndicTrans2)",
    description=(
        "Translates campaign content into target Indian languages (Hindi, Kannada, Tamil, Telugu, Marathi, etc.) "
        "using Bhashini (National Language Translation Mission), AI4Bharat IndicTrans2, or Gemini Indic NMT. "
        "Iterates over languages and inserts/updates each translation into `campaign_contents` with "
        "`ai_generated = TRUE` and `status = DRAFT`."
    )
)
async def translate_campaign(
    id: int,
    request: Optional[TranslateCampaignRequest] = None,
    db: Session = Depends(get_db)
):
    req = request or TranslateCampaignRequest()
    return await TranslationService.translate_campaign(
        db=db,
        campaign_id=id,
        req=req
    )


@router.post(
    "/{id}/personalize",
    response_model=PersonalizeCampaignResponse,
    summary="Step 3: Audience Personalization (Jinja2 Dynamic Templating)",
    description=(
        "Swaps in audience-specific wording using Jinja2 dynamic templating. "
        "Pulls recipient attributes (occupation_id, organization_id, city, name) from audience_segments "
        "and recipients, maps to domain phrasing (e.g. students vs employees vs residents), "
        "and updates the personalized text back into campaign_contents.body."
    )
)
def personalize_campaign(
    id: int,
    request: Optional[PersonalizeCampaignRequest] = None,
    db: Session = Depends(get_db)
):
    req = request or PersonalizeCampaignRequest()
    return PersonalizationService.personalize_campaign(
        db=db,
        campaign_id=id,
        req=req
    )


@router.post(
    "/{id}/analyze-sentiment",
    response_model=SentimentAnalysisResponse,
    summary="Step 4: Sentiment & Tone Analysis (VADER + LLM)",
    description=(
        "Analyzes campaign content for sentiment (POSITIVE/NEUTRAL/NEGATIVE) using VADER "
        "(local, zero-cost) and optionally classifies tone + generates actionable improvement "
        "suggestions via the existing Gemini/Groq LLM key. Results are persisted into "
        "`content_quality_reports` with sentiment label, tone, clarity score, and overall score."
    )
)
async def analyze_sentiment(
    id: int,
    request: Optional[SentimentAnalysisRequest] = None,
    db: Session = Depends(get_db)
):
    req = request or SentimentAnalysisRequest()
    return await SentimentService.analyze_campaign(
        db=db,
        campaign_id=id,
        req=req
    )


@router.post(
    "/{id}/quality-check",
    response_model=QualityCheckResponse,
    summary="Step 5: AI Quality & Compliance Check (LanguageTool + Rules + LLM)",
    description=(
        "Runs a full quality pipeline on campaign content: (1) Grammar check via LanguageTool "
        "(public API or local Docker server), (2) Compliance rules engine (banned words, "
        "channel length limits, required disclaimers — pure Python, zero cost), and "
        "(3) Factual/safety verification via Gemini/Groq LLM. Results are persisted into "
        "`content_quality_reports` with grammar_ok, compliance_ok, factual_ok, and detailed issue lists."
    )
)
async def quality_check(
    id: int,
    request: Optional[QualityCheckRequest] = None,
    db: Session = Depends(get_db)
):
    req = request or QualityCheckRequest()
    return await QualityService.check_campaign(
        db=db,
        campaign_id=id,
        req=req
    )


@router.get(
    "",
    response_model=List[CampaignBrief],
    summary="List all campaigns"
)
def list_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).all()
    results = []
    for c in campaigns:
        audiences = [a.segment.name for a in c.audiences if a.segment]
        type_name = c.campaign_type.name if c.campaign_type else "General"
        results.append(
            CampaignBrief(
                id=c.id,
                campaign_code=c.campaign_code,
                name=c.name,
                objective=c.objective,
                priority=c.priority,
                status=c.status,
                campaign_type=type_name,
                target_audiences=audiences
            )
        )
    return results


@router.get(
    "/{id}",
    summary="Get campaign details and contents"
)
def get_campaign(id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    contents = db.query(CampaignContent).filter(CampaignContent.campaign_id == id).all()
    audiences = [a.segment.name for a in campaign.audiences if a.segment]
    
    return {
        "id": campaign.id,
        "campaign_code": campaign.campaign_code,
        "name": campaign.name,
        "description": campaign.description,
        "objective": campaign.objective,
        "campaign_type": campaign.campaign_type.name if campaign.campaign_type else None,
        "priority": campaign.priority,
        "status": campaign.status,
        "target_audiences": audiences,
        "contents": [
            {
                "id": ct.id,
                "language_id": ct.language_id,
                "language": ct.language.name if ct.language else "Unknown",
                "channel": ct.channel,
                "subject": ct.subject,
                "body": ct.body,
                "ai_generated": ct.ai_generated,
                "version": ct.version,
                "status": ct.status,
                "created_at": ct.created_at
            }
            for ct in contents
        ]
    }


@router.post(
    "/seed-sample",
    summary="Seed sample campaign and master data",
    description="Seeds default languages, campaign types, sample audience, and a sample Dengue campaign for testing."
)
def seed_sample_data(db: Session = Depends(get_db)):
    # 0. Roles & Default Admin Account
    role_admin = db.query(Role).filter(Role.role_name == "SUPER_ADMIN").first()
    if not role_admin:
        role_admin = Role(role_name="SUPER_ADMIN", description="Full system administrator access")
        db.add(role_admin)
        db.flush()
    if not db.query(Role).filter(Role.role_name == "ADMIN").first():
        db.add(Role(role_name="ADMIN", description="Standard administrator"))
    if not db.query(Role).filter(Role.role_name == "CAMPAIGN_MANAGER").first():
        db.add(Role(role_name="CAMPAIGN_MANAGER", description="Can create and manage communication campaigns"))
    if not db.query(Role).filter(Role.role_name == "COMMUNICATION_TEAM").first():
        db.add(Role(role_name="COMMUNICATION_TEAM", description="Can draft and review multilingual content"))
    db.flush()

    admin_user = db.query(Admin).filter(Admin.email == "admin@connectai.org").first()
    if not admin_user:
        admin_user = Admin(
            role_id=role_admin.id,
            full_name="System Administrator",
            email="admin@connectai.org",
            password_hash=hash_password("admin123"),
            phone="+919876543210",
            is_active=True
        )
        db.add(admin_user)

    # 1. Languages
    languages_data = [
        {"id": 1, "name": "English", "code": "en", "native_name": "English"},
        {"id": 2, "name": "Hindi", "code": "hi", "native_name": "हिन्दी"},
        {"id": 3, "name": "Kannada", "code": "kn", "native_name": "ಕನ್ನಡ"},
        {"id": 4, "name": "Tamil", "code": "ta", "native_name": "தமிழ்"},
        {"id": 5, "name": "Telugu", "code": "te", "native_name": "తెలుగు"},
        {"id": 6, "name": "Marathi", "code": "mr", "native_name": "मराठी"},
    ]
    for lang in languages_data:
        if not db.query(Language).filter(Language.id == lang["id"]).first():
            db.add(Language(**lang, is_active=True))

    # 2. Campaign Types
    types_data = [
        {"id": 1, "name": "Awareness Campaign", "code": "AWARENESS", "description": "Public health & social drives", "default_priority": "NORMAL"},
        {"id": 2, "name": "Emergency Alert", "code": "EMERGENCY_ALERT", "description": "Disaster and emergency alerts", "default_priority": "CRITICAL"},
        {"id": 3, "name": "Educational Notification", "code": "EDUCATIONAL", "description": "Scholarships and exams", "default_priority": "NORMAL"},
    ]
    for t in types_data:
        if not db.query(CampaignType).filter(CampaignType.id == t["id"]).first():
            db.add(CampaignType(**t, is_active=True))

    # 3. Occupations
    occupations_data = [
        {"id": 1, "name": "Student", "description": "School and college students"},
        {"id": 2, "name": "Teacher", "description": "Primary and secondary educators"},
        {"id": 3, "name": "Doctor", "description": "Medical doctors and healthcare workers"},
        {"id": 4, "name": "Employee", "description": "Corporate and government employees"},
        {"id": 5, "name": "Resident", "description": "General resident / household head"},
    ]
    for occ in occupations_data:
        if not db.query(Occupation).filter(Occupation.id == occ["id"]).first():
            db.add(Occupation(**occ, is_active=True))

    # 4. Organizations
    orgs_data = [
        {"id": 1, "name": "State University Campus", "code": "STATE_UNIV", "description": "Higher education university"},
        {"id": 2, "name": "District Tech Park", "code": "TECH_PARK", "description": "IT and corporate offices"},
        {"id": 3, "name": "City Health Administration", "code": "HEALTH_ADMIN", "description": "Public health network"},
    ]
    for org in orgs_data:
        if not db.query(Organization).filter(Organization.id == org["id"]).first():
            db.add(Organization(**org, is_active=True))

    # 5. Audience Segments
    segments_data = [
        {"id": 1, "name": "General Public & Families", "description": "Residents across urban and semi-urban districts"},
        {"id": 2, "name": "Students & Youth", "description": "College and university students in hostels and campus"},
        {"id": 3, "name": "Corporate Workforce", "description": "Office and IT park employees"},
    ]
    for s_data in segments_data:
        if not db.query(AudienceSegment).filter(AudienceSegment.id == s_data["id"]).first():
            db.add(AudienceSegment(
                id=s_data["id"],
                name=s_data["name"],
                description=s_data["description"],
                segment_type="DYNAMIC",
                status="ACTIVE",
                created_by=1
            ))

    # 6. Sample Recipients
    recipients_data = [
        {"id": 1, "first_name": "Aarav", "last_name": "Verma", "email": "aarav.student@univ.edu", "phone_number": "+919876543210", "occupation_id": 1, "organization_id": 1, "city": "Bengaluru", "preferred_language_id": 1},
        {"id": 2, "first_name": "Priya", "last_name": "Nair", "email": "priya.nair@corp.com", "phone_number": "+919876543211", "occupation_id": 4, "organization_id": 2, "city": "Bengaluru", "preferred_language_id": 1},
        {"id": 3, "first_name": "Suresh", "last_name": "Patil", "email": "suresh.patil@karnataka.gov.in", "phone_number": "+919876543212", "occupation_id": 5, "organization_id": 3, "city": "Mysuru", "preferred_language_id": 3},
    ]
    for r_data in recipients_data:
        if not db.query(Recipient).filter(Recipient.id == r_data["id"]).first():
            db.add(Recipient(**r_data, status="ACTIVE"))

    # 7. Audience Segment Memberships
    memberships = [
        {"segment_id": 1, "recipient_id": 3},
        {"segment_id": 2, "recipient_id": 1},  # Aarav in Students segment
        {"segment_id": 3, "recipient_id": 2},  # Priya in Corporate segment
    ]
    for m in memberships:
        if not db.query(AudienceSegmentMember).filter(
            AudienceSegmentMember.segment_id == m["segment_id"],
            AudienceSegmentMember.recipient_id == m["recipient_id"]
        ).first():
            db.add(AudienceSegmentMember(**m))

    # 8. Communication Templates
    if not db.query(CommunicationTemplate).filter(CommunicationTemplate.id == 1).first():
        db.add(CommunicationTemplate(
            id=1,
            name="Vector Control Health Advisory Template",
            description="Personalized template for vector-borne disease alerts",
            template_type="AWARENESS",
            channel="SMS",
            language_id=1,
            subject_template="Important Alert for {{ audience_group }} in {{ city }}",
            body_template="[{{ audience_salutation }}] {{ action_advice }} Please take precautions across {{ location }}. Emergency helpline: {{ helpline }}.",
            variables=["audience_group", "audience_salutation", "location", "action_advice", "city", "helpline"],
            version=1,
            status="PUBLISHED"
        ))

    # 9. Sample Campaign
    camp = db.query(Campaign).filter(Campaign.id == 1).first()
    if not camp:
        camp = Campaign(
            id=1,
            campaign_code="CAMP-DENGUE-2026",
            name="Monsoon Dengue Prevention & Vector Control",
            description="Urgent awareness drive to eliminate stagnant water and mosquito breeding sources",
            campaign_type_id=1,
            objective="Prevent mosquito breeding during monsoon, empty stagnant water containers, and seek early medical attention for dengue fever",
            priority="HIGH",
            status="DRAFT",
            created_by=1
        )
        db.add(camp)
        db.flush()

        # Link segment 1 to campaign
        mapping = CampaignAudience(campaign_id=camp.id, segment_id=1)
        db.add(mapping)

    db.commit()
    return {"message": "Sample master data, audiences, recipients, templates, and campaign successfully seeded", "campaign_id": 1}


# ══════════════════════════════════════════════════════════════════════
# Campaign Approval Workflow
# ══════════════════════════════════════════════════════════════════════

class RejectCampaignRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=1000, description="Reason for rejecting the campaign")


@router.post(
    "/{id}/submit-for-approval",
    summary="Submit campaign for admin approval",
    description="Campaign Manager submits a DRAFT or REJECTED campaign for admin review. Status changes to PENDING_APPROVAL."
)
def submit_for_approval(
    id: int,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_current_admin),
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status not in ("DRAFT", "REJECTED"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit campaign with status '{campaign.status}'. Only DRAFT or REJECTED campaigns can be submitted."
        )

    campaign.status = "PENDING_APPROVAL"
    campaign.rejection_reason = None  # Clear old rejection reason
    campaign.updated_at = __import__("datetime").datetime.utcnow()
    db.commit()
    db.refresh(campaign)

    return {
        "success": True,
        "campaign_id": campaign.id,
        "status": campaign.status,
        "message": f"Campaign '{campaign.name}' submitted for admin approval."
    }


@router.post(
    "/{id}/approve",
    summary="Approve a pending campaign (Admin only)",
    description="Admin approves a PENDING_APPROVAL campaign, changing its status to APPROVED and unlocking dispatch."
)
def approve_campaign(
    id: int,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(require_role("ADMIN", "SUPER_ADMIN")),
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "PENDING_APPROVAL":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve campaign with status '{campaign.status}'. Only PENDING_APPROVAL campaigns can be approved."
        )

    now = __import__("datetime").datetime.utcnow()
    campaign.status = "APPROVED"
    campaign.approved_by = current_user.id
    campaign.approved_at = now
    campaign.rejection_reason = None
    campaign.updated_at = now
    db.commit()
    db.refresh(campaign)

    approver_name = current_user.full_name
    return {
        "success": True,
        "campaign_id": campaign.id,
        "status": campaign.status,
        "approved_by": approver_name,
        "approved_at": str(campaign.approved_at),
        "message": f"Campaign '{campaign.name}' approved by {approver_name}."
    }


@router.post(
    "/{id}/reject",
    summary="Reject a pending campaign (Admin only)",
    description="Admin rejects a PENDING_APPROVAL campaign with a reason. Campaign Manager can then revise and re-submit."
)
def reject_campaign(
    id: int,
    request: RejectCampaignRequest,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(require_role("ADMIN", "SUPER_ADMIN")),
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "PENDING_APPROVAL":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject campaign with status '{campaign.status}'. Only PENDING_APPROVAL campaigns can be rejected."
        )

    now = __import__("datetime").datetime.utcnow()
    campaign.status = "REJECTED"
    campaign.rejection_reason = request.reason
    campaign.approved_by = current_user.id
    campaign.approved_at = now
    campaign.updated_at = now
    db.commit()
    db.refresh(campaign)

    return {
        "success": True,
        "campaign_id": campaign.id,
        "status": campaign.status,
        "rejection_reason": campaign.rejection_reason,
        "message": f"Campaign '{campaign.name}' rejected. Reason: {request.reason}"
    }


@router.get(
    "/pending-approvals",
    summary="List campaigns pending admin approval",
    description="Returns all campaigns with status PENDING_APPROVAL. Admin-only endpoint."
)
def list_pending_approvals(
    db: Session = Depends(get_db),
    current_user: Admin = Depends(require_role("ADMIN", "SUPER_ADMIN")),
):
    campaigns = (
        db.query(Campaign)
        .filter(Campaign.status == "PENDING_APPROVAL")
        .order_by(Campaign.updated_at.desc())
        .all()
    )

    results = []
    for c in campaigns:
        creator = db.query(Admin).filter(Admin.id == c.created_by).first()
        camp_type = db.query(CampaignType).filter(CampaignType.id == c.campaign_type_id).first()
        results.append({
            "id": c.id,
            "campaign_code": c.campaign_code,
            "name": c.name,
            "description": c.description,
            "priority": c.priority,
            "status": c.status,
            "campaign_type": camp_type.name if camp_type else "Unknown",
            "created_by_name": creator.full_name if creator else "Unknown",
            "created_at": str(c.created_at) if c.created_at else None,
            "updated_at": str(c.updated_at) if c.updated_at else None,
        })

    return results

