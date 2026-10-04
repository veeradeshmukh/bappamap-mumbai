"use client";

import React, { useState } from "react";
import TurnstileWidget from "./TurnstileWidget";
import { Language } from "@/lib/i18n/translations";

interface SuggestMandalFormProps {
    language: Language;
    onSuccess: (submissionId: string) => void;
}

const BMC_WARDS = [
    { value: "A", label: "Ward A (Colaba, Fort, Churchgate)" },
    { value: "B", label: "Ward B (Dongri, Mandvi, Umerkhadi)" },
    { value: "C", label: "Ward C (Kalbadevi, Bhuleshwar, Marine Lines)" },
    { value: "D", label: "Ward D (Girgaon, Malabar Hill, Khetwadi, Grant Road)" },
    { value: "E", label: "Ward E (Byculla, Mazgaon, Chinchpokli)" },
    { value: "F/South", label: "Ward F/South (Lalbaug, Parel, Sewri)" }
];

export default function SuggestMandalForm({ language, onSuccess }: SuggestMandalFormProps) {
    const [nameEn, setNameEn] = useState("");
    const [nameMr, setNameMr] = useState("");
    const [localityEn, setLocalityEn] = useState("");
    const [localityMr, setLocalityMr] = useState("");
    const [bmcWard, setBmcWard] = useState("D");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [foundedYear, setFoundedYear] = useState("");
    const [description, setDescription] = useState("");
    const [honeypot, setHoneypot] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const latNum = parseFloat(latitude);
        const lngNum = parseFloat(longitude);

        if (isNaN(latNum) || isNaN(lngNum)) {
            setErrorMessage(
                language === "mr"
                    ? "कृपया वैध अक्षांश आणि रेखांश प्रविष्ट करा."
                    : "Please enter valid numerical latitude and longitude."
            );
            return;
        }

        if (latNum < 18.89 || latNum > 19.015 || lngNum < 72.78 || lngNum > 72.87) {
            setErrorMessage(
                language === "mr"
                    ? "स्थान दक्षिण मुंबईच्या मर्यादेत असणे आवश्यक आहे (कुलाबा ते लालबाग)."
                    : "Coordinates must be strictly within South Mumbai bounds (Colaba to Lalbaug)."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionType: "new_mandal",
                    nameEn,
                    nameMr,
                    localityEn,
                    localityMr,
                    bmcWard,
                    latitude: latNum,
                    longitude: lngNum,
                    foundedYear: foundedYear ? parseInt(foundedYear, 10) : undefined,
                    description: description.trim() || undefined,
                    bappa_hp_website: honeypot || undefined,
                    turnstileToken
                })
            });

            if (!res.ok) {
                const problem = await res.json();
                setErrorMessage(problem.detail || "Submission failed. Please check the inputs.");
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
            {/* Invisible honeypot field to trap spambots */}
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
                    data-testid="mandal-form-error"
                    className="rounded-lg bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-300"
                >
                    {errorMessage}
                </div>
            )}

            {/* English & Marathi Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label
                        htmlFor="input-name-en"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                        Mandal Name (English) *
                    </label>
                    <input
                        id="input-name-en"
                        type="text"
                        required
                        data-testid="input-name-en"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="e.g. Girgaoncha Raja"
                        className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-marigold focus:outline-none"
                    />
                </div>
                <div>
                    <label
                        htmlFor="input-name-mr"
                        className="block text-xs font-semibold text-amber-800 dark:text-brand-marigold font-marathi mb-1"
                    >
                        मंडळाचे नाव (मराठी) *
                    </label>
                    <input
                        id="input-name-mr"
                        type="text"
                        required
                        data-testid="input-name-mr"
                        value={nameMr}
                        onChange={(e) => setNameMr(e.target.value)}
                        placeholder="उदा. गिरगावचा राजा"
                        className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 font-marathi focus:border-brand-marigold focus:outline-none"
                    />
                </div>
            </div>

            {/* Localities & BMC Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label
                        htmlFor="input-locality-en"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                        Locality (English) *
                    </label>
                    <input
                        id="input-locality-en"
                        type="text"
                        required
                        data-testid="input-locality-en"
                        value={localityEn}
                        onChange={(e) => setLocalityEn(e.target.value)}
                        placeholder="e.g. Girgaon"
                        className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-marigold focus:outline-none"
                    />
                </div>
                <div>
                    <label
                        htmlFor="input-locality-mr"
                        className="block text-xs font-semibold text-amber-800 dark:text-brand-marigold font-marathi mb-1"
                    >
                        परिसर (मराठी) *
                    </label>
                    <input
                        id="input-locality-mr"
                        type="text"
                        required
                        data-testid="input-locality-mr"
                        value={localityMr}
                        onChange={(e) => setLocalityMr(e.target.value)}
                        placeholder="उदा. गिरगाव"
                        className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 font-marathi focus:border-brand-marigold focus:outline-none"
                    />
                </div>
                <div>
                    <label
                        htmlFor="select-bmc-ward"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                        BMC Ward *
                    </label>
                    <select
                        id="select-bmc-ward"
                        aria-label="BMC Ward"
                        value={bmcWard}
                        data-testid="select-bmc-ward"
                        onChange={(e) => setBmcWard(e.target.value)}
                        className="w-full rounded-lg bg-brand-base border border-brand-border px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:border-brand-marigold focus:outline-none"
                    >
                        {BMC_WARDS.map((w) => (
                            <option key={w.value} value={w.value}>
                                {w.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Coordinates (Latitude & Longitude) */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span>
                        Coordinates (South Mumbai: 18.8900 to 19.0150 N, 72.7800 to 72.8700 E)
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            htmlFor="input-latitude"
                            className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5"
                        >
                            Latitude *
                        </label>
                        <input
                            id="input-latitude"
                            type="number"
                            step="any"
                            required
                            data-testid="input-latitude"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            placeholder="18.9554"
                            className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-marigold focus:outline-none"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="input-longitude"
                            className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5"
                        >
                            Longitude *
                        </label>
                        <input
                            id="input-longitude"
                            type="number"
                            step="any"
                            required
                            data-testid="input-longitude"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            placeholder="72.8213"
                            className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-marigold focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Founded Year & History */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label
                        htmlFor="input-founded-year"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                        Founded Year
                    </label>
                    <input
                        id="input-founded-year"
                        type="number"
                        min="1800"
                        max="2027"
                        data-testid="input-founded-year"
                        value={foundedYear}
                        onChange={(e) => setFoundedYear(e.target.value)}
                        placeholder="e.g. 1950"
                        className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-marigold focus:outline-none"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label
                        htmlFor="input-description"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                        History / Significance
                    </label>
                    <input
                        id="input-description"
                        type="text"
                        data-testid="input-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief background or landmark details..."
                        className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-marigold focus:outline-none"
                    />
                </div>
            </div>

            {/* Turnstile bot check */}
            <TurnstileWidget onVerify={setTurnstileToken} />

            {/* Submit CTA */}
            <div className="pt-2">
                <button
                    type="submit"
                    data-testid="submit-mandal-btn"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-brand-vermillion hover:bg-red-700 disabled:opacity-50 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                >
                    {isSubmitting
                        ? "Submitting for Moderation..."
                        : language === "mr"
                          ? "मंडळ मंजुरीसाठी सादर करा"
                          : "Submit Mandal for Volunteer Review"}
                </button>
            </div>
        </form>
    );
}
