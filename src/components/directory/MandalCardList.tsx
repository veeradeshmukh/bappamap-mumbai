"use client";

import React from "react";
import MandalCard from "./MandalCard";
import { MandalItem } from "@/types/mandal";
import { Language, t } from "@/lib/i18n/translations";

interface MandalCardListProps {
    mandals: MandalItem[];
    language: Language;
    selectedMandalSlug: string | null;
    onSelectMandal: (mandal: MandalItem) => void;
    onResetFilters: () => void;
}

export default function MandalCardList({
    mandals,
    language,
    selectedMandalSlug,
    onSelectMandal,
    onResetFilters
}: MandalCardListProps) {
    if (mandals.length === 0) {
        return (
            <div
                data-testid="mandal-list-empty"
                className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-brand-border bg-brand-surface/40 my-4 space-y-3"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-surface border border-brand-border text-brand-marigold">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
                <h4 className="text-base font-semibold text-white">
                    {t("filters.noResults", language)}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                    {t("filters.resetPrompt", language)}
                </p>
                <button
                    type="button"
                    onClick={onResetFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-vermillion px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                >
                    {t("filters.resetAll", language)}
                </button>
            </div>
        );
    }

    return (
        <section
            aria-label={language === "mr" ? "मंडळ सूची" : "Mandal Directory"}
            className="w-full"
        >
            <div
                data-testid="mandal-directory-grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                {mandals.map((mandal) => (
                    <MandalCard
                        key={mandal.slug}
                        mandal={mandal}
                        language={language}
                        isSelected={mandal.slug === selectedMandalSlug}
                        onSelect={onSelectMandal}
                    />
                ))}
            </div>
        </section>
    );
}
