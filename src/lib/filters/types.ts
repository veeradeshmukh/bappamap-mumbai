import { CrowdLevel, MandalItem } from "@/types/mandal";

export type FilterType = "multiselect" | "boolean" | "range" | "text";

export interface ActiveFilters {
    crowdLevels?: CrowdLevel[];
    parkingNearbyOnly?: boolean;
    minRating?: number;
    [key: string]: unknown;
}

export interface FilterOption<T = string> {
    value: T;
    labelEn: string;
    labelMr: string;
}

export interface FilterDefinition<TValue = unknown> {
    id: string;
    labelEn: string;
    labelMr: string;
    type: FilterType;
    options?: FilterOption[];
    defaultValue: TValue;
    predicate: (mandal: MandalItem, value: TValue) => boolean;
}
