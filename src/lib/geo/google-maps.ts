/**
 * Generates an official, cross-platform Google Maps search URL using the
 * documented universal URL scheme. No paid Maps API key is required.
 *
 * Official documentation:
 * https://developers.google.com/maps/documentation/urls/get-started
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
    const coords = `${latitude},${longitude}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
}
