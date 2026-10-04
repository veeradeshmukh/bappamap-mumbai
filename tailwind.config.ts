import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    base: "rgb(var(--brand-base) / <alpha-value>)",
                    surface: "rgb(var(--brand-surface) / <alpha-value>)",
                    elevated: "rgb(var(--brand-elevated) / <alpha-value>)",
                    border: "rgb(var(--brand-border) / <alpha-value>)",
                    subtle: "rgb(var(--brand-subtle) / <alpha-value>)",
                    vermillion: "#D4301B",
                    "vermillion-glow": "rgba(212, 48, 27, 0.35)",
                    marigold: "#F5A623",
                    "marigold-subtle": "rgba(245, 166, 35, 0.15)"
                },
                crowd: {
                    low: "#10B981",
                    moderate: "#F59E0B",
                    heavy: "#F97316",
                    critical: "#EF4444"
                }
            },
            fontFamily: {
                sans: ["var(--font-sans)", "Plus Jakarta Sans", "Mukta", "sans-serif"],
                marathi: ["var(--font-marathi)", "Tiro Devanagari Marathi", "Mukta", "serif"]
            }
        }
    },
    plugins: []
};

export default config;
