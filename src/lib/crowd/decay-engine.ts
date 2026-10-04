import { CrowdLevel } from "@/types/mandal";

export interface CrowdReportItem {
    level: CrowdLevel;
    timestamp: Date | string;
}

export interface DecayedCrowdResult {
    level: CrowdLevel;
    activeReportCount: number;
    score: number;
    confidence: number;
}

export const CROWD_LEVEL_NUMERIC: Record<CrowdLevel, number> = {
    low: 1,
    moderate: 2,
    heavy: 3,
    very_heavy: 4
};

export const DEFAULT_DECAY_WINDOW_MINUTES = 120; // 2 hours

/**
 * Calculates a time-weighted decayed crowd level from user observations.
 * Reports submitted recently receive linear full weight, decaying to zero at the window boundary.
 */
export function calculateDecayedCrowdLevel(
    reports: CrowdReportItem[],
    baselineLevel: CrowdLevel = "moderate",
    windowMinutes: number = DEFAULT_DECAY_WINDOW_MINUTES,
    referenceTime: Date = new Date()
): DecayedCrowdResult {
    if (!reports || reports.length === 0) {
        return {
            level: baselineLevel,
            activeReportCount: 0,
            score: CROWD_LEVEL_NUMERIC[baselineLevel],
            confidence: 0
        };
    }

    const refMs = referenceTime.getTime();
    let totalWeight = 0;
    let weightedSum = 0;
    let activeCount = 0;

    for (const report of reports) {
        const reportMs = new Date(report.timestamp).getTime();
        if (isNaN(reportMs)) {
            continue;
        }

        const deltaMinutes = (refMs - reportMs) / (1000 * 60);

        // Discard reports outside the sliding window or invalid negative times
        if (deltaMinutes > windowMinutes) {
            continue;
        }

        const effectiveDelta = Math.max(0, deltaMinutes);
        const weight = 1 - effectiveDelta / windowMinutes;

        if (weight > 0) {
            const numericValue = CROWD_LEVEL_NUMERIC[report.level];
            if (numericValue) {
                totalWeight += weight;
                weightedSum += weight * numericValue;
                activeCount++;
            }
        }
    }

    if (totalWeight === 0 || activeCount === 0) {
        return {
            level: baselineLevel,
            activeReportCount: 0,
            score: CROWD_LEVEL_NUMERIC[baselineLevel],
            confidence: 0
        };
    }

    const score = weightedSum / totalWeight;

    // Convert continuous score back into discrete crowd bucket
    let level: CrowdLevel;
    if (score < 1.75) {
        level = "low";
    } else if (score < 2.5) {
        level = "moderate";
    } else if (score < 3.25) {
        level = "heavy";
    } else {
        level = "very_heavy";
    }

    // Confidence saturates when at least 3 weighted reports are present
    const confidence = Math.min(1, Math.round((totalWeight / 3) * 100) / 100);

    return {
        level,
        activeReportCount: activeCount,
        score: Math.round(score * 100) / 100,
        confidence
    };
}
