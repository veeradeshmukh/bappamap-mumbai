"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuarantineSubmission, ModerationStatus } from "@/lib/submissions/quarantine-store";

export default function AdminDashboardPage() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<QuarantineSubmission[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        flagged: 0
    });
    const [activeFilter, setActiveFilter] = useState<"all" | ModerationStatus>("pending");
    const [isLoading, setIsLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [reviewerNotesMap, setReviewerNotesMap] = useState<Record<string, string>>({});

    const fetchQueue = useCallback(
        async (status: "all" | ModerationStatus) => {
            setIsLoading(true);
            try {
                const query = status === "all" ? "" : `?status=${status}`;
                const res = await fetch(`/api/admin/moderation/queue${query}`);

                if (res.status === 401) {
                    router.push("/admin/login");
                    return;
                }

                if (!res.ok) {
                    setIsLoading(false);
                    return;
                }

                const data = await res.json();
                setSubmissions(data.submissions || []);
                setStats(
                    data.stats || { total: 0, pending: 0, approved: 0, rejected: 0, flagged: 0 }
                );
            } catch {
                // Network error handled gracefully
            } finally {
                setIsLoading(false);
            }
        },
        [router]
    );

    useEffect(() => {
        fetchQueue(activeFilter);
    }, [activeFilter, fetchQueue]);

    const handleAction = async (id: string, action: "approve" | "reject" | "flag") => {
        setActionInProgress(id);
        const notes = reviewerNotesMap[id] || "";

        try {
            const res = await fetch(`/api/admin/moderation/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, reviewerNotes: notes })
            });

            if (res.status === 401) {
                router.push("/admin/login");
                return;
            }

            if (res.ok) {
                // Refresh queue to update status and counters
                await fetchQueue(activeFilter);
            }
        } finally {
            setActionInProgress(null);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/admin/auth/logout", { method: "POST" });
        } finally {
            router.push("/admin/login");
        }
    };

    const getStatusBadge = (status: ModerationStatus) => {
        switch (status) {
            case "approved":
                return (
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-semibold">
                        Approved
                    </span>
                );
            case "rejected":
                return (
                    <span className="rounded-full bg-red-500/20 text-red-300 border border-red-500/40 px-2.5 py-0.5 text-[11px] font-semibold">
                        Rejected
                    </span>
                );
            case "flagged":
                return (
                    <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 text-[11px] font-semibold">
                        Flagged
                    </span>
                );
            default:
                return (
                    <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-semibold">
                        Pending Review
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-brand-base text-slate-100 selection:bg-brand-vermillion selection:text-white">
            {/* Header */}
            <header className="sticky top-0 z-30 w-full border-b border-brand-border bg-brand-base/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-vermillion shadow-lg shadow-red-900/40">
                            <span className="text-lg font-bold text-white font-marathi">श्री</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-bold text-white tracking-tight sm:text-lg">
                                    BappaMap Moderation
                                </h1>
                                <span className="rounded-full bg-brand-vermillion/25 px-2 py-0.5 text-[10px] font-semibold text-amber-200 border border-brand-vermillion/40">
                                    Admin Portal
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Pre-moderation quarantine and community content review
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-block text-xs text-slate-400">
                            admin@bappamap.in
                        </span>
                        <button
                            type="button"
                            data-testid="admin-logout-btn"
                            onClick={handleLogout}
                            className="rounded-lg border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Stats & Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-4">
                    <div
                        role="tablist"
                        aria-label="Filter submissions by moderation status"
                        className="flex flex-wrap items-center gap-2"
                    >
                        {(
                            [
                                { key: "pending", label: "Pending", count: stats.pending },
                                { key: "approved", label: "Approved", count: stats.approved },
                                { key: "rejected", label: "Rejected", count: stats.rejected },
                                { key: "flagged", label: "Flagged", count: stats.flagged },
                                { key: "all", label: "All Submissions", count: stats.total }
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={activeFilter === tab.key}
                                data-testid={`filter-tab-${tab.key}`}
                                onClick={() => setActiveFilter(tab.key)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    activeFilter === tab.key
                                        ? "bg-brand-vermillion text-white shadow-sm"
                                        : "bg-brand-surface border border-brand-border text-slate-400 hover:text-white"
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className="rounded-full bg-black/30 px-1.5 py-0.2 text-[10px]">
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchQueue(activeFilter)}
                        className="text-xs text-brand-marigold hover:underline flex items-center gap-1"
                    >
                        ↻ Refresh Queue
                    </button>
                </div>

                {/* Submissions List */}
                {isLoading ? (
                    <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
                        Loading moderation queue...
                    </div>
                ) : submissions.length === 0 ? (
                    <div
                        data-testid="admin-empty-state"
                        className="rounded-2xl border border-brand-border bg-brand-surface p-12 text-center"
                    >
                        <p className="text-sm font-semibold text-slate-300">
                            No submissions in this queue.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            All user-contributed mandals, reviews, and photos have been processed.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {submissions.map((sub) => (
                            <div
                                key={sub.id}
                                data-testid={`submission-card-${sub.id}`}
                                className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-lg space-y-4"
                            >
                                {/* Card Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(sub.status)}
                                        <span className="rounded-md bg-brand-base px-2 py-0.5 text-[11px] font-mono font-semibold text-brand-marigold">
                                            {sub.submissionType.toUpperCase()}
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-400">
                                            {sub.id}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        {new Date(sub.createdAt).toLocaleString("en-IN")}
                                    </span>
                                </div>

                                {/* Content Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    {/* Left: Payload parameters */}
                                    <div className="space-y-2">
                                        {sub.submissionType === "new_mandal" && (
                                            <>
                                                <div>
                                                    <span className="text-slate-400">
                                                        Mandal Name:{" "}
                                                    </span>
                                                    <span className="font-semibold text-white">
                                                        {String(sub.payload.nameEn)}
                                                    </span>{" "}
                                                    <span className="text-brand-marigold font-marathi">
                                                        ({String(sub.payload.nameMr)})
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">
                                                        Locality & Ward:{" "}
                                                    </span>
                                                    <span className="text-white">
                                                        {String(sub.payload.localityEn)} (Ward{" "}
                                                        {String(sub.payload.bmcWard)})
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">
                                                        Coordinates:{" "}
                                                    </span>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${sub.payload.latitude}%2C${sub.payload.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-brand-marigold hover:underline font-mono"
                                                    >
                                                        {String(sub.payload.latitude)},{" "}
                                                        {String(sub.payload.longitude)} ↗
                                                    </a>
                                                </div>
                                                {sub.payload.foundedYear && (
                                                    <div>
                                                        <span className="text-slate-400">
                                                            Founded:{" "}
                                                        </span>
                                                        <span className="text-white">
                                                            {String(sub.payload.foundedYear)}
                                                        </span>
                                                    </div>
                                                )}
                                                {sub.payload.description && (
                                                    <div>
                                                        <span className="text-slate-400">
                                                            Description:{" "}
                                                        </span>
                                                        <span className="text-slate-200">
                                                            {String(sub.payload.description)}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {sub.submissionType === "review" && (
                                            <>
                                                <div>
                                                    <span className="text-slate-400">
                                                        Target Mandal:{" "}
                                                    </span>
                                                    <span className="font-semibold text-white">
                                                        {String(sub.payload.mandalSlug)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">Author: </span>
                                                    <span className="text-white">
                                                        {String(sub.payload.authorName)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">Rating: </span>
                                                    <span className="font-bold text-amber-400">
                                                        ★ {String(sub.payload.rating)} / 5
                                                    </span>
                                                </div>
                                                {sub.payload.crowdObservation && (
                                                    <div>
                                                        <span className="text-slate-400">
                                                            Crowd Observation:{" "}
                                                        </span>
                                                        <span className="rounded bg-brand-base px-1.5 py-0.5 text-brand-marigold font-semibold">
                                                            {String(sub.payload.crowdObservation)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="text-slate-400">Review: </span>
                                                    <p className="mt-1 rounded-lg bg-brand-base p-2.5 text-slate-200 italic">
                                                        &ldquo;{String(sub.payload.comment)}&rdquo;
                                                    </p>
                                                </div>
                                            </>
                                        )}

                                        {sub.submissionType === "photo" && (
                                            <>
                                                <div>
                                                    <span className="text-slate-400">
                                                        Target Mandal:{" "}
                                                    </span>
                                                    <span className="font-semibold text-white">
                                                        {String(sub.payload.mandalSlug)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">
                                                        Contributor:{" "}
                                                    </span>
                                                    <span className="text-white">
                                                        {String(sub.payload.contributorName)}
                                                    </span>
                                                </div>
                                                {sub.payload.caption && (
                                                    <div>
                                                        <span className="text-slate-400">
                                                            Caption:{" "}
                                                        </span>
                                                        <span className="text-slate-200">
                                                            {String(sub.payload.caption)}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Right: Photo Preview (if applicable) & Audit Notes */}
                                    <div className="space-y-3">
                                        {sub.photoDataUrl && (
                                            <div>
                                                <span className="text-slate-400 block mb-1">
                                                    Sanitized Photo Preview:
                                                </span>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={sub.photoDataUrl}
                                                    alt="Quarantined preview"
                                                    data-testid={`admin-photo-preview-${sub.id}`}
                                                    className="h-28 rounded-lg object-cover border border-brand-border"
                                                />
                                            </div>
                                        )}

                                        {sub.reviewedAt && (
                                            <div className="rounded-lg bg-brand-base/80 p-2.5 text-[11px] text-slate-400">
                                                <p>
                                                    Reviewed by:{" "}
                                                    <span className="text-white font-semibold">
                                                        {sub.reviewedBy}
                                                    </span>
                                                </p>
                                                {sub.reviewerNotes && (
                                                    <p className="mt-0.5">
                                                        Notes: {sub.reviewerNotes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reviewer Actions */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border pt-3">
                                    <div className="flex-1 max-w-md">
                                        <input
                                            type="text"
                                            data-testid={`reviewer-notes-input-${sub.id}`}
                                            value={reviewerNotesMap[sub.id] || ""}
                                            onChange={(e) =>
                                                setReviewerNotesMap((prev) => ({
                                                    ...prev,
                                                    [sub.id]: e.target.value
                                                }))
                                            }
                                            placeholder="Optional moderation notes..."
                                            className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-marigold focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={actionInProgress === sub.id}
                                            data-testid={`approve-btn-${sub.id}`}
                                            onClick={() => handleAction(sub.id, "approve")}
                                            className="rounded-lg bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionInProgress === sub.id}
                                            data-testid={`reject-btn-${sub.id}`}
                                            onClick={() => handleAction(sub.id, "reject")}
                                            className="rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionInProgress === sub.id}
                                            data-testid={`flag-btn-${sub.id}`}
                                            onClick={() => handleAction(sub.id, "flag")}
                                            className="rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                                        >
                                            Flag
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
