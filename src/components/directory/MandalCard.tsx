"use client";

import React from "react";
import { MandalItem, CrowdLevel } from "@/types/mandal";
import { Language, t, getLocalizedField } from "@/lib/i18n/translations";
import { getGoogleMapsUrl } from "@/lib/geo/google-maps";

interface MandalCardProps {
    mandal: MandalItem;
    language: Language;
    isSelected: boolean;
    onSelect: (mandal: MandalItem) => void;
}

const CROWD_BADGE_STYLES: Record<
    CrowdLevel,
    { labelKey: string; badgeClass: string; dotClass: string }
> = {
    low: {
        labelKey: "crowd.low",
        badgeClass: "bg-emerald-950/40 text-emerald-400 border-emerald-500/30",
        dotClass: "bg-emerald-400"
    },
    moderate: {
        labelKey: "crowd.moderate",
        badgeClass: "bg-amber-950/40 text-amber-400 border-amber-500/30",
        dotClass: "bg-amber-400"
    },
    heavy: {
        labelKey: "crowd.heavy",
        badgeClass: "bg-orange-950/40 text-orange-400 border-orange-500/30",
        dotClass: "bg-orange-400"
    },
    very_heavy: {
        labelKey: "crowd.very_heavy",
        badgeClass: "bg-red-950/40 text-red-400 border-red-500/30",
        dotClass: "bg-red-400"
    }
};

export default function MandalCard({ mandal, language, isSelected, onSelect }: MandalCardProps) {
    const primaryName = getLocalizedField(mandal, "name", language);
    const secondaryName = language === "mr" ? mandal.nameEn : mandal.nameMr;
    const locality = getLocalizedField(mandal, "locality", language);
    const gmapsUrl = getGoogleMapsUrl(mandal.latitude, mandal.longitude);

    const crowdInfo = mandal.currentCrowdLevel
        ? CROWD_BADGE_STYLES[mandal.currentCrowdLevel]
        : null;

    return (
        <article
            data-testid={`mandal-card-${mandal.slug}`}
            id={`mandal-card-${mandal.slug}`}
            className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${
                isSelected
                    ? "border-brand-vermillion ring-2 ring-brand-vermillion/60 bg-brand-surface shadow-xl shadow-red-950/30"
                    : "border-brand-border bg-brand-surface/70 hover:border-brand-marigold/50 hover:bg-brand-surface shadow-md"
            }`}
        >
            {/* Top metadata row: Founded Year & BMC Ward */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-brand-marigold">
                    {t("card.founded", language)} {mandal.foundedYear}
                </span>
                <span className="rounded bg-brand-base px-2 py-0.5 font-medium border border-brand-border">
                    {t("card.ward", language)} {mandal.bmcWard}
                </span>
            </div>

            {/* Title Section */}
            <div className="mb-3">
                <h3
                    className={`font-bold text-base tracking-tight text-white leading-snug ${
                        language === "mr" ? "font-marathi text-lg" : "font-sans"
                    }`}
                >
                    {primaryName}
                </h3>
                {secondaryName && secondaryName !== primaryName && (
                    <p
                        className={`text-xs text-slate-400 mt-0.5 ${
                            language === "mr" ? "font-sans" : "font-marathi text-brand-marigold/80"
                        }`}
                    >
                        {secondaryName}
                    </p>
                )}
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-brand-vermillion shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>{locality}</span>
                </p>
            </div>

            {/* Badges Row: Crowd, Rating, Parking */}
            <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-brand-border/60">
                {crowdInfo && (
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${crowdInfo.badgeClass}`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${crowdInfo.dotClass}`} />
                        {t(crowdInfo.labelKey, language)}
                    </span>
                )}

                {mandal.avgRating && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-base px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-brand-border">
                        <span>★</span>
                        <span>{mandal.avgRating.toFixed(1)}</span>
                        {mandal.reviewCount && (
                            <span className="text-slate-400">({mandal.reviewCount})</span>
                        )}
                    </span>
                )}

                {mandal.attributes?.parkingNearby ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-base px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-brand-border">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                        </svg>
                        {t("card.parkingAvailable", language)}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-base px-2 py-0.5 text-[11px] text-slate-400 border border-brand-border">
                        {t("card.noParking", language)}
                    </span>
                )}
            </div>

            {/* Action CTAs */}
            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                <button
                    type="button"
                    data-testid={`card-show-map-${mandal.slug}`}
                    onClick={() => onSelect(mandal)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-border bg-brand-base/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-marigold hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-brand-marigold"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                        <line x1="8" y1="2" x2="8" y2="18" />
                        <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    {t("card.showOnMap", language)}
                </button>

                <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`card-directions-${mandal.slug}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-vermillion hover:bg-red-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {t("card.directions", language)}
                </a>
            </div>
        </article>
    );
}
