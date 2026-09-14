import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from jinja2 import Environment, BaseLoader
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.campaign import Campaign, AudienceSegment, CampaignAudience, Language
from app.models.content import CampaignContent
from app.models.recipient import (
    Recipient,
    Occupation,
    Organization,
    AudienceSegmentMember,
    CommunicationTemplate
)
from app.schemas.campaign import (
    PersonalizeCampaignRequest,
    PersonalizeCampaignResponse,
    PersonalizedContentItem
)

logger = logging.getLogger("uvicorn")

# Predefined audience-specific phrasing profiles based on occupation
OCCUPATION_PHRASING_MAP = {
    "student": {
        "audience_group": "students",
        "salutation": "Dear Student",
        "location": "campus, hostels, and classrooms",
        "action_advice": "Report any sudden fever to the campus medical clinic and keep dorm coolers dry.",
        "i18n": {
            "hi": {
                "audience_group": "छात्रों",
                "salutation": "प्रिय छात्र",
                "location": "परिसर, छात्रावास एवं कक्षाओं"
            },
            "kn": {
                "audience_group": "ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ",
                "salutation": "ಆತ್ಮೀಯ ವಿದ್ಯಾರ್ಥಿ",
                "location": "ಕ್ಯಾಂಪಸ್, ಹಾಸ್ಟೆಲ್ ಮತ್ತು ತರಗತಿ ಕೊಠಡಿಗಳು"
            },
            "ta": {
                "audience_group": "மாணவர்களே",
                "salutation": "அன்புள்ள மாணவரே",
                "location": "கல்லூரி வளாகம் மற்றும் விடுதிகள்"
            },
            "te": {
                "audience_group": "విద్యార్థులారా",
                "salutation": "ప్రియమైన విద్యార్థి",
                "location": "క్యాంపస్ మరియు హాస్టళ్లు"
            },
            "mr": {
                "audience_group": "विद्यार्थ्यांनो",
                "salutation": "प्रिय विद्यार्थी",
                "location": "परिसर व वसतिगृह"
            }
        }
    },
    "teacher": {
        "audience_group": "teachers & faculty",
        "salutation": "Respected Teachers",
        "location": "school premises, staff rooms, and classrooms",
        "action_advice": "Guide students on hygiene protocols and ensure playground drains are unblocked.",
        "i18n": {
            "hi": {
                "audience_group": "शिक्षकों एवं प्राध्यापकों",
                "salutation": "आदरणीय शिक्षक",
                "location": "विद्यालय परिसर एवं स्टाफ रूम"
            },
            "kn": {
                "audience_group": "ಶಿಕ್ಷಕರು ಮತ್ತು ಪ್ರಾಧ್ಯಾಪಕರಿಗೆ",
                "salutation": "ಗೌರವಾನ್ವಿತ ಶಿಕ್ಷಕರೇ",
                "location": "ಶಾಲಾ ಆವರಣ ಮತ್ತು ಕೊಠಡಿಗಳು"
            },
            "ta": {
                "audience_group": "ஆசிரிய பெருமக்களே",
                "salutation": "மதிப்பிற்குரிய ஆசிரியரே",
                "location": "பள்ளி வளாகம் மற்றும் வகுப்பறைகள்"
            },
            "te": {
                "audience_group": "ఉపాధ్యాయులారా",
                "salutation": "గౌరవనీయ ఉపాధ్యాయులు",
                "location": "పాఠశాల ఆవరణ"
            },
            "mr": {
                "audience_group": "शिक्षकांनो",
                "salutation": "आदरणीय शिक्षक",
                "location": "शाळा परिसर"
            }
        }
    },
    "employee": {
        "audience_group": "employees & team members",
        "salutation": "Dear Colleague",
        "location": "office facilities, workstations, and cafeterias",
        "action_advice": "Check air-conditioning condenser trays and indoor potted plants for stagnant water.",
        "i18n": {
            "hi": {
                "audience_group": "कर्मचारियों एवं सहयोगियों",
                "salutation": "प्रिय सहकर्मी",
                "location": "कार्यालय एवं कार्यस्थल"
            },
            "kn": {
                "audience_group": "ನೌಕರರಿಗೆ ಮತ್ತು ಸಿಬ್ಬಂದಿಗಳಿಗೆ",
                "salutation": "ಆತ್ಮೀಯ ಸಹೋದ್ಯೋಗಿ",
                "location": "ಕಚೇರಿ ಮತ್ತು ಕೆಲಸದ ಸ್ಥಳ"
            },
            "ta": {
                "audience_group": "ஊழியர்களே",
                "salutation": "அன்புள்ள சக ஊழியரே",
                "location": "அலுவலக வளாகம்"
            },
            "te": {
                "audience_group": "ఉద్యోగులారా",
                "salutation": "ప్రియమైన సహోద్యోగి",
                "location": "కార్యాలయ ప్రాంగణం"
            },
            "mr": {
                "audience_group": "कर्मचाऱ्यांनो",
                "salutation": "प्रिय सहकारी",
                "location": "कार्यालय परिसर"
            }
        }
    },
    "doctor": {
        "audience_group": "healthcare professionals",
        "salutation": "Dear Doctor / Healthcare Professional",
        "location": "hospitals, primary health centres, and clinics",
        "action_advice": "Ensure fever triage beds and rapid test kits are fully stocked.",
        "i18n": {
            "hi": {
                "audience_group": "चिकित्सकों एवं स्वास्थ्य कर्मियों",
                "salutation": "आदरणीय चिकित्सक",
                "location": "अस्पताल एवं स्वास्थ्य केंद्र"
            },
            "kn": {
                "audience_group": "ವೈದ್ಯರು ಮತ್ತು ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರಿಗೆ",
                "salutation": "ಗೌರವಾನ್ವಿತ ವೈದ್ಯರೇ",
                "location": "ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಚಿಕಿತ್ಸಾಲಯಗಳು"
            },
            "ta": {
                "audience_group": "மருத்துவர்கள் மற்றும் சுகாதார பணியாளர்களே",
                "salutation": "மதிப்பிற்குரிய மருத்துவருக்கு",
                "location": "மருத்துவமனைகள் மற்றும் ஆரம்ப சுகாதார நிலையங்கள்"
            },
            "te": {
                "audience_group": "వైద్యులు మరియు ఆరోగ్య కార్యకర్తలారా",
                "salutation": "గౌరవనీయ వైద్యులు",
                "location": "ఆసుపత్రులు మరియు ఆరోగ్య కేంద్రాలు"
            },
            "mr": {
                "audience_group": "डॉक्टर्स आणि आरोग्य कर्मचाऱ्यांनो",
                "salutation": "आदरणीय डॉक्टर",
                "location": "रुग्णालये व प्राथमिक आरोग्य केंद्र"
            }
        }
    },
    "resident": {
        "audience_group": "residents & families",
        "salutation": "Dear Resident",
        "location": "homes, balconies, and neighborhood",
        "action_advice": "Empty water coolers, inspect flower pot saucers, and wear mosquito repellent.",
        "i18n": {
            "hi": {
                "audience_group": "नागरिकों एवं परिवारों",
                "salutation": "प्रिय निवासी",
                "location": "घरों, बालकनियों एवं आस-पड़ोस"
            },
            "kn": {
                "audience_group": "ನಿವಾಸಿಗಳಿಗೆ ಮತ್ತು ಕುಟುಂಬಗಳಿಗೆ",
                "salutation": "ಆತ್ಮೀಯ ನಿವಾಸಿ",
                "location": "ಮನೆಗಳು, ಬಾಲ್ಕನಿಗಳು ಮತ್ತು ನೆರೆಹೊರೆ"
            },
            "ta": {
                "audience_group": "குடிமக்களே",
                "salutation": "அன்புள்ள குடியிருப்போரே",
                "location": "வீடுகள் மற்றும் குடியிருப்பு பகுதிகள்"
            },
            "te": {
                "audience_group": "పౌరులారా",
                "salutation": "ప్రియమైన నివాసి",
                "location": "ఇళ్ళు మరియు పరిసరాలు"
            },
            "mr": {
                "audience_group": "नागरिकांनो",
                "salutation": "प्रिय रहिवासी",
                "location": "घरे व परिसर"
            }
        }
    }
}


class PersonalizationService:
    """
    Step 3 — Audience Personalization Engine
    Uses Python Jinja2 dynamic templating to swap audience-specific wording,
    recipient attributes, and organization details into campaign content bodies.
    """

    jinja_env = Environment(loader=BaseLoader(), autoescape=False)

    @classmethod
    def render_template_string(cls, template_str: str, context: Dict[str, Any]) -> str:
        """Renders a Jinja2 template string safely using provided context variables."""
        if not template_str:
            return ""
        try:
            template = cls.jinja_env.from_string(template_str)
            return template.render(**context).strip()
        except Exception as exc:
            logger.warning(f"Jinja2 rendering error: {exc}. Returning original template string.")
            return template_str

    @classmethod
    def derive_phrasing(
        cls,
        occupation_name: Optional[str] = None,
        org_name: Optional[str] = None,
        lang_code: str = "en"
    ) -> Dict[str, str]:
        """
        Derives tailored phrasing for the audience group based on occupation and organization.
        Supports localized phrasing for Indian languages (hi, kn, ta, te, mr).
        """
        occ_key = "resident"
        if occupation_name:
            norm = occupation_name.lower()
            for key in OCCUPATION_PHRASING_MAP.keys():
                if key in norm:
                    occ_key = key
                    break

        profile = OCCUPATION_PHRASING_MAP.get(occ_key, OCCUPATION_PHRASING_MAP["resident"])

        # Check for localized phrasing if target language is not English
        if lang_code != "en" and "i18n" in profile and lang_code in profile["i18n"]:
            loc = profile["i18n"][lang_code]
            return {
                "audience_group": loc.get("audience_group", profile["audience_group"]),
                "salutation": loc.get("salutation", profile["salutation"]),
                "location": loc.get("location", profile["location"]),
                "action_advice": profile["action_advice"],
                "occupation": occupation_name or "Resident",
                "organization": org_name or ""
            }

        return {
            "audience_group": profile["audience_group"],
            "salutation": profile["salutation"],
            "location": profile["location"],
            "action_advice": profile["action_advice"],
            "occupation": occupation_name or "Resident",
            "organization": org_name or ""
        }

    @classmethod
    def personalize_campaign(
        cls,
        db: Session,
        campaign_id: int,
        req: PersonalizeCampaignRequest
    ) -> PersonalizeCampaignResponse:
        """
        Executes Step 3: Swaps audience-specific phrasing into campaign contents using Jinja2.
        Reads audience_segments + recipients, fills in template variables, and writes back into campaign_contents.body.
        """
        # 1. Fetch Campaign
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail=f"Campaign with ID {campaign_id} not found.")

        # 2. Resolve Audience Segment
        segment = None
        if req.segment_id:
            segment = db.query(AudienceSegment).filter(AudienceSegment.id == req.segment_id).first()
            if not segment:
                raise HTTPException(status_code=404, detail=f"Audience Segment {req.segment_id} not found.")
        else:
            # Pick campaign's first linked audience segment
            camp_aud = db.query(CampaignAudience).filter(CampaignAudience.campaign_id == campaign_id).first()
            if camp_aud and camp_aud.segment:
                segment = camp_aud.segment
            else:
                segment = db.query(AudienceSegment).first()

        segment_id = segment.id if segment else None
        segment_name = segment.name if segment else "General Audience"

        # 3. Query Recipient(s) for the segment to derive profiles
        sample_recipient = None
        recipients_count = 0

        if req.recipient_id:
            sample_recipient = db.query(Recipient).filter(Recipient.id == req.recipient_id).first()
            if sample_recipient:
                recipients_count = 1

        if not sample_recipient and segment:
            members = (
                db.query(Recipient)
                .join(AudienceSegmentMember, AudienceSegmentMember.recipient_id == Recipient.id)
                .filter(AudienceSegmentMember.segment_id == segment.id)
                .all()
            )
            recipients_count = len(members)
            if members:
                sample_recipient = members[0]

        # Fallback to any active recipient if segment has no linked members
        if not sample_recipient:
            sample_recipient = db.query(Recipient).filter(Recipient.status == "ACTIVE").first()
            if sample_recipient:
                recipients_count = 1

        # Extract occupation and organization details
        occ_name = "Resident"
        org_name = ""
        recipient_name = "Citizen"
        first_name = "Citizen"
        city = "your district"

        if sample_recipient:
            recipient_name = f"{sample_recipient.first_name} {sample_recipient.last_name or ''}".strip()
            first_name = sample_recipient.first_name
            city = sample_recipient.city or city
            if sample_recipient.occupation:
                occ_name = sample_recipient.occupation.name
            if sample_recipient.organization:
                org_name = sample_recipient.organization.name

        # If segment name explicitly hints at audience (e.g., "Students & Youth")
        if segment_name and "student" in segment_name.lower():
            occ_name = "Student"
        elif segment_name and "teacher" in segment_name.lower():
            occ_name = "Teacher"
        elif segment_name and ("employee" in segment_name.lower() or "corporate" in segment_name.lower()):
            occ_name = "Employee"

        # 4. Derive Base Phrasing (English)
        phrasing = cls.derive_phrasing(occupation_name=occ_name, org_name=org_name, lang_code="en")

        # 5. Check if a Communication Template is specified
        comm_template = None
        if req.template_id:
            comm_template = db.query(CommunicationTemplate).filter(CommunicationTemplate.id == req.template_id).first()

        # 6. Fetch Campaign Contents to Personalize
        content_query = db.query(CampaignContent).filter(CampaignContent.campaign_id == campaign_id)
        if req.language_id:
            content_query = content_query.filter(CampaignContent.language_id == req.language_id)
        contents = content_query.all()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"No campaign contents found for campaign {campaign_id}. "
                    f"Please run Step 1 (POST /campaigns/{campaign_id}/generate-content) and "
                    f"Step 2 (POST /campaigns/{campaign_id}/translate) first."
                )
            )

        # 7. Iterate and Personalize each content body
        personalized_results: List[PersonalizedContentItem] = []

        for item in contents:
            lang_code = item.language.code if item.language else "en"
            localized_phrasing = cls.derive_phrasing(
                occupation_name=occ_name,
                org_name=org_name,
                lang_code=lang_code
            )

            # Build rendering context for Jinja2
            render_context: Dict[str, Any] = {
                "recipient_name": recipient_name,
                "first_name": first_name,
                "audience_group": localized_phrasing["audience_group"],
                "audience_salutation": localized_phrasing["salutation"],
                "location": localized_phrasing["location"],
                "action_advice": localized_phrasing["action_advice"],
                "city": city,
                "organization_name": org_name or ("Your Organization" if lang_code == "en" else "संस्था"),
                "campaign_name": campaign.name,
                "helpline": "104",
                "emergency_helpline": "1070",
                "action_url": "https://mohfw.gov.in"
            }

            # Apply any custom variables supplied by caller
            if req.custom_variables:
                render_context.update(req.custom_variables)

            # Determine base text to personalize
            target_body = item.body
            target_subject = item.subject or campaign.name

            # If a communication_template was provided and matches the language
            if comm_template and (comm_template.language_id == item.language_id or lang_code == "en"):
                target_body = comm_template.body_template
                if comm_template.subject_template:
                    target_subject = comm_template.subject_template

            # If body has Jinja2 variables ({{ ... }}), render directly
            if "{{" in target_body:
                personalized_body = cls.render_template_string(target_body, render_context)
            else:
                # Swaps/injects audience-specific wording dynamically into the message
                salutation = render_context["audience_salutation"]
                loc = render_context["location"]
                group = render_context["audience_group"]

                if lang_code == "en":
                    # Swaps generic address with specific audience wording
                    personalized_body = (
                        f"[{salutation}] Attention {group}: {target_body} "
                        f"Please take proactive care across {loc}."
                    )
                elif lang_code == "hi":
                    personalized_body = (
                        f"[{salutation}] {group} के लिए विशेष सूचना: {target_body} "
                        f"कृपया {loc} में स्वच्छता सुनिश्चित करें।"
                    )
                elif lang_code == "kn":
                    personalized_body = (
                        f"[{salutation}] {group}: {target_body} "
                        f"ದಯವಿಟ್ಟು {loc} ಸ್ವಚ್ಛವಾಗಿಡಿ."
                    )
                elif lang_code == "ta":
                    personalized_body = (
                        f"[{salutation}] {group}: {target_body} "
                        f"{loc} தூய்மையாக வைத்திருங்கள்."
                    )
                elif lang_code == "te":
                    personalized_body = (
                        f"[{salutation}] {group}: {target_body} "
                        f"దయచేసి {loc} వద్ద పరిశుభ్రత పాటించండి."
                    )
                elif lang_code == "mr":
                    personalized_body = (
                        f"[{salutation}] {group}: {target_body} "
                        f"कृपया {loc} परिसर स्वच्छ ठेवा."
                    )
                else:
                    personalized_body = f"[{salutation}] {target_body}"

            # Personalize subject line if it contains variables
            if "{{" in target_subject:
                personalized_subject = cls.render_template_string(target_subject, render_context)
            else:
                personalized_subject = target_subject

            # 8. Write personalized text back into campaign_contents
            item.body = personalized_body
            item.subject = personalized_subject
            item.version = (item.version or 1) + 1
            item.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(item)

            personalized_results.append(
                PersonalizedContentItem(
                    content_id=item.id,
                    language_id=item.language_id,
                    language_code=lang_code,
                    channel=item.channel,
                    subject=item.subject,
                    body=item.body,
                    character_count=len(item.body),
                    version=item.version or 1,
                    variables_applied=render_context,
                    updated_at=datetime.utcnow()
                )
            )

        return PersonalizeCampaignResponse(
            success=True,
            campaign_id=campaign_id,
            segment_id=segment_id,
            segment_name=segment_name,
            recipients_analyzed=recipients_count,
            phrasing_selected=phrasing,
            contents_personalized=personalized_results,
            total_updated=len(personalized_results)
        )
