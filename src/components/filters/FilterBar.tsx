"use client";

import React from "react";
import { ActiveFilters } from "@/lib/filters/types";
import { Language, t } from "@/lib/i18n/translations";
import { CrowdLevel } from "@/types/mandal";

interface FilterBarProps {
    searchQuery: string;
    filters: ActiveFilters;
    language: Language;
    filteredCount: number;
    totalCount: number;
    hasActiveFilters: boolean;
    onSearchChange: (query: string) => void;
    onToggleCrowd: (level: CrowdLevel) => void;
    onToggleParking: (active: boolean) => void;
    onSetMinRating: (rating: number) => void;
    onResetAll: () => void;
}

const CROWD_OPTIONS: {
    level: CrowdLevel;
    labelKey: string;
    colorClass: string;
    dotClass: string;
}[] = [
    {
        level: "low",
        labelKey: "crowd.low",
        colorClass:
            "border-emerald-500/30 text-emerald-400 hover:border-emerald-400 bg-emerald-950/20",
        dotClass: "bg-emerald-400"
    },
    {
        level: "moderate",
        labelKey: "crowd.moderate",
        colorClass: "border-amber-500/30 text-amber-400 hover:border-amber-400 bg-amber-950/20",
        dotClass: "bg-amber-400"
    },
    {
        level: "heavy",
        labelKey: "crowd.heavy",
        colorClass: "border-orange-500/30 text-orange-400 hover:border-orange-400 bg-orange-950/20",
        dotClass: "bg-orange-400"
    },
    {
        level: "very_heavy",
        labelKey: "crowd.very_heavy",
        colorClass: "border-red-500/30 text-red-400 hover:border-red-400 bg-red-950/20",
        dotClass: "bg-red-400"
    }
];

export default function FilterBar({
    searchQuery,
    filters,
    language,
    filteredCount,
    totalCount,
    hasActiveFilters,
    onSearchChange,
    onToggleCrowd,
    onToggleParking,
    onSetMinRating,
    onResetAll
}: FilterBarProps) {
    const selectedCrowdLevels = filters.crowdLevels || [];
    const isParkingOnly = Boolean(filters.parkingNearbyOnly);
    const minRating = filters.minRating || 0;

    return (
        <section
            aria-label={language === "mr" ? "शोध आणि फिल्टर" : "Search and Filters"}
            className="w-full bg-brand-surface/90 backdrop-blur-md border border-brand-border rounded-xl p-3 sm:p-4 shadow-xl space-y-3"
        >
            {/* Top row: Search input and Reset CTA */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <input
                        type="search"
                        data-testid="filter-search-input"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t("filters.searchPlaceholder", language)}
                        className="w-full rounded-lg bg-brand-base/80 border border-brand-border pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:border-brand-marigold focus:outline-none focus:ring-1 focus:ring-brand-marigold transition-colors"
                        aria-label={t("filters.searchPlaceholder", language)}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            aria-label={t("filters.clearSearch", language)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Counter and Reset */}
                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                    <span data-testid="filter-count-badge" className="text-slate-300 font-medium">
                        {t("filters.showingResults", language)
                            .replace("{count}", String(filteredCount))
                            .replace("{total}", String(totalCount))}
                    </span>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            data-testid="filter-reset-btn"
                            onClick={onResetAll}
                            className="inline-flex items-center gap-1 text-brand-marigold hover:text-amber-300 underline font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-brand-marigold rounded px-1"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {t("filters.resetAll", language)}
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom row: Filter Chips & Toggles */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-brand-border/60">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                    {t("filters.crowdTitle", language)}:
                </span>

                {/* Crowd Level Chips */}
                <div
                    role="group"
                    aria-label={t("filters.crowdTitle", language)}
                    className="flex flex-wrap gap-1.5"
                >
                    {CROWD_OPTIONS.map((opt) => {
                        const isSelected = selectedCrowdLevels.includes(opt.level);
                        return (
                            <button
                                key={opt.level}
                                type="button"
                                data-testid={`filter-crowd-${opt.level}`}
                                aria-pressed={isSelected}
                                onClick={() => onToggleCrowd(opt.level)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all ${
                                    isSelected
                                        ? "ring-2 ring-brand-marigold " + opt.colorClass
                                        : "border-brand-border text-slate-300 hover:border-slate-500 bg-brand-base/40"
                                }`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${opt.dotClass}`} />
                                {t(opt.labelKey, language)}
                            </button>
                        );
                    })}
                </div>

                <div className="hidden sm:block h-4 w-px bg-brand-border mx-1" />

                {/* Parking Nearby Toggle */}
                <button
                    type="button"
                    data-testid="filter-parking-toggle"
                    aria-pressed={isParkingOnly}
                    onClick={() => onToggleParking(!isParkingOnly)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                        isParkingOnly
                            ? "border-brand-vermillion bg-brand-vermillion/20 text-brand-marigold ring-2 ring-brand-marigold/60"
                            : "border-brand-border text-slate-300 hover:border-slate-500 bg-brand-base/40"
                    }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-slate-300"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" />
                    </svg>
                    {t("filters.parkingNearby", language)}
                </button>

                {/* Minimum Rating Selector */}
                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    <label
                        htmlFor="min-rating-select"
                        className="text-[11px] text-slate-400 font-medium"
                    >
                        {t("filters.minRating", language)}:
                    </label>
                    <select
                        id="min-rating-select"
                        data-testid="filter-rating-select"
                        value={minRating}
                        onChange={(e) => onSetMinRating(parseFloat(e.target.value))}
                        className="rounded-lg bg-brand-base border border-brand-border px-2 py-0.5 text-xs text-slate-200 focus:border-brand-marigold focus:outline-none"
                    >
                        <option value="0">{t("filters.allRatings", language)}</option>
                        <option value="4.0">★ 4.0+</option>
                        <option value="4.5">★ 4.5+</option>
                        <option value="4.8">★ 4.8+</option>
                    </select>
                </div>
            </div>
        </section>
    );
}
