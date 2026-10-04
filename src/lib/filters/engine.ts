import { MandalItem, CrowdLevel } from "@/types/mandal";
import { ActiveFilters } from "./types";
import { MANDAL_FILTER_DEFINITIONS } from "./definitions";

const VALID_CROWD_LEVELS: CrowdLevel[] = ["low", "moderate", "heavy", "very_heavy"];

/**
 * Pure filter function evaluating a list of mandals against active filters and search query.
 */
export function filterMandals(
    mandals: MandalItem[],
    filters: ActiveFilters = {},
    searchQuery: string = ""
): MandalItem[] {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    return mandals.filter((mandal) => {
        // 1. Text Search Filter (English, Marathi, Locality, Ward)
        if (trimmedQuery) {
            const matchesNameEn = mandal.nameEn.toLowerCase().includes(trimmedQuery);
            const matchesNameMr = mandal.nameMr.toLowerCase().includes(trimmedQuery);
            const matchesLocalityEn = mandal.localityEn.toLowerCase().includes(trimmedQuery);
            const matchesLocalityMr = mandal.localityMr.toLowerCase().includes(trimmedQuery);
            const matchesWard =
                mandal.bmcWard.toLowerCase().includes(trimmedQuery) ||
                `ward ${mandal.bmcWard.toLowerCase()}`.includes(trimmedQuery);

            if (
                !matchesNameEn &&
                !matchesNameMr &&
                !matchesLocalityEn &&
                !matchesLocalityMr &&
                !matchesWard
            ) {
                return false;
            }
        }

        // 2. Crowd Level Filter
        const crowdDef = MANDAL_FILTER_DEFINITIONS.find((d) => d.id === "crowd");
        if (filters.crowdLevels && filters.crowdLevels.length > 0 && crowdDef) {
            if (!crowdDef.predicate(mandal, filters.crowdLevels)) {
                return false;
            }
        }

        // 3. Parking Filter
        const parkingDef = MANDAL_FILTER_DEFINITIONS.find((d) => d.id === "parking");
        if (filters.parkingNearbyOnly && parkingDef) {
            if (!parkingDef.predicate(mandal, filters.parkingNearbyOnly)) {
                return false;
            }
        }

        // 4. Minimum Rating Filter
        const ratingDef = MANDAL_FILTER_DEFINITIONS.find((d) => d.id === "min_rating");
        if (filters.minRating && filters.minRating > 0 && ratingDef) {
            if (!ratingDef.predicate(mandal, filters.minRating)) {
                return false;
            }
        }

        // 5. Extensible filters check for dynamic future attributes
        for (const def of MANDAL_FILTER_DEFINITIONS) {
            if (def.id === "crowd" || def.id === "parking" || def.id === "min_rating") {
                continue;
            }
            const value = filters[def.id];
            if (value !== undefined && value !== null && value !== def.defaultValue) {
                if (!def.predicate(mandal, value)) {
                    return false;
                }
            }
        }

        return true;
    });
}

/**
 * Serializes active filters and search query into a URL query parameter string.
 * Omits default and empty values to keep URLs clean and minimal.
 */
export function serializeFiltersToUrl(filters: ActiveFilters, searchQuery: string = ""): string {
    const params = new URLSearchParams();

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
        params.set("q", trimmedQuery);
    }

    if (filters.crowdLevels && filters.crowdLevels.length > 0) {
        params.set("crowd", filters.crowdLevels.join(","));
    }

    if (filters.parkingNearbyOnly) {
        params.set("parking", "true");
    }

    if (filters.minRating && filters.minRating > 0) {
        params.set("rating", filters.minRating.toString());
    }

    return params.toString();
}

/**
 * Deserializes URL query parameters into an ActiveFilters object and search query string.
 * Validates inputs to protect against invalid state or tampering.
 */
export function parseFiltersFromUrl(params: URLSearchParams): {
    filters: ActiveFilters;
    searchQuery: string;
} {
    const searchQuery = (params.get("q") || "").trim();

    const crowdParam = params.get("crowd");
    const rawCrowdLevels = crowdParam ? crowdParam.split(",") : [];
    const crowdLevels = rawCrowdLevels.filter((level): level is CrowdLevel =>
        VALID_CROWD_LEVELS.includes(level as CrowdLevel)
    );

    const parkingNearbyOnly = params.get("parking") === "true";

    const ratingParam = params.get("rating");
    const parsedRating = ratingParam ? parseFloat(ratingParam) : 0;
    const minRating = isNaN(parsedRating) ? 0 : Math.max(0, parsedRating);

    const filters: ActiveFilters = {
        crowdLevels,
        parkingNearbyOnly,
        minRating
    };

    return {
        filters,
        searchQuery
    };
}
