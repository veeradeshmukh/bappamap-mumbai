import seedMandalsData from "../../../data/seed-mandals.json";
import { MandalItem } from "@/types/mandal";

/**
 * Returns verified seed mandals cataloged for South Mumbai.
 */
export function getSeedMandals(): MandalItem[] {
    return seedMandalsData as MandalItem[];
}

/**
 * Finds a specific mandal by its URL slug.
 */
export function getMandalBySlug(slug: string): MandalItem | undefined {
    return (seedMandalsData as MandalItem[]).find((m) => m.slug === slug);
}
