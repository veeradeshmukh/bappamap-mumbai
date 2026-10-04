"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("admin@bappamap.in");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const data = await res.json();
                setErrorMessage(data.error || "Invalid admin credentials.");
                setIsSubmitting(false);
                return;
            }

            router.push("/admin");
        } catch {
            setErrorMessage("Network error occurred during sign-in.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-brand-base px-4 text-slate-100">
            <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface p-6 sm:p-8 shadow-2xl">
                {/* Brand Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-vermillion shadow-lg shadow-red-950/50 mb-3">
                        <span className="text-xl font-bold text-white font-marathi">श्री</span>
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        BappaMap Moderation Portal
                    </h1>
                    <p className="text-xs text-brand-marigold font-marathi mt-1">
                        प्रशासक प्रवेश • दक्षिण मुंबई गणेशोत्सव
                    </p>
                </div>

                {errorMessage && (
                    <div
                        data-testid="login-error-alert"
                        role="alert"
                        className="mb-4 rounded-lg bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-300"
                    >
                        {errorMessage}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} data-testid="admin-login-form" className="space-y-4">
                    <div>
                        <label
                            htmlFor="admin-email"
                            className="block text-xs font-semibold text-slate-300 mb-1"
                        >
                            Admin Email
                        </label>
                        <input
                            id="admin-email"
                            type="email"
                            required
                            data-testid="input-admin-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@bappamap.in"
                            className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-marigold focus:outline-none"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="admin-password"
                            className="block text-xs font-semibold text-slate-300 mb-1"
                        >
                            Passkey / Admin Password
                        </label>
                        <input
                            id="admin-password"
                            type="password"
                            required
                            data-testid="input-admin-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full rounded-lg bg-brand-base border border-brand-border px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-marigold focus:outline-none"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            data-testid="admin-login-submit"
                            disabled={isSubmitting}
                            className="w-full rounded-lg bg-brand-vermillion hover:bg-red-700 disabled:opacity-50 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                        >
                            {isSubmitting ? "Authenticating..." : "Sign In to Moderation Portal"}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center text-[11px] text-slate-400">
                    <span>Protected by BappaMap Admin Security Boundary</span>
                </div>
            </div>
        </div>
    );
}
