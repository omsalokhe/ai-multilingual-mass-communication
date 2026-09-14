"""Automated verification test for Step 1: AI Content Generation."""
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal, Base, engine
from app.models.campaign import Campaign
from app.models.content import CampaignContent
from app.api.campaigns import seed_sample_data

def run_test():
    # Ensure tables exist and seeded
    Base.metadata.create_all(bind=engine)
    db_init = SessionLocal()
    try:
        seed_sample_data(db_init)
    finally:
        db_init.close()

    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/")
        assert res.status_code == 200, f"Root status error: {res.text}"
        print("[OK] Health Check Passed:", res.json())

        # 2. List campaigns
        res = client.get("/campaigns")
        assert res.status_code == 200, f"List campaigns error: {res.text}"
        campaigns = res.json()
        print(f"[OK] Found {len(campaigns)} campaigns.")
        assert len(campaigns) > 0, "Expected at least 1 seeded campaign"
        target_camp_id = campaigns[0]["id"]

        # 3. Test Step 1: POST /campaigns/{id}/generate-content
        print(f"\nTesting Step 1: POST /campaigns/{target_camp_id}/generate-content ...")
        payload = {
            "tone": "Urgent",
            "channel": "SMS",
            "max_characters": 300,
            "provider": "gemini"
        }
        res = client.post(f"/campaigns/{target_camp_id}/generate-content", json=payload)
        assert res.status_code == 200, f"Generate content failed: {res.text}"
        data = res.json()
        print("[OK] Generation Response:")
        print("  - Content ID:", data["content_id"])
        print("  - Language:", data["language_code"], f"(ID: {data['language_id']})")
        print("  - Channel:", data["channel"])
        print("  - AI Generated:", data["ai_generated"])
        print("  - Status:", data["status"])
        print("  - Provider Used:", data["provider_used"])
        print("  - Prompt Used:\n   ", data["prompt_used"])
        print("  - Generated Body:\n   ", data["body"])
        print("  - Character Count:", data["character_count"], f"(Limit: {payload['max_characters']})")

    # 4. Verify database persistence
    db = SessionLocal()
    try:
        content_row = db.query(CampaignContent).filter(CampaignContent.id == data["content_id"]).first()
        assert content_row is not None, "Content row not saved to database!"
        assert content_row.ai_generated is True, "ai_generated flag was not True!"
        assert content_row.status == "DRAFT", f"Expected status DRAFT, got {content_row.status}"
        assert content_row.language_id == 1, f"Expected language_id 1 (English), got {content_row.language_id}"
        print("\n[OK] Database Persistence Verified:")
        print("  - Row ID:", content_row.id)
        print("  - Database Status:", content_row.status)
        print("  - DB ai_generated flag:", content_row.ai_generated)
        print("  - DB Version:", content_row.version)
    finally:
        db.close()

    print("\n=== ALL STEP 1 TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_test()
