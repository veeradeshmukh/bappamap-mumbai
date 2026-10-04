"use client";

import React from "react";
import { Theme } from "@/hooks/useTheme";
import { Language } from "@/lib/i18n/translations";

interface ThemeToggleProps {
    theme: Theme;
    onToggle: () => void;
    language?: Language;
}

export default function ThemeToggle({ theme, onToggle, language = "en" }: ThemeToggleProps) {
    const isDark = theme === "dark";
    const label =
        language === "mr"
            ? isDark
                ? "लाईट मोड सुरू करा"
                : "डार्क मोड सुरू करा"
            : isDark
              ? "Switch to light mode"
              : "Switch to dark mode";

    return (
        <button
            type="button"
            data-testid="theme-toggle-btn"
            onClick={onToggle}
            aria-label={label}
            title={label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border bg-brand-surface p-1.5 text-slate-300 hover:text-brand-marigold hover:border-brand-marigold transition-all focus:outline-none focus:ring-2 focus:ring-brand-marigold cursor-pointer"
        >
            {isDark ? (
                // Sun Icon (for switching to light)
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-amber-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                </svg>
            ) : (
                // Moon Icon (for switching to dark)
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-slate-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
            )}
        </button>
    );
}
