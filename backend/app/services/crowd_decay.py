from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

CrowdLevel = Literal["low", "moderate", "heavy", "very_heavy"]

CROWD_LEVEL_NUMERIC: dict[str, int] = {
    "low": 1,
    "moderate": 2,
    "heavy": 3,
    "very_heavy": 4,
}

DEFAULT_DECAY_WINDOW_MINUTES = 120  # 2 hours


@dataclass
class DecayedCrowdResult:
    level: CrowdLevel
    active_report_count: int
    score: float
    confidence: float
    last_updated: str | None = None


def calculate_decayed_crowd_level(
    reports: list[dict],
    baseline_level: CrowdLevel = "moderate",
    window_minutes: int = DEFAULT_DECAY_WINDOW_MINUTES,
    reference_time: datetime | None = None,
) -> DecayedCrowdResult:
    """Calculates a time-weighted decayed crowd level from user observations.

    Reports submitted recently receive linear full weight (1.0), decaying to zero
    at the 2-hour window boundary.
    """
    if reference_time is None:
        reference_time = datetime.now(UTC)
    elif reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=UTC)

    if not reports:
        return DecayedCrowdResult(
            level=baseline_level,
            active_report_count=0,
            score=float(CROWD_LEVEL_NUMERIC[baseline_level]),
            confidence=0.0,
            last_updated=None,
        )

    ref_ts = reference_time.timestamp()
    total_weight = 0.0
    weighted_sum = 0.0
    active_count = 0
    latest_timestamp: datetime | None = None

    for report in reports:
        ts = report.get("reported_at") or report.get("timestamp") or report.get("created_at")
        if isinstance(ts, str):
            try:
                # Handle ISO strings with Z or timezone
                if ts.endswith("Z"):
                    ts = ts[:-1] + "+00:00"
                dt = datetime.fromisoformat(ts)
            except Exception:
                continue
        elif isinstance(ts, datetime):
            dt = ts
        else:
            continue

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)

        delta_minutes = (ref_ts - dt.timestamp()) / 60.0

        # Discard reports outside sliding window or future negative times (> 2 min clock skew)
        if delta_minutes > window_minutes or delta_minutes < -2:
            continue

        effective_delta = max(0.0, delta_minutes)
        weight = 1.0 - (effective_delta / float(window_minutes))

        level_str = report.get("crowd_level") or report.get("level")
        numeric_value = CROWD_LEVEL_NUMERIC.get(str(level_str).lower())
        if numeric_value and weight > 0:
            total_weight += weight
            weighted_sum += weight * numeric_value
            active_count += 1
            if latest_timestamp is None or dt > latest_timestamp:
                latest_timestamp = dt

    if total_weight == 0.0 or active_count == 0:
        return DecayedCrowdResult(
            level=baseline_level,
            active_report_count=0,
            score=float(CROWD_LEVEL_NUMERIC[baseline_level]),
            confidence=0.0,
            last_updated=None,
        )

    score = weighted_sum / total_weight

    if score < 1.75:
        level: CrowdLevel = "low"
    elif score < 2.5:
        level = "moderate"
    elif score < 3.25:
        level = "heavy"
    else:
        level = "very_heavy"

    confidence = min(1.0, round(total_weight / 3.0, 2))
    last_updated_str = latest_timestamp.isoformat() if latest_timestamp else None

    return DecayedCrowdResult(
        level=level,
        active_report_count=active_count,
        score=round(score, 2),
        confidence=confidence,
        last_updated=last_updated_str,
    )
