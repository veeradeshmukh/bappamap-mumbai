import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    base: "#0B0F17",
                    surface: "#141A24",
                    elevated: "#1D2636",
                    border: "#2A364B",
                    subtle: "#1C2433",
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
