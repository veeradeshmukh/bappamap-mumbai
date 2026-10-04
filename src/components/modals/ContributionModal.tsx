"use client";

import React, { useState, useEffect, useCallback } from "react";
import SuggestMandalForm from "./SuggestMandalForm";
import ReviewMandalForm from "./ReviewMandalForm";
import UploadPhotoForm from "./UploadPhotoForm";
import { Language, t } from "@/lib/i18n/translations";
import { MandalItem } from "@/types/mandal";

export type ContributionTab = "suggest" | "review" | "photo";

interface ContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mandals: MandalItem[];
    language: Language;
    initialTab?: ContributionTab;
}

export default function ContributionModal({
    isOpen,
    onClose,
    mandals,
    language,
    initialTab = "suggest"
}: ContributionModalProps) {
    const [activeTab, setActiveTab] = useState<ContributionTab>(initialTab);
    const [submittedId, setSubmittedId] = useState<string | null>(null);

    // Synchronize initialTab if provided upon opening
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setSubmittedId(null);
        }
    }, [isOpen, initialTab]);

    // Handle Escape key listener for WCAG keyboard parity
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        },
        [isOpen, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            // Prevent background page scrolling while modal is open
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, handleKeyDown]);

    const handleSuccess = (submissionId: string) => {
        setSubmittedId(submissionId);
    };

    const handleReceiptClose = () => {
        setSubmittedId(null);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            data-testid="contribution-modal-backdrop"
            onClick={onClose}
        >
            {/* Modal backdrop with blur */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

            {/* Modal dialog surface */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="contribution-modal-title"
                data-testid="contribution-modal-dialog"
                className="relative z-10 w-full max-w-xl rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6 shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-brand-border pb-4 mb-4">
                    <div>
                        <h2
                            id="contribution-modal-title"
                            data-testid="contribution-modal-title"
                            className="text-lg font-bold text-white tracking-tight"
                        >
                            {t("modal.title", language)}
                        </h2>
                        <p className="text-xs text-brand-marigold font-marathi mt-0.5">
                            {language === "mr"
                                ? "दक्षिण मुंबई गणेशोत्सव समुदाय संचिका (कुलाबा ते लालबाग)"
                                : "South Mumbai Ganeshotsav Community Directory"}
                        </p>
                    </div>

                    <button
                        type="button"
                        data-testid="modal-close-btn"
                        aria-label="Close dialog"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-base hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                {/* Body Content */}
                {submittedId ? (
                    /* Submission Success Receipt */
                    <div
                        data-testid="submission-success-receipt"
                        className="py-6 text-center space-y-4"
                    >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white">
                                {t("modal.successTitle", language)}
                            </h3>
                            <p className="mt-2 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                {t("modal.successDetail", language)}
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-400">
                            <span>Receipt ID:</span>
                            <code
                                data-testid="receipt-submission-id"
                                className="text-brand-marigold font-mono font-semibold"
                            >
                                {submittedId}
                            </code>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                data-testid="receipt-close-btn"
                                onClick={handleReceiptClose}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-brand-vermillion hover:bg-red-700 text-xs font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                            >
                                {t("modal.backToMap", language)}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Form Navigation Tabs & Active Tab Panel */
                    <div className="space-y-4">
                        {/* Tab List */}
                        <div
                            role="tablist"
                            aria-label="Contribution options"
                            className="grid grid-cols-3 gap-1 rounded-xl bg-brand-base p-1 border border-brand-border"
                        >
                            <button
                                type="button"
                                role="tab"
                                id="tab-suggest"
                                aria-selected={activeTab === "suggest"}
                                aria-controls="panel-suggest"
                                data-testid="tab-suggest"
                                onClick={() => setActiveTab("suggest")}
                                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                                    activeTab === "suggest"
                                        ? "bg-brand-vermillion text-white shadow-sm"
                                        : "text-slate-400 hover:text-white"
                                }`}
                            >
                                {t("modal.tabSuggest", language)}
                            </button>
                            <button
                                type="button"
                                role="tab"
                                id="tab-review"
                                aria-selected={activeTab === "review"}
                                aria-controls="panel-review"
                                data-testid="tab-review"
                                onClick={() => setActiveTab("review")}
                                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                                    activeTab === "review"
                                        ? "bg-brand-vermillion text-white shadow-sm"
                                        : "text-slate-400 hover:text-white"
                                }`}
                            >
                                {t("modal.tabReview", language)}
                            </button>
                            <button
                                type="button"
                                role="tab"
                                id="tab-photo"
                                aria-selected={activeTab === "photo"}
                                aria-controls="panel-photo"
                                data-testid="tab-photo"
                                onClick={() => setActiveTab("photo")}
                                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                                    activeTab === "photo"
                                        ? "bg-brand-vermillion text-white shadow-sm"
                                        : "text-slate-400 hover:text-white"
                                }`}
                            >
                                {t("modal.tabPhoto", language)}
                            </button>
                        </div>

                        {/* Active Panel */}
                        <div className="pt-2">
                            {activeTab === "suggest" && (
                                <div
                                    role="tabpanel"
                                    id="panel-suggest"
                                    aria-labelledby="tab-suggest"
                                >
                                    <SuggestMandalForm
                                        language={language}
                                        onSuccess={handleSuccess}
                                    />
                                </div>
                            )}

                            {activeTab === "review" && (
                                <div role="tabpanel" id="panel-review" aria-labelledby="tab-review">
                                    <ReviewMandalForm
                                        mandals={mandals}
                                        language={language}
                                        onSuccess={handleSuccess}
                                    />
                                </div>
                            )}

                            {activeTab === "photo" && (
                                <div role="tabpanel" id="panel-photo" aria-labelledby="tab-photo">
                                    <UploadPhotoForm
                                        mandals={mandals}
                                        language={language}
                                        onSuccess={handleSuccess}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
