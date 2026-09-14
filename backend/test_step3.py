import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal, Base, engine
from app.models.content import CampaignContent
from app.models.recipient import Recipient, Occupation, AudienceSegmentMember, CommunicationTemplate
from app.api.campaigns import seed_sample_data


def run_test():
    # 1. Initialize schema and seed master data
    Base.metadata.create_all(bind=engine)
    db_init = SessionLocal()
    try:
        seed_sample_data(db_init)
    finally:
        db_init.close()

    with TestClient(app) as client:
        # Check health endpoint
        res = client.get("/")
        assert res.status_code == 200, f"Root failed: {res.text}"
        data = res.json()
        print("[OK] Health check passed:", data)
        assert "Step 3: Audience Personalization (Jinja2 Dynamic Templating)" in data["active_modules"]

        # 2. Ensure Campaign has content generated
        print("\n1. Generating base campaign content (Step 1)...")
        gen_res = client.post(
            "/campaigns/1/generate-content",
            json={"tone": "Urgent", "channel": "SMS", "max_characters": 300}
        )
        assert gen_res.status_code == 200, f"Generate failed: {gen_res.text}"
        base_body = gen_res.json()["body"]
        print(f"[OK] Base Content Body: {base_body}")

        # 3. Test Step 3: Personalize for Students Audience Segment (segment_id = 2)
        print("\n2. Testing Personalization for Segment 2 ('Students & Youth')...")
        student_res = client.post(
            "/campaigns/1/personalize",
            json={"segment_id": 2}
        )
        assert student_res.status_code == 200, f"Personalize students failed: {student_res.text}"
        student_data = student_res.json()

        print(f"[OK] Personalized for: {student_data['segment_name']}")
        print(f"     Audience Group: {student_data['phrasing_selected']['audience_group']}")
        print(f"     Location      : {student_data['phrasing_selected']['location']}")
        assert student_data["phrasing_selected"]["audience_group"] == "students"
        assert "campus" in student_data["phrasing_selected"]["location"]

        for item in student_data["contents_personalized"]:
            print(f"\n  [{item['language_code'].upper()} (ID: {item['content_id']})]")
            print(f"  Body: {item['body']}")
            assert len(item["body"]) > 0
            assert "{{" not in item["body"], "Unrendered Jinja2 placeholder found in body!"

        # 4. Test Step 3: Personalize for Corporate Workforce (segment_id = 3)
        print("\n3. Testing Personalization for Segment 3 ('Corporate Workforce')...")
        corp_res = client.post(
            "/campaigns/1/personalize",
            json={"segment_id": 3}
        )
        assert corp_res.status_code == 200, f"Personalize corporate failed: {corp_res.text}"
        corp_data = corp_res.json()

        print(f"[OK] Personalized for: {corp_data['segment_name']}")
        print(f"     Audience Group: {corp_data['phrasing_selected']['audience_group']}")
        print(f"     Location      : {corp_data['phrasing_selected']['location']}")
        assert corp_data["phrasing_selected"]["audience_group"] == "employees & team members"
        assert "office" in corp_data["phrasing_selected"]["location"]

        # 5. Test Jinja2 Communication Template Personalization
        print("\n4. Testing Jinja2 Template-based Personalization (template_id = 1)...")
        tmpl_res = client.post(
            "/campaigns/1/personalize",
            json={
                "segment_id": 2,
                "template_id": 1,
                "custom_variables": {"city": "Bengaluru", "helpline": "104"}
            }
        )
        assert tmpl_res.status_code == 200, f"Template personalize failed: {tmpl_res.text}"
        tmpl_data = tmpl_res.json()
        en_item = next((i for i in tmpl_data["contents_personalized"] if i["language_code"] == "en"), None)
        assert en_item is not None
        print(f"[OK] Rendered Template Body (EN):\n     {en_item['body']}")
        print(f"     Subject: {en_item['subject']}")
        assert "Dear Student" in en_item["body"]
        assert "Bengaluru" in en_item["subject"]
        assert "104" in en_item["body"]
        assert "{{" not in en_item["body"]
        assert "{{" not in en_item["subject"]

    # 6. Verify Database Persistence
    print("\n5. Verifying direct Database records in 'campaign_contents'...")
    db = SessionLocal()
    try:
        content_row = db.query(CampaignContent).filter(
            CampaignContent.campaign_id == 1,
            CampaignContent.language_id == 1
        ).first()
        assert content_row is not None
        print(f"[OK] Database Verified. Row ID: {content_row.id}")
        print(f"     Persisted Body: {content_row.body}")
        print(f"     Version: {content_row.version}")
        assert "Dear Student" in content_row.body
    finally:
        db.close()

    print("\n=== ALL STEP 3 AUDIENCE PERSONALIZATION TESTS PASSED SUCCESSFULLY! ===")


if __name__ == "__main__":
    run_test()
