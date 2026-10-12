"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MandalItem, MandalPhoto } from "@/types/mandal";
import { Language, t, getLocalizedField } from "@/lib/i18n/translations";

interface MandalGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    mandal: MandalItem | null;
    language: Language;
}

export default function MandalGalleryModal({
    isOpen,
    onClose,
    mandal,
    language
}: MandalGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const photos: MandalPhoto[] = mandal?.photos || [];

    // Reset index whenever modal opens or mandal changes
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
        }
    }, [isOpen, mandal]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    }, [photos.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    }, [photos.length]);

    // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft") {
                handlePrev();
            } else if (e.key === "ArrowRight") {
                handleNext();
            }
        },
        [isOpen, onClose, handlePrev, handleNext]
    );

    useEffect(() => {
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen || !mandal || photos.length === 0) {
        return null;
    }

    const currentPhoto = photos[currentIndex] || photos[0];
    const mandalName = getLocalizedField(mandal, "name", language);
    const secondaryName = language === "mr" ? mandal.nameEn : mandal.nameMr;

    return (
        <div
            data-testid="mandal-gallery-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${mandalName} ${t("gallery.title", language)}`}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
            {/* Modal Dialog Card */}
            <div
                className="relative flex flex-col w-full max-w-3xl max-h-[92vh] rounded-2xl bg-brand-surface border border-brand-border shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-surface/90">
                    <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                            <span className="text-amber-500 text-sm">📷</span>
                            <h2
                                className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate ${
                                    language === "mr" ? "font-marathi" : "font-sans"
                                }`}
                            >
                                {mandalName}
                            </h2>
                        </div>
                        {secondaryName && secondaryName !== mandalName && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate pl-6">
                                {secondaryName}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-base border border-brand-border text-slate-600 dark:text-slate-300">
                            {currentIndex + 1} / {photos.length}
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            data-testid="gallery-close-btn"
                            aria-label={t("gallery.close", language)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-brand-base transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold cursor-pointer"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Photo Viewer */}
                <div className="relative flex-1 flex items-center justify-center bg-black/95 min-h-[300px] sm:min-h-[420px] max-h-[60vh] overflow-hidden select-none">
                    {/* Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        key={currentPhoto.url}
                        src={currentPhoto.url}
                        alt={currentPhoto.caption || `${mandalName} Darshan`}
                        data-testid="gallery-active-image"
                        className="max-h-[58vh] max-w-full object-contain transition-opacity duration-200"
                    />

                    {/* Navigation Arrows (if > 1 photo) */}
                    {photos.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={handlePrev}
                                data-testid="gallery-prev-btn"
                                aria-label={t("gallery.previous", language)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-marigold cursor-pointer"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={handleNext}
                                data-testid="gallery-next-btn"
                                aria-label={t("gallery.next", language)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-marigold cursor-pointer"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </>
                    )}
                </div>

                {/* Footer Metadata & Attribution */}
                <div className="p-3 sm:p-4 border-t border-brand-border bg-brand-surface flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-brand-marigold">
                                {t("gallery.by", language)}
                            </span>
                            <span className="font-medium">
                                {currentPhoto.contributor || "Devotee"}
                            </span>
                        </div>
                        {currentPhoto.createdAt && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {new Date(currentPhoto.createdAt).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                })}
                            </span>
                        )}
                    </div>

                    {currentPhoto.caption && (
                        <p className="text-xs text-slate-800 dark:text-slate-200 italic bg-brand-base/60 p-2 rounded-lg border border-brand-border/60">
                            &ldquo;{currentPhoto.caption}&rdquo;
                        </p>
                    )}

                    {/* Thumbnail Bar (if > 1 photo) */}
                    {photos.length > 1 && (
                        <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
                            {photos.map((p, idx) => (
                                <button
                                    key={p.id || idx}
                                    type="button"
                                    onClick={() => setCurrentIndex(idx)}
                                    aria-label={`View photo ${idx + 1}`}
                                    className={`relative shrink-0 h-12 w-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                        idx === currentIndex
                                            ? "border-brand-marigold scale-105 shadow-md"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={p.url}
                                        alt={p.caption || `Thumbnail ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
