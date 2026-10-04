"use client";

import React, { useMemo } from "react";

interface PetalSpec {
    id: number;
    left: number; // percentage (0 - 100)
    delay: number; // seconds
    duration: number; // seconds
    scale: number; // size multiplier
    swayDuration: number; // seconds
    rotateDuration: number; // seconds
    opacity: number;
    color: string;
}

/**
 * Festive Background Ambiance
 * Renders subtle floating marigold petals and soft warm ambient diya glow.
 * Optimized for performance: pure CSS keyframes, zero JS runtime loop, GPU accelerated,
 * with strict reduced-motion overrides.
 */
export default function FestiveBackground() {
    // Generate deterministic petal configurations to prevent SSR hydration mismatches
    const petals: PetalSpec[] = useMemo(() => {
        const colors = [
            "#F59E0B", // Golden marigold
            "#D97706", // Deep amber
            "#EF4444", // Vermillion touch
            "#FBBF24", // Warm saffron
            "#F5A623" // Bright marigold
        ];

        const list: PetalSpec[] = [];
        const count = 18; // Tasteful number: rich ambiance without visual clutter

        for (let i = 0; i < count; i++) {
            // Seeded deterministic pseudorandom values based on index
            const pseudoRand = (seed: number) => {
                const x = Math.sin(seed + i * 37) * 10000;
                return x - Math.floor(x);
            };

            const left = 3 + (i * 94) / count + (pseudoRand(1) * 6 - 3);
            const delay = pseudoRand(2) * 12; // Staggered entry
            const duration = 12 + pseudoRand(3) * 10; // 12s - 22s slow graceful fall
            const scale = 0.6 + pseudoRand(4) * 0.7; // 0.6 - 1.3
            const swayDuration = 3.5 + pseudoRand(5) * 3; // 3.5s - 6.5s side-to-side sway
            const rotateDuration = 6 + pseudoRand(6) * 6; // 6s - 12s gentle spin
            const opacity = 0.18 + pseudoRand(7) * 0.22; // 0.18 - 0.40 subtle opacity
            const color = colors[i % colors.length];

            list.push({
                id: i,
                left: Math.max(2, Math.min(98, left)),
                delay,
                duration,
                scale,
                swayDuration,
                rotateDuration,
                opacity,
                color
            });
        }

        return list;
    }, []);

    return (
        <div
            aria-hidden="true"
            className="festive-background fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
        >
            {/* Top warm festive ambient diya / mandap radial glows */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/10 via-brand-vermillion/5 to-transparent blur-3xl" />
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-bl from-amber-400/10 via-yellow-600/5 to-transparent blur-3xl" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-radial from-amber-500/5 via-brand-vermillion/2 to-transparent blur-3xl" />

            {/* Drifting Marigold Petals */}
            <div className="absolute inset-0 overflow-hidden">
                {petals.map((petal) => (
                    <div
                        key={petal.id}
                        className="festive-petal-fall absolute"
                        style={{
                            left: `${petal.left}%`,
                            top: "-40px",
                            animationDuration: `${petal.duration}s`,
                            animationDelay: `-${petal.delay}s`,
                            willChange: "transform"
                        }}
                    >
                        <div
                            className="festive-petal-sway"
                            style={{
                                animationDuration: `${petal.swayDuration}s`,
                                animationDelay: `-${petal.delay * 0.7}s`
                            }}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width={20 * petal.scale}
                                height={24 * petal.scale}
                                style={{
                                    opacity: petal.opacity,
                                    animation: `festivePetalSpin ${petal.rotateDuration}s ease-in-out infinite alternate`,
                                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                                }}
                                fill="none"
                            >
                                {/* Organic Marigold Petal Curve */}
                                <path
                                    d="M12 2C8 6 4 12 5 17C6 21 10 23 12 23C14 23 18 21 19 17C20 12 16 6 12 2Z"
                                    fill={petal.color}
                                />
                                {/* Center Petal Vein Accent */}
                                <path
                                    d="M12 4C11.5 8 11.5 16 12 21"
                                    stroke="rgba(255, 255, 255, 0.4)"
                                    strokeWidth="0.8"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
