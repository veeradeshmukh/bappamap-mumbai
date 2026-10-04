"use client";

import React, { useState } from "react";
import TurnstileWidget from "./TurnstileWidget";
import { Language, getLocalizedField } from "@/lib/i18n/translations";
import { MandalItem } from "@/types/mandal";
import { stripExifAndCompress } from "@/lib/media/canvas-processor";

interface UploadPhotoFormProps {
    mandals: MandalItem[];
    language: Language;
    onSuccess: (submissionId: string) => void;
}

export default function UploadPhotoForm({ mandals, language, onSuccess }: UploadPhotoFormProps) {
    const [mandalSlug, setMandalSlug] = useState(mandals[0]?.slug || "");
    const [contributorName, setContributorName] = useState("");
    const [caption, setCaption] = useState("");
    const [processedPhoto, setProcessedPhoto] = useState<{
        blob: Blob;
        dataUrl: string;
        width: number;
        height: number;
    } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [honeypot, setHoneypot] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorMessage(null);
        setIsProcessing(true);

        try {
            // Strip metadata via HTML5 canvas and convert to normalized WebP
            const result = await stripExifAndCompress(file);
            setProcessedPhoto(result);
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to process photo.");
            setProcessedPhoto(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!processedPhoto) {
            setErrorMessage(
                language === "mr"
                    ? "कृपया छायाचित्र निवडा."
                    : "Please select an image file to upload."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("submissionType", "photo");
            formData.append("mandalSlug", mandalSlug);
            formData.append("contributorName", contributorName.trim() || "Devotee");
            if (caption.trim()) {
                formData.append("caption", caption.trim());
            }
            const effectiveToken =
                turnstileToken ||
                (process.env.NODE_ENV !== "production" ? "1x00000000000000000000AA" : "");
            formData.append("turnstileToken", effectiveToken);
            formData.append("photo", processedPhoto.blob, "mandal.webp");
            formData.append("photoDataUrl", processedPhoto.dataUrl);
            if (honeypot) {
                formData.append("bappa_hp_website", honeypot);
            }

            const res = await fetch("/api/submissions", {
                method: "POST",
                body: formData
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
                    data-testid="photo-form-error"
                    className="rounded-lg bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-300"
                >
                    {errorMessage}
                </div>
            )}

            {/* Target Mandal Selector */}
            <div>
                <label
                    htmlFor="select-photo-mandal"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                    {language === "mr" ? "मंडळ निवडा *" : "Select Mandal *"}
                </label>
                <select
                    id="select-photo-mandal"
                    aria-label="Select Mandal"
                    data-testid="select-photo-mandal"
                    value={mandalSlug}
                    onChange={(e) => setMandalSlug(e.target.value)}
                    className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-marigold focus:outline-none"
                >
                    {mandals.map((m) => (
                        <option key={m.slug} value={m.slug}>
                            {getLocalizedField(m, "name", language)} ({m.localityEn})
                        </option>
                    ))}
                </select>
            </div>

            {/* Contributor Name */}
            <div>
                <label
                    htmlFor="input-photo-contributor"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                    {language === "mr" ? "आपले नाव (ऐच्छिक)" : "Your Name (Optional)"}
                </label>
                <input
                    id="input-photo-contributor"
                    type="text"
                    data-testid="input-photo-contributor"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder={language === "mr" ? "उदा. भाविक रोहन" : "e.g. Devotee Rohan"}
                    className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-marigold focus:outline-none"
                />
            </div>

            {/* Photo Caption */}
            <div>
                <label
                    htmlFor="input-photo-caption"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                    {language === "mr" ? "छायाचित्राचे वर्णन (ऐच्छिक)" : "Photo Caption (Optional)"}
                </label>
                <input
                    id="input-photo-caption"
                    type="text"
                    data-testid="input-photo-caption"
                    value={caption}
                    maxLength={200}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={
                        language === "mr"
                            ? "उदा. संध्याकाळची आरती व मंडप सजावट..."
                            : "e.g. Evening Aarti decoration or pandal entrance..."
                    }
                    className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-marigold focus:outline-none"
                />
            </div>

            {/* Photo File Picker & EXIF Pre-Flight Status */}
            <div>
                <label
                    htmlFor="input-photo-file"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                    {language === "mr"
                        ? "छायाचित्र निवडा (कमाल ५ MB) *"
                        : "Upload Photo (Max 5 MB) *"}
                </label>
                <input
                    id="input-photo-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    data-testid="input-photo-file"
                    onChange={handleFileChange}
                    className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-surface file:text-brand-marigold hover:file:bg-brand-border cursor-pointer focus:outline-none"
                />

                {isProcessing && (
                    <p className="mt-2 text-xs text-amber-300 animate-pulse">
                        {language === "mr"
                            ? "कॅमेरा व स्थान माहिती हटवत आहे (EXIF stripping)..."
                            : "Stripping EXIF/GPS metadata and compressing..."}
                    </p>
                )}

                {processedPhoto && (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={processedPhoto.dataUrl}
                            alt="Processed preview"
                            data-testid="photo-preview-thumbnail"
                            className="h-14 w-14 rounded-md object-cover border border-emerald-500/40"
                        />
                        <div className="flex-1 text-[11px]">
                            <div
                                data-testid="photo-exif-stripped-badge"
                                className="flex items-center gap-1 font-semibold text-emerald-400"
                            >
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
                                <span>
                                    {language === "mr"
                                        ? "सुरक्षित: EXIF व GPS डेटा हटवला"
                                        : "EXIF & GPS metadata stripped"}
                                </span>
                            </div>
                            <p className="text-slate-400 mt-0.5">
                                WebP • {processedPhoto.width} × {processedPhoto.height} px
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Turnstile bot check */}
            <TurnstileWidget onVerify={setTurnstileToken} />

            {/* Submit CTA */}
            <div className="pt-2">
                <button
                    type="submit"
                    data-testid="submit-photo-btn"
                    disabled={isSubmitting || isProcessing || !processedPhoto}
                    className="w-full rounded-lg bg-brand-vermillion hover:bg-red-700 disabled:opacity-50 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                >
                    {isSubmitting
                        ? "Uploading for Review..."
                        : language === "mr"
                          ? "छायाचित्र मंजुरीसाठी सादर करा"
                          : "Submit Photo for Volunteer Review"}
                </button>
            </div>
        </form>
    );
}
