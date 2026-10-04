"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { ActiveFilters } from "@/lib/filters/types";
import { parseFiltersFromUrl, serializeFiltersToUrl } from "@/lib/filters/engine";
import { Language } from "@/lib/i18n/translations";
import { CrowdLevel } from "@/types/mandal";

const STORAGE_KEY_LANG = "bappamap_language";

export interface UseMandalFiltersReturn {
    searchQuery: string;
    filters: ActiveFilters;
    language: Language;
    selectedMandalSlug: string | null;
    isPending: boolean;
    setSearchQuery: (query: string) => void;
    toggleCrowdLevel: (level: CrowdLevel) => void;
    setParkingNearbyOnly: (value: boolean) => void;
    setMinRating: (rating: number) => void;
    resetFilters: () => void;
    setLanguage: (lang: Language) => void;
    setSelectedMandalSlug: (slug: string | null) => void;
    hasActiveFilters: boolean;
}

export function useMandalFilters(): UseMandalFiltersReturn {
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // 1. Initial State from URL
    const [searchQuery, setSearchQueryState] = useState<string>(() => {
        return searchParams?.get("q") || "";
    });

    const [filters, setFiltersState] = useState<ActiveFilters>(() => {
        if (!searchParams) return {};
        return parseFiltersFromUrl(searchParams).filters;
    });

    const [language, setLanguageState] = useState<Language>(() => {
        // Priority: 1. URL param -> 2. LocalStorage -> 3. Default 'en'
        const urlLang = searchParams?.get("lang");
        if (urlLang === "mr" || urlLang === "en") {
            return urlLang;
        }
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY_LANG);
            if (saved === "mr" || saved === "en") {
                return saved;
            }
        }
        return "en";
    });

    const [selectedMandalSlug, setSelectedMandalSlug] = useState<string | null>(null);

    // Synchronize URL with active state
    const syncUrl = useCallback(
        (newFilters: ActiveFilters, newQuery: string, newLang: Language) => {
            if (typeof window === "undefined") return;

            const queryString = serializeFiltersToUrl(newFilters, newQuery);
            const params = new URLSearchParams(queryString);

            // Add language if non-default or explicit
            if (newLang === "mr") {
                params.set("lang", "mr");
            } else if (newLang === "en" && searchParams?.get("lang")) {
                params.set("lang", "en");
            }

            const newUrl = params.toString()
                ? `${window.location.pathname}?${params.toString()}`
                : window.location.pathname;

            window.history.replaceState(null, "", newUrl);
        },
        [searchParams]
    );

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            const currentParams = new URLSearchParams(window.location.search);
            const parsed = parseFiltersFromUrl(currentParams);
            setFiltersState(parsed.filters);
            setSearchQueryState(parsed.searchQuery);

            const urlLang = currentParams.get("lang");
            if (urlLang === "mr" || urlLang === "en") {
                setLanguageState(urlLang);
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // Filter mutations
    const setSearchQuery = useCallback(
        (query: string) => {
            setSearchQueryState(query);
            startTransition(() => {
                syncUrl(filters, query, language);
            });
        },
        [filters, language, syncUrl]
    );

    const toggleCrowdLevel = useCallback(
        (level: CrowdLevel) => {
            setFiltersState((prev) => {
                const currentLevels = prev.crowdLevels || [];
                const updated = currentLevels.includes(level)
                    ? currentLevels.filter((l) => l !== level)
                    : [...currentLevels, level];

                const next = { ...prev, crowdLevels: updated };
                startTransition(() => {
                    syncUrl(next, searchQuery, language);
                });
                return next;
            });
        },
        [language, searchQuery, syncUrl]
    );

    const setParkingNearbyOnly = useCallback(
        (value: boolean) => {
            setFiltersState((prev) => {
                const next = { ...prev, parkingNearbyOnly: value };
                startTransition(() => {
                    syncUrl(next, searchQuery, language);
                });
                return next;
            });
        },
        [language, searchQuery, syncUrl]
    );

    const setMinRating = useCallback(
        (rating: number) => {
            setFiltersState((prev) => {
                const next = { ...prev, minRating: rating };
                startTransition(() => {
                    syncUrl(next, searchQuery, language);
                });
                return next;
            });
        },
        [language, searchQuery, syncUrl]
    );

    const resetFilters = useCallback(() => {
        setFiltersState({});
        setSearchQueryState("");
        startTransition(() => {
            syncUrl({}, "", language);
        });
    }, [language, syncUrl]);

    const setLanguage = useCallback(
        (newLang: Language) => {
            setLanguageState(newLang);
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY_LANG, newLang);
            }
            startTransition(() => {
                syncUrl(filters, searchQuery, newLang);
            });
        },
        [filters, searchQuery, syncUrl]
    );

    const hasActiveFilters = Boolean(
        searchQuery.trim().length > 0 ||
        (filters.crowdLevels && filters.crowdLevels.length > 0) ||
        filters.parkingNearbyOnly ||
        (filters.minRating && filters.minRating > 0)
    );

    return {
        searchQuery,
        filters,
        language,
        selectedMandalSlug,
        isPending,
        setSearchQuery,
        toggleCrowdLevel,
        setParkingNearbyOnly,
        setMinRating,
        resetFilters,
        setLanguage,
        setSelectedMandalSlug,
        hasActiveFilters
    };
}
