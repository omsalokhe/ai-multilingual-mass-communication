import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal, Base, engine
from app.models.content import CampaignContent
from app.models.campaign import Language
from app.api.campaigns import seed_sample_data


def run_test():
    # 1. Ensure DB schema exists and is seeded
    Base.metadata.create_all(bind=engine)
    db_init = SessionLocal()
    try:
        seed_sample_data(db_init)
    finally:
        db_init.close()

    with TestClient(app) as client:
        # Health check
        res = client.get("/")
        assert res.status_code == 200, f"Root error: {res.text}"
        root_data = res.json()
        print("[OK] Health check passed:", root_data)
        assert "Step 2: Multilingual Translation (Bhashini / IndicTrans2)" in root_data["active_modules"]

        # Step 1: Ensure English source content exists
        print("\n1. Ensuring source English content exists via Step 1...")
        gen_res = client.post(
            "/campaigns/1/generate-content",
            json={"tone": "Urgent", "channel": "SMS", "max_characters": 300}
        )
        assert gen_res.status_code == 200, f"Generate content failed: {gen_res.text}"
        gen_data = gen_res.json()
        print(f"[OK] Source English Content ID: {gen_data['content_id']}")
        print(f"     Body: {gen_data['body']}")

        # Step 2: Test Multilingual Translation for all active Indian languages
        print("\n2. Testing Step 2: POST /campaigns/1/translate (all active languages)...")
        trans_res = client.post("/campaigns/1/translate", json={})
        assert trans_res.status_code == 200, f"Translation failed: {trans_res.text}"
        trans_data = trans_res.json()

        print(f"[OK] Translation Success! Total translated: {trans_data['total_translated']}")
        print(f"     Source text: {trans_data['source_text'][:60]}...")
        assert trans_data["total_translated"] >= 5, f"Expected >= 5 translations, got {trans_data['total_translated']}"

        expected_langs = {"hi", "kn", "ta", "te", "mr"}
        found_langs = set()

        for item in trans_data["translations"]:
            found_langs.add(item["language_code"])
            print(f"\n  [{item['language_code'].upper()} - {item['language_name']}]")
            print(f"  Provider Used : {item['provider_used']}")
            print(f"  Subject       : {item['subject']}")
            print(f"  Body          : {item['body']}")
            print(f"  Char Count    : {item['character_count']}")
            print(f"  Status        : {item['status']} | Version: {item['version']}")

            assert len(item["body"]) > 0, f"Empty body for {item['language_code']}"
            assert item["ai_generated"] is True
            assert item["status"] == "DRAFT"
            assert item["channel"] == "SMS"

        assert expected_langs.issubset(found_langs), f"Missing languages! Expected: {expected_langs}, Got: {found_langs}"

        # 3. Test Selective Language Translation & Version Increment
        print("\n3. Testing selective translation with version increment for ['hi', 'kn']...")
        selective_res = client.post(
            "/campaigns/1/translate",
            json={"target_language_codes": ["hi", "kn"]}
        )
        assert selective_res.status_code == 200, f"Selective translate failed: {selective_res.text}"
        selective_data = selective_res.json()
        assert selective_data["total_translated"] == 2
        for item in selective_data["translations"]:
            print(f"  Updated [{item['language_code']}]: Version {item['version']}")
            assert item["version"] >= 2, f"Expected version >= 2, got {item['version']}"

        # 4. Verify Campaign Details API returns all multilingual contents
        print("\n4. Verifying GET /campaigns/1 payload...")
        camp_res = client.get("/campaigns/1")
        assert camp_res.status_code == 200, f"Get campaign failed: {camp_res.text}"
        camp_data = camp_res.json()
        print(f"[OK] Campaign '{camp_data['name']}' has {len(camp_data['contents'])} content variants.")
        assert len(camp_data["contents"]) >= 6, f"Expected >= 6 variants (1 EN + 5 Indic), got {len(camp_data['contents'])}"

    # 5. Verify Direct Database Persistence
    print("\n5. Verifying direct Database records in 'campaign_contents'...")
    db = SessionLocal()
    try:
        contents = db.query(CampaignContent).filter(CampaignContent.campaign_id == 1).all()
        assert len(contents) >= 6
        lang_ids_in_db = {c.language_id for c in contents}
        print(f"[OK] Database verified. Total rows: {len(contents)}. Unique Language IDs: {lang_ids_in_db}")
    finally:
        db.close()

    print("\n=== ALL STEP 2 TRANSLATION TESTS PASSED SUCCESSFULLY! ===")


if __name__ == "__main__":
    run_test()
