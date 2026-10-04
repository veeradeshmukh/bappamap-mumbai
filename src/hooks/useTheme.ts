"use client";

import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "bappamap_theme";

export interface UseThemeReturn {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export function useTheme(): UseThemeReturn {
    const [theme, setThemeState] = useState<Theme>("dark");

    // Initialize theme based on saved preference or system default
    useEffect(() => {
        if (typeof window === "undefined") return;

        const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        if (saved === "light" || saved === "dark") {
            setThemeState(saved);
            applyThemeClass(saved);
            return;
        }

        // Read OS system default
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: Theme = systemPrefersDark ? "dark" : "light";
        setThemeState(initialTheme);
        applyThemeClass(initialTheme);

        // Listen for OS system theme changes if no explicit user override exists
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemChange = (e: MediaQueryListEvent) => {
            const hasExplicitOverride = Boolean(localStorage.getItem(THEME_STORAGE_KEY));
            if (!hasExplicitOverride) {
                const next: Theme = e.matches ? "dark" : "light";
                setThemeState(next);
                applyThemeClass(next);
            }
        };

        mediaQuery.addEventListener("change", handleSystemChange);
        return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }, []);

    const applyThemeClass = (targetTheme: Theme) => {
        const root = document.documentElement;
        if (targetTheme === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
        } else {
            root.classList.remove("dark");
            root.classList.add("light");
        }
    };

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        applyThemeClass(newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark");
    }, [theme, setTheme]);

    return {
        theme,
        toggleTheme,
        setTheme
    };
}
