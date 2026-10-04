/**
 * South Mumbai Geographic Boundaries & Zoom Constraints
 *
 * Covers BMC Wards A, B, C, D, E, and F/South:
 * - Southwest bound: Colaba coast [72.780000, 18.890000]
 * - Northeast bound: Lalbaug/Parel railway boundary [72.870000, 19.015000]
 */

export type LngLatTuple = [number, number];

export const SOUTH_MUMBAI_BOUNDS: [LngLatTuple, LngLatTuple] = [
    [72.78, 18.89], // [West Longitude, South Latitude]
    [72.87, 19.015] // [East Longitude, North Latitude]
];

export const MAP_CENTER: LngLatTuple = [72.825, 18.955]; // [Longitude, Latitude]
export const MIN_ZOOM = 12.0;
export const MAX_ZOOM = 17.5;
export const DEFAULT_ZOOM = 13.5;

/**
 * Validates whether the given coordinate pair resides within the South Mumbai bounding box.
 */
export function isWithinSouthMumbai(latitude: number, longitude: number): boolean {
    const [sw, ne] = SOUTH_MUMBAI_BOUNDS;
    const minLng = sw[0];
    const minLat = sw[1];
    const maxLng = ne[0];
    const maxLat = ne[1];

    return latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
}
