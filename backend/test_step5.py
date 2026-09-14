"""
Step 5 — AI Quality & Compliance Check Test Script
Calls POST /campaigns/1/quality-check and validates grammar, compliance, and factual checks.
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
    print("  STEP 5 — AI QUALITY & COMPLIANCE CHECK TEST")
    print("=" * 70)


def test_quality_check_default():
    """Test quality check with default settings (grammar + compliance + factual LLM)."""
    print("\n[TEST 1] POST /campaigns/{id}/quality-check (default settings)")
    print("-" * 60)

    resp = httpx.post(
        f"{BASE}/campaigns/{CAMPAIGN_ID}/quality-check",
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
    print(f"  Total Checked: {data['total_checked']}")

    # Print each report
    for i, report in enumerate(data["reports"], 1):
        print(f"\n  --- Content #{i} (ID={report['content_id']}) ---")
        print(f"    Language: {report['language_name']} ({report['language_code']})")
        print(f"    Channel:  {report['channel']}")
        print(f"    Preview:  {report['body_preview'][:80]}...")

        # Grammar
        gmark = "✅" if report["grammar_ok"] else "❌"
        print(f"    Grammar: {gmark} ({report['grammar_error_count']} errors)")
        if report["grammar_issues"]:
            for gi in report["grammar_issues"][:3]:
                print(f"      • {gi.get('message', '')[:80]}")

        # Compliance
        cmark = "✅" if report["compliance_ok"] else "❌"
        print(f"    Compliance: {cmark}")
        if report["compliance_violations"]:
            for cv in report["compliance_violations"][:3]:
                print(f"      • [{cv.get('severity', '')}] {cv.get('message', '')[:80]}")

        # Factual
        fmark = "✅" if report["factual_ok"] else "❌"
        print(f"    Factual: {fmark} (risk={report['factual_risk_level']})")
        if report["factual_issues"]:
            for fi in report["factual_issues"][:3]:
                print(f"      • {str(fi)[:80]}")

        print(f"    Overall Score: {report['overall_score']}")
        print(f"    Status: {report['status']}")
        print(f"    Report ID: {report['report_id']}")

    # Print summary
    summary = data["summary"]
    print(f"\n  === SUMMARY ===")
    print(f"    Grammar: {summary['grammar_pass']} pass / {summary['grammar_fail']} fail")
    print(f"    Compliance: {summary['compliance_pass']} pass / {summary['compliance_fail']} fail")
    print(f"    Factual: {summary['factual_pass']} pass / {summary['factual_fail']} fail")
    print(f"    Overall Compliance Rate: {summary['overall_compliance_rate']}%")
    print(f"    All Clear: {summary['all_clear']}")

    # Validate structure
    assert data["success"] is True, "Expected success=True"
    assert data["total_checked"] >= 1, "Expected at least 1 content checked"
    for r in data["reports"]:
        assert isinstance(r["grammar_ok"], bool), f"grammar_ok must be bool"
        assert isinstance(r["compliance_ok"], bool), f"compliance_ok must be bool"
        assert isinstance(r["factual_ok"], bool), f"factual_ok must be bool"
        assert 0 <= r["overall_score"] <= 100, f"Overall score out of range: {r['overall_score']}"
        assert r["report_id"] > 0, "Report ID must be a positive integer"
        assert r["status"] in ("APPROVED", "NEEDS_REVIEW", "REJECTED"), f"Invalid status: {r['status']}"

    print("\n  ✅ TEST 1 PASSED")
    return True


def test_quality_no_factual():
    """Test with include_factual_check=False (grammar + compliance only, no LLM call)."""
    print("\n[TEST 2] POST /campaigns/{id}/quality-check (no factual LLM check)")
    print("-" * 60)

    resp = httpx.post(
        f"{BASE}/campaigns/{CAMPAIGN_ID}/quality-check",
        json={"include_factual_check": False},
        timeout=120.0
    )
    print(f"  Status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"  ERROR: {resp.text}")
        return False

    data = resp.json()
    print(f"  Total Checked: {data['total_checked']}")

    for report in data["reports"]:
        print(f"  Content {report['content_id']}: "
              f"Grammar={'✅' if report['grammar_ok'] else '❌'}, "
              f"Compliance={'✅' if report['compliance_ok'] else '❌'}, "
              f"Factual=SKIPPED, "
              f"Overall={report['overall_score']}")
        assert report["factual_risk_level"] == "SKIPPED", "Expected factual check to be SKIPPED"

    print("\n  ✅ TEST 2 PASSED")
    return True


def test_quality_nonexistent_campaign():
    """Test 404 for a campaign that doesn't exist."""
    print("\n[TEST 3] POST /campaigns/9999/quality-check (expect 404)")
    print("-" * 60)

    resp = httpx.post(
        f"{BASE}/campaigns/9999/quality-check",
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


def test_quality_report_persistence():
    """Verify that content_quality_reports rows have grammar_ok, factual_ok, compliance_ok set."""
    print("\n[TEST 4] Verify quality report fields are no longer placeholder")
    print("-" * 60)

    # Re-run quality check to ensure reports exist
    resp = httpx.post(
        f"{BASE}/campaigns/{CAMPAIGN_ID}/quality-check",
        json={"include_factual_check": False},
        timeout=120.0
    )
    print(f"  Quality check status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"  ERROR: {resp.text}")
        return False

    data = resp.json()
    for r in data["reports"]:
        # Verify all three flags are proper booleans (not None placeholder)
        assert isinstance(r["grammar_ok"], bool), f"grammar_ok is not bool for content {r['content_id']}"
        assert isinstance(r["compliance_ok"], bool), f"compliance_ok is not bool for content {r['content_id']}"
        assert isinstance(r["factual_ok"], bool), f"factual_ok is not bool for content {r['content_id']}"
        print(f"  Content {r['content_id']}: grammar={r['grammar_ok']}, "
              f"compliance={r['compliance_ok']}, factual={r['factual_ok']}, "
              f"score={r['overall_score']}, status={r['status']}")

    print("\n  ✅ TEST 4 PASSED (quality report fields are properly populated)")
    return True


if __name__ == "__main__":
    header()
    results = []

    results.append(("Default quality check (grammar + compliance + factual)", test_quality_check_default()))
    results.append(("No factual LLM check", test_quality_no_factual()))
    results.append(("404 for nonexistent campaign", test_quality_nonexistent_campaign()))
    results.append(("Quality report persistence", test_quality_report_persistence()))

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
        print("  All Step 5 tests passed!")
    else:
        print("  Some tests failed — check output above.")
    sys.exit(0 if all_passed else 1)
