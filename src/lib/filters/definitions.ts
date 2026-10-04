import { FilterDefinition } from "./types";
import { CrowdLevel } from "@/types/mandal";

/**
 * Extensible filter registry.
 * Future filters (e.g. wheelchairAccessible, darshanType) can be added here
 * without modifying UI layout or core filtering algorithms.
 */
export const MANDAL_FILTER_DEFINITIONS: FilterDefinition[] = [
    {
        id: "crowd",
        labelEn: "Crowd Level",
        labelMr: "गर्दी पातळी",
        type: "multiselect",
        defaultValue: [] as CrowdLevel[],
        options: [
            { value: "low", labelEn: "Low", labelMr: "कमी" },
            { value: "moderate", labelEn: "Moderate", labelMr: "मध्यम" },
            { value: "heavy", labelEn: "Heavy", labelMr: "जास्त" },
            { value: "very_heavy", labelEn: "Very Heavy", labelMr: "अति गर्दी" }
        ],
        predicate: (mandal, value) => {
            const levels = value as CrowdLevel[];
            if (!levels || levels.length === 0) return true;
            return mandal.currentCrowdLevel ? levels.includes(mandal.currentCrowdLevel) : false;
        }
    },
    {
        id: "parking",
        labelEn: "Parking Nearby",
        labelMr: "जवळपास पार्किंग",
        type: "boolean",
        defaultValue: false,
        predicate: (mandal, value) => {
            if (!value) return true;
            return Boolean(mandal.attributes?.parkingNearby);
        }
    },
    {
        id: "min_rating",
        labelEn: "Minimum Rating",
        labelMr: "किमान रेटिंग",
        type: "range",
        defaultValue: 0,
        predicate: (mandal, value) => {
            const min = Number(value) || 0;
            if (min <= 0) return true;
            return (mandal.avgRating ?? 0) >= min;
        }
    }
];
