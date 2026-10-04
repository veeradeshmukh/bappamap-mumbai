import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "@/hooks/useTheme";

describe("useTheme Hook", () => {
    const originalLocalStorage = global.localStorage;

    beforeEach(() => {
        let store: Record<string, string> = {};
        const localStorageMock = {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value.toString();
            }),
            clear: vi.fn(() => {
                store = {};
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            length: 0,
            key: vi.fn(() => null)
        };
        Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
            writable: true
        });

        // Mock matchMedia
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: vi.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }))
        });

        document.documentElement.classList.remove("light", "dark");
    });

    afterEach(() => {
        Object.defineProperty(window, "localStorage", {
            value: originalLocalStorage,
            writable: true
        });
    });

    it("initializes with saved theme from localStorage if present", () => {
        window.localStorage.setItem("bappamap_theme", "light");

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe("light");
        expect(document.documentElement.classList.contains("light")).toBe(true);
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("initializes with system preference when localStorage is empty", () => {
        // Mock dark mode preference
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === "(prefers-color-scheme: dark)",
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }));

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("toggles theme between dark and light correctly", () => {
        window.localStorage.setItem("bappamap_theme", "dark");
        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe("dark");

        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.theme).toBe("light");
        expect(window.localStorage.getItem("bappamap_theme")).toBe("light");
        expect(document.documentElement.classList.contains("light")).toBe(true);
        expect(document.documentElement.classList.contains("dark")).toBe(false);

        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.theme).toBe("dark");
        expect(window.localStorage.getItem("bappamap_theme")).toBe("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(document.documentElement.classList.contains("light")).toBe(false);
    });
});
