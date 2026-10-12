"use client";

import React, { useMemo, useState, useEffect } from "react";
import MapContainer from "@/components/map/MapContainer";
import FilterBar from "@/components/filters/FilterBar";
import MandalCardList from "@/components/directory/MandalCardList";
import ContributionModal from "@/components/modals/ContributionModal";
import MandalGalleryModal from "@/components/modals/MandalGalleryModal";
import ThemeToggle from "@/components/common/ThemeToggle";
import FestiveBackground from "@/components/ui/FestiveBackground";
import GaneshaIcon from "@/components/icons/GaneshaIcon";
import { useMandalFilters } from "@/hooks/useMandalFilters";
import { useTheme } from "@/hooks/useTheme";
import { filterMandals } from "@/lib/filters/engine";
import { MandalItem } from "@/types/mandal";
import { t } from "@/lib/i18n/translations";

interface MandalExplorerProps {
    initialMandals: MandalItem[];
}

export default function MandalExplorer({ initialMandals }: MandalExplorerProps) {
    const {
        searchQuery,
        filters,
        language,
        selectedMandalSlug,
        setSearchQuery,
        toggleCrowdLevel,
        setParkingNearbyOnly,
        setMinRating,
        resetFilters,
        setLanguage,
        setSelectedMandalSlug,
        hasActiveFilters
    } = useMandalFilters();

    const { theme, toggleTheme } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [galleryMandal, setGalleryMandal] = useState<MandalItem | null>(null);
    const [mandals, setMandals] = useState<MandalItem[]>(initialMandals);

    useEffect(() => {
        setMandals(initialMandals);
    }, [initialMandals]);

    // Live update on client mount, window focus, and Real-Time SSE
    useEffect(() => {
        let isMounted = true;
        const fetchFreshMandals = async () => {
            try {
                const res = await fetch("/api/mandals", {
                    cache: "no-store"
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && Array.isArray(data) && data.length > 0) {
                        setMandals((prev) => {
                            if (prev.length === data.length && prev.every((m, i) => m.slug === data[i].slug && m.currentCrowdLevel === data[i].currentCrowdLevel && m.avgRating === data[i].avgRating)) {
                                return prev;
                            }
                            return data;
                        });
                    }
                }
            } catch {
                // Ignore network error in offline mode
            }
        };

        fetchFreshMandals();
        window.addEventListener("focus", fetchFreshMandals);

        // Real-Time Server-Sent Events (SSE) stream
        let eventSource: EventSource | null = null;
        try {
            eventSource = new EventSource("/api/events");

            eventSource.addEventListener("mandal_approved", (e: MessageEvent) => {
                try {
                    const eventData = JSON.parse(e.data);
                    if (eventData?.mandal && isMounted) {
                        setMandals((prev) => {
                            const exists = prev.some((m) => m.slug === eventData.mandal.slug);
                            if (exists) {
                                return prev.map((m) =>
                                    m.slug === eventData.mandal.slug ? { ...m, ...eventData.mandal } : m
                                );
                            }
                            return [...prev, eventData.mandal];
                        });
                    }
                } catch (err) {
                    console.error("Error processing mandal_approved SSE:", err);
                }
            });

            eventSource.addEventListener("crowd_updated", (e: MessageEvent) => {
                try {
                    const eventData = JSON.parse(e.data);
                    if (eventData?.slug && isMounted) {
                        setMandals((prev) =>
                            prev.map((m) => {
                                if (m.slug === eventData.slug) {
                                    const updated = { ...m };
                                    if (eventData.crowdLevel) {
                                        updated.currentCrowdLevel = eventData.crowdLevel;
                                    }
                                    if (eventData.queueType === "charan_sparsh") {
                                        updated.charanSparshCrowd = {
                                            level: eventData.crowdLevel,
                                            confidence: 0.8,
                                            lastUpdated: new Date().toISOString()
                                        };
                                    } else {
                                        updated.mukhDarshanCrowd = {
                                            level: eventData.crowdLevel,
                                            confidence: 0.8,
                                            lastUpdated: new Date().toISOString()
                                        };
                                    }
                                    return updated;
                                }
                                return m;
                            })
                        );
                    }
                } catch (err) {
                    console.error("Error processing crowd_updated SSE:", err);
                }
            });

            eventSource.addEventListener("review_approved", (e: MessageEvent) => {
                try {
                    const eventData = JSON.parse(e.data);
                    if (eventData?.slug && isMounted) {
                        setMandals((prev) =>
                            prev.map((m) =>
                                m.slug === eventData.slug
                                    ? {
                                          ...m,
                                          avgRating: eventData.newRating ?? m.avgRating,
                                          reviewCount: eventData.reviewCount ?? m.reviewCount
                                      }
                                    : m
                            )
                        );
                    }
                } catch (err) {
                    console.error("Error processing review_approved SSE:", err);
                }
            });

            eventSource.addEventListener("photo_approved", (e: MessageEvent) => {
                try {
                    const eventData = JSON.parse(e.data);
                    if (eventData?.slug && eventData?.photo && isMounted) {
                        setMandals((prev) =>
                            prev.map((m) => {
                                if (m.slug === eventData.slug) {
                                    const existingPhotos = m.photos || [];
                                    const exists = existingPhotos.some((p) => p.id === eventData.photo.id);
                                    if (exists) return m;
                                    return {
                                        ...m,
                                        photos: [eventData.photo, ...existingPhotos]
                                    };
                                }
                                return m;
                            })
                        );
                    }
                } catch (err) {
                    console.error("Error processing photo_approved SSE:", err);
                }
            });
        } catch {
            // SSE connection fallback
        }

        return () => {
            isMounted = false;
            window.removeEventListener("focus", fetchFreshMandals);
            if (eventSource) {
                eventSource.close();
            }
        };
    }, []);

    // 1. Filter mandals based on active filters and search query
    const filteredMandals = useMemo(() => {
        return filterMandals(mandals, filters, searchQuery);
    }, [mandals, filters, searchQuery]);

    const filteredMandalSlugs = useMemo(() => {
        return filteredMandals.map((m) => m.slug);
    }, [filteredMandals]);

    // 2. Card click -> focus map pin and scroll up to map
    const handleCardSelect = React.useCallback(
        (mandal: MandalItem) => {
            setSelectedMandalSlug(mandal.slug);
            // Scroll up to map smoothly so user can see the focused pin and popup
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        [setSelectedMandalSlug]
    );

    // 3. Map pin click -> update selected mandal in state without scrolling away from map
    const handlePinSelect = React.useCallback(
        (mandal: MandalItem) => {
            setSelectedMandalSlug(mandal.slug);
        },
        [setSelectedMandalSlug]
    );

    return (
        <div className="relative min-h-screen flex flex-col bg-brand-base text-slate-800 dark:text-slate-100 selection:bg-brand-vermillion selection:text-white">
            {/* Festive Animated Background */}
            <FestiveBackground />

            {/* Header */}
            <header className="sticky top-0 z-30 w-full border-b border-brand-border bg-brand-base/90 dark:bg-brand-base/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-brand-vermillion/20 to-amber-600/30 p-0.5 border border-brand-marigold/30 shadow-md">
                            <GaneshaIcon size={38} className="w-9 h-9" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                                    {language === "mr" ? "बाप्पा मॅप" : "BappaMap"}{" "}
                                    <span className="text-brand-vermillion dark:text-brand-marigold font-semibold">
                                        {language === "mr" ? "मुंबई" : "Mumbai"}
                                    </span>
                                </h1>
                                <span className="rounded-full bg-red-100 dark:bg-brand-vermillion/25 px-2 py-0.5 text-[10px] font-semibold text-red-800 dark:text-amber-200 border border-red-300 dark:border-brand-vermillion/40">
                                    {t("app.tagline", language)}
                                </span>
                            </div>
                            <p className="text-[11px] text-brand-vermillion dark:text-brand-marigold font-marathi line-clamp-1">
                                {t("app.subtitle", language)}
                            </p>
                        </div>
                    </div>

                    {/* Controls: Theme Toggle, Language Switch & UGC Trigger */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Light / Dark Mode Switcher */}
                        <ThemeToggle theme={theme} onToggle={toggleTheme} language={language} />

                        {/* Language Switcher */}
                        <div
                            role="group"
                            aria-label="Language selection"
                            className="flex items-center rounded-lg border border-brand-border bg-brand-surface p-0.5 text-xs font-medium"
                        >
                            <button
                                type="button"
                                data-testid="lang-toggle-en"
                                aria-pressed={language === "en"}
                                onClick={() => setLanguage("en")}
                                className={`rounded px-2 py-1 transition-all ${
                                    language === "en"
                                        ? "bg-brand-vermillion font-semibold text-white shadow"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                EN
                            </button>
                            <button
                                type="button"
                                data-testid="lang-toggle-mr"
                                aria-pressed={language === "mr"}
                                onClick={() => setLanguage("mr")}
                                className={`rounded px-2 py-1 font-marathi transition-all ${
                                    language === "mr"
                                        ? "bg-brand-vermillion font-semibold text-white shadow"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                मराठी
                            </button>
                        </div>

                        {/* Mandal count badge */}
                        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>
                                {filteredMandals.length} {t("nav.mandalsCount", language)}
                            </span>
                        </div>

                        {/* UGC Contribution Modal Trigger */}
                        <button
                            type="button"
                            data-testid="add-review-modal-btn"
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-vermillion px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-950/30 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                        >
                            {t("nav.addReview", language)}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Stage */}
            <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6">
                {/* 1. Interactive Map Container */}
                <section
                    aria-label={language === "mr" ? "परस्परसंवादी नकाशा" : "Interactive Map"}
                    className="w-full h-[400px] sm:h-[480px] rounded-xl overflow-hidden shadow-2xl"
                >
                    <MapContainer
                        mandals={mandals}
                        filteredMandalSlugs={filteredMandalSlugs}
                        selectedMandalSlug={selectedMandalSlug}
                        language={language}
                        theme={theme}
                        onSelectMandal={handlePinSelect}
                        onOpenGallery={setGalleryMandal}
                    />
                </section>

                {/* 2. Extensible Filter Bar */}
                <FilterBar
                    searchQuery={searchQuery}
                    filters={filters}
                    language={language}
                    filteredCount={filteredMandals.length}
                    totalCount={mandals.length}
                    hasActiveFilters={hasActiveFilters}
                    onSearchChange={setSearchQuery}
                    onToggleCrowd={toggleCrowdLevel}
                    onToggleParking={setParkingNearbyOnly}
                    onSetMinRating={setMinRating}
                    onResetAll={resetFilters}
                />

                {/* 3. Filterable Mandal Card Directory */}
                <MandalCardList
                    mandals={filteredMandals}
                    language={language}
                    selectedMandalSlug={selectedMandalSlug}
                    onSelectMandal={handleCardSelect}
                    onResetFilters={resetFilters}
                    onOpenGallery={setGalleryMandal}
                />
            </main>

            {/* Footer & Privacy Assurance */}
            <footer className="relative z-10 mt-auto border-t border-brand-border bg-brand-surface/80 py-6 px-4 text-center text-xs text-slate-700 dark:text-slate-300">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {t("footer.copyright", language)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {t("footer.zeroGeo", language)}
                        </span>
                        <span>•</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {t("footer.osmAttribution", language)}
                        </span>
                    </div>
                </div>
            </footer>

            {/* Contribution Modal (Suggest, Review, Photo) */}
            <ContributionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mandals={mandals}
                language={language}
            />

            {/* Community Photo Gallery Modal */}
            <MandalGalleryModal
                isOpen={!!galleryMandal}
                onClose={() => setGalleryMandal(null)}
                mandal={galleryMandal}
                language={language}
            />
        </div>
    );
}
