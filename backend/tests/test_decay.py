from datetime import UTC, datetime, timedelta

from backend.app.services.crowd_decay import calculate_decayed_crowd_level


def test_decay_empty_reports():
    res = calculate_decayed_crowd_level([])
    assert res.level == "moderate"
    assert res.active_report_count == 0
    assert res.confidence == 0.0


def test_decay_recent_reports():
    now = datetime.now(UTC)
    reports = [
        {"crowd_level": "heavy", "reported_at": now.isoformat()},
        {"crowd_level": "heavy", "reported_at": (now - timedelta(minutes=5)).isoformat()},
        {"crowd_level": "heavy", "reported_at": (now - timedelta(minutes=10)).isoformat()},
    ]
    res = calculate_decayed_crowd_level(reports, reference_time=now)
    assert res.level == "heavy"
    assert res.active_report_count == 3
    assert res.confidence >= 0.8


def test_decay_ignores_reports_older_than_two_hours():
    now = datetime.now(UTC)
    reports = [
        {"crowd_level": "very_heavy", "reported_at": (now - timedelta(minutes=130)).isoformat()},
    ]
    res = calculate_decayed_crowd_level(reports, baseline_level="low", reference_time=now)
    assert res.level == "low"
    assert res.active_report_count == 0


def test_decay_linear_weight_reduction():
    now = datetime.now(UTC)
    # One recent low (at 0 min, weight 1.0) and one older heavy (at 60 min, weight 0.5)
    # Score = (1.0*1 + 0.5*3) / 1.5 = 2.5 / 1.5 = 1.667 (< 1.75 -> 'low')
    reports = [
        {"crowd_level": "low", "reported_at": now.isoformat()},
        {"crowd_level": "heavy", "reported_at": (now - timedelta(minutes=60)).isoformat()},
    ]
    res = calculate_decayed_crowd_level(reports, reference_time=now)
    assert res.level == "low"
    assert res.active_report_count == 2
