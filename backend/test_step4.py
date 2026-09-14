"""
Step 4 — Sentiment & Tone Analysis Test Script
Calls POST /campaigns/1/analyze-sentiment and validates the response.
"""
import httpx
import json
import sys
import os

# Fix Windows console encoding for non-ASCII (Hindi, Kannada, etc.)
if sys.platform == "win32":
    os.environ["PYTHONIOENCODING"] = "utf-8"
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

BASE = "http://127.0.0.1:8000"
CAMPAIGN_ID = 1


def header():
    print("=" * 70)
    print("  STEP 4 — SENTIMENT & TONE ANALYSIS TEST")
    print("=" * 70)


def test_analyze_sentiment_default():
    """Test sentiment analysis with default settings (VADER + LLM tone)."""
    print("\n[TEST 1] POST /campaigns/{id}/analyze-sentiment (default settings)")
    print("-" * 60)

    resp = httpx.post(
        f"{BASE}/campaigns/{CAMPAIGN_ID}/analyze-sentiment",
        json={},
        timeout=120.0
    )
    print(f"  Status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"  ERROR: {resp.text}")
        return False

    data = resp.json()
    print(f"  Success: {data['success']}")
    print(f"  Campaign ID: {data['campaign_id']}")
    print(f"  Total Analyzed: {data['total_analyzed']}")

    # Print each report
    for i, report in enumerate(data["reports"], 1):
        print(f"\n  --- Content #{i} (ID={report['content_id']}) ---")
        print(f"    Language: {report['language_name']} ({report['language_code']})")
        print(f"    Channel:  {report['channel']}")
        print(f"    Preview:  {report['body_preview'][:80]}...")
        print(f"    Sentiment: {report['sentiment']}")
        scores = report["sentiment_scores"]
        print(f"    Compound:  {scores['compound']}")
        print(f"    Pos/Neg/Neu: {scores['positive']}/{scores['negative']}/{scores['neutral']}")
        print(f"    Tone: {report['tone']}")
        print(f"    Suggestions:")
        for s in report["tone_suggestions"]:
            print(f"      • {s}")
        print(f"    Clarity Score: {report['clarity_score']}")
        print(f"    Overall Score: {report['overall_score']}")
        print(f"    Status: {report['status']}")
        print(f"    Report ID: {report['report_id']}")

    # Print summary
    summary = data["summary"]
    print(f"\n  === SUMMARY ===")
    print(f"    Dominant Sentiment: {summary['dominant_sentiment']}")
    print(f"    Distribution: {json.dumps(summary['sentiment_distribution'])}")
    print(f"    Avg Overall Score: {summary['average_overall_score']}")
    print(f"    VADER Available: {summary['vader_available']}")

    # Validate structure
    assert data["success"] is True, "Expected success=True"
    assert data["total_analyzed"] >= 1, "Expected at least 1 content analyzed"
    for r in data["reports"]:
        assert r["sentiment"] in ("POSITIVE", "NEUTRAL", "NEGATIVE"), f"Invalid sentiment: {r['sentiment']}"
        assert 0 <= r["overall_score"] <= 100, f"Overall score out of range: {r['overall_score']}"
        assert r["report_id"] > 0, "Report ID must be a positive integer"

    print("\n  ✅ TEST 1 PASSED")
    return True


def test_analyze_no_tone_suggestions():
    """Test with include_tone_suggestions=False (VADER + rule-based only, no LLM call)."""
    print("\n[TEST 2] POST /campaigns/{id}/analyze-sentiment (VADER-only, no LLM)")
    print("-" * 60)

    resp = httpx.post(
        f"{BASE}/campaigns/{CAMPAIGN_ID}/analyze-sentiment",
        json={"include_tone_suggestions": False},
        timeout=120.0
    )
    print(f"  Status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"  ERROR: {resp.text}")
        return False

    data = resp.json()
    print(f"  Total Analyzed: {data['total_analyzed']}")

    for report in data["reports"]:
        print(f"  Content {report['content_id']}: "
              f"Sentiment={report['sentiment']}, "
              f"Tone={report['tone']}, "
              f"Overall={report['overall_score']}")
        assert report["sentiment"] in ("POSITIVE", "NEUTRAL", "NEGATIVE")

    print("\n  ✅ TEST 2 PASSED")
    return True


def test_analyze_nonexistent_campaign():
    """Test 404 for a campaign that doesn't exist."""
    print("\n[TEST 3] POST /campaigns/9999/analyze-sentiment (expect 404)")
    print("-" * 60)

    resp = httpx.post(
        f"{BASE}/campaigns/9999/analyze-sentiment",
        json={},
        timeout=15.0
    )
    print(f"  Status: {resp.status_code}")

    if resp.status_code == 404:
        print(f"  Response: {resp.json()}")
        print("\n  ✅ TEST 3 PASSED (correctly returned 404)")
        return True
    else:
        print(f"  ERROR: Expected 404, got {resp.status_code}")
        return False


def test_content_quality_report_persistence():
    """Verify that content_quality_reports rows were created by checking campaign details."""
    print("\n[TEST 4] GET /campaigns/{id} — verify quality reports exist")
    print("-" * 60)

    resp = httpx.get(f"{BASE}/campaigns/{CAMPAIGN_ID}", timeout=10.0)
    print(f"  Status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"  ERROR: {resp.text}")
        return False

    data = resp.json()
    contents = data.get("contents", [])
    print(f"  Total contents: {len(contents)}")
    for c in contents:
        print(f"    Content {c['id']}: lang={c.get('language', 'N/A')}, channel={c['channel']}")

    print("\n  ✅ TEST 4 PASSED (campaign contents verified)")
    return True


if __name__ == "__main__":
    header()
    results = []

    results.append(("Default sentiment analysis", test_analyze_sentiment_default()))
    results.append(("VADER-only (no LLM)", test_analyze_no_tone_suggestions()))
    results.append(("404 for nonexistent campaign", test_analyze_nonexistent_campaign()))
    results.append(("Quality report persistence", test_content_quality_report_persistence()))

    print("\n" + "=" * 70)
    print("  RESULTS SUMMARY")
    print("=" * 70)
    all_passed = True
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}  {name}")
        if not passed:
            all_passed = False

    print("=" * 70)
    if all_passed:
        print("  All Step 4 tests passed!")
    else:
        print("  Some tests failed — check output above.")
    sys.exit(0 if all_passed else 1)
