"use client";

import React, { useState } from "react";
import TurnstileWidget from "./TurnstileWidget";
import { Language, getLocalizedField, t } from "@/lib/i18n/translations";
import { MandalItem } from "@/types/mandal";

interface ReviewMandalFormProps {
    mandals: MandalItem[];
    language: Language;
    onSuccess: (submissionId: string) => void;
}

const CROWD_OPTIONS = [
    { value: "low", key: "crowd.low" },
    { value: "moderate", key: "crowd.moderate" },
    { value: "heavy", key: "crowd.heavy" },
    { value: "very_heavy", key: "crowd.very_heavy" }
] as const;

export default function ReviewMandalForm({ mandals, language, onSuccess }: ReviewMandalFormProps) {
    const [mandalSlug, setMandalSlug] = useState(mandals[0]?.slug || "");
    const [authorName, setAuthorName] = useState("");
    const [rating, setRating] = useState(5);
    const [crowdObservation, setCrowdObservation] = useState<
        "low" | "moderate" | "heavy" | "very_heavy" | ""
    >("");
    const [comment, setComment] = useState("");
    const [honeypot, setHoneypot] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!comment || comment.trim().length < 5) {
            setErrorMessage(
                language === "mr"
                    ? "पुनरावलोकन किमान ५ वर्णांचे असणे आवश्यक आहे."
                    : "Review comment must be at least 5 characters."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionType: "review",
                    mandalSlug,
                    authorName: authorName.trim() || "Devotee",
                    rating,
                    crowdObservation: crowdObservation || undefined,
                    comment: comment.trim(),
                    bappa_hp_website: honeypot || undefined,
                    turnstileToken
                })
            });

            if (!res.ok) {
                const problem = await res.json();
                setErrorMessage(problem.detail || "Submission failed. Please check your inputs.");
                setIsSubmitting(false);
                return;
            }

            const data = await res.json();
            onSuccess(data.submissionId);
        } catch {
            setErrorMessage("Network error occurred. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Invisible honeypot field */}
            <input
                type="text"
                name="bappa_hp_website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
            />

            {errorMessage && (
                <div
                    data-testid="review-form-error"
                    className="rounded-lg bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-300"
                >
                    {errorMessage}
                </div>
            )}

            {/* Target Mandal Selector */}
            <div>
                <label
                    htmlFor="select-review-mandal"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                >
                    {language === "mr" ? "मंडळ निवडा *" : "Select Mandal *"}
                </label>
                <select
                    id="select-review-mandal"
                    aria-label="Select Mandal"
                    data-testid="select-review-mandal"
                    value={mandalSlug}
                    onChange={(e) => setMandalSlug(e.target.value)}
                    className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-2 text-xs text-white focus:border-brand-marigold focus:outline-none"
                >
                    {mandals.map((m) => (
                        <option key={m.slug} value={m.slug}>
                            {getLocalizedField(m, "name", language)} ({m.localityEn})
                        </option>
                    ))}
                </select>
            </div>

            {/* Author / Devotee Name */}
            <div>
                <label
                    htmlFor="input-review-author"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                >
                    {language === "mr" ? "आपले नाव (ऐच्छिक)" : "Your Name (Optional)"}
                </label>
                <input
                    id="input-review-author"
                    type="text"
                    data-testid="input-review-author"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={language === "mr" ? "उदा. भाविक रोहन" : "e.g. Devotee Rohan"}
                    className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-marigold focus:outline-none"
                />
            </div>

            {/* 1-5 Star Rating */}
            <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {language === "mr" ? "दर्शन अनुभव रेटिंग *" : "Darshan Experience Rating *"}
                </label>
                <div
                    role="radiogroup"
                    aria-label="Darshan Rating"
                    className="flex items-center gap-1.5"
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={rating === star}
                            data-testid={`rating-star-${star}`}
                            onClick={() => setRating(star)}
                            className={`p-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-brand-marigold ${
                                rating >= star
                                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                    : "bg-brand-surface border-brand-border text-slate-600 hover:text-slate-400"
                            }`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 fill-current"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    ))}
                    <span className="ml-2 text-xs font-semibold text-amber-300">{rating} / 5</span>
                </div>
            </div>

            {/* Live Crowd Observation (Chips) */}
            <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {language === "mr" ? "सध्याची गर्दी पातळी" : "Live Crowd Observation"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CROWD_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            data-testid={`crowd-chip-${opt.value}`}
                            aria-pressed={crowdObservation === opt.value}
                            onClick={() =>
                                setCrowdObservation(crowdObservation === opt.value ? "" : opt.value)
                            }
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                                crowdObservation === opt.value
                                    ? "bg-brand-vermillion border-brand-marigold text-white shadow-sm"
                                    : "bg-brand-base border-brand-border text-slate-300 hover:border-slate-500"
                            }`}
                        >
                            {t(opt.key, language)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment Area */}
            <div>
                <label
                    htmlFor="textarea-review-comment"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                >
                    {language === "mr"
                        ? "पुनरावलोकन व अनुभव (किमान ५ अक्षरे) *"
                        : "Review & Darshan Experience (Min 5 chars) *"}
                </label>
                <textarea
                    id="textarea-review-comment"
                    rows={3}
                    required
                    data-testid="textarea-review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                        language === "mr"
                            ? "दर्शन रांग, आरतीची वेळ, प्रसादाची सोय याबद्दल माहिती लिहा..."
                            : "Share darshan wait times, mukh/navas queue status, or arrangements..."
                    }
                    className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-marigold focus:outline-none"
                />
            </div>

            {/* Turnstile bot check */}
            <TurnstileWidget onVerify={setTurnstileToken} />

            {/* Submit CTA */}
            <div className="pt-2">
                <button
                    type="submit"
                    data-testid="submit-review-btn"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-brand-vermillion hover:bg-red-700 disabled:opacity-50 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                >
                    {isSubmitting
                        ? "Submitting..."
                        : language === "mr"
                          ? "पुनरावलोकन मंजुरीसाठी सादर करा"
                          : "Submit Review for Volunteer Review"}
                </button>
            </div>
        </form>
    );
}
