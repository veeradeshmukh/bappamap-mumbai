export type CrowdLevel = "low" | "moderate" | "heavy" | "very_heavy";

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface MandalAttributes {
    parkingNearby?: boolean;
    wheelchairAccessible?: boolean;
    darshanTypes?: string[];
    nearestStation?: string;
    [key: string]: unknown;
}

export interface MandalItem {
    id?: string;
    slug: string;
    nameEn: string;
    nameMr: string;
    localityEn: string;
    localityMr: string;
    bmcWard: string;
    foundedYear: number;
    latitude: number;
    longitude: number;
    descriptionEn?: string;
    descriptionMr?: string;
    currentCrowdLevel?: CrowdLevel;
    avgRating?: number;
    reviewCount?: number;
    attributes?: MandalAttributes;
}
