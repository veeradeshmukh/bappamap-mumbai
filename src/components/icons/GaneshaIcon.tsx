import React from "react";

interface GaneshaIconProps {
    className?: string;
    size?: number;
}

/**
 * Regal Ganesha Head Vector Icon
 * Handcrafted SVG depicting Lord Ganesha's head, mukut (crown),
 * ceremonial tilak, ears, and curved trunk with festive gold and vermillion accents.
 */
export default function GaneshaIcon({ className = "w-9 h-9", size = 36 }: GaneshaIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            width={size}
            height={size}
            className={className}
            fill="none"
            aria-hidden="true"
        >
            {/* Soft radiant aura background */}
            <circle cx="32" cy="32" r="30" fill="url(#ganesha-aura-gradient)" />
            <circle
                cx="32"
                cy="32"
                r="29"
                stroke="url(#ganesha-gold-stroke)"
                strokeWidth="1.5"
                strokeDasharray="2 1"
            />

            {/* Mukut / Crown */}
            <path
                d="M24 22L32 8L40 22L36 24L32 19L28 24Z"
                fill="url(#ganesha-gold-fill)"
                stroke="#B45309"
                strokeWidth="0.8"
            />
            {/* Crown Jewel */}
            <circle cx="32" cy="14" r="1.5" fill="#D4301B" />
            <circle cx="32" cy="8" r="1.8" fill="#F5A623" />

            {/* Left Ear */}
            <path
                d="M24 25C18 24 14 27 13 33C12 38 16 43 23 41"
                fill="#FFFBEB"
                stroke="#D97706"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M21 28C17 29 16 33 17 37"
                stroke="#F59E0B"
                strokeWidth="1"
                strokeLinecap="round"
            />

            {/* Right Ear */}
            <path
                d="M40 25C46 24 50 27 51 33C52 38 48 43 41 41"
                fill="#FFFBEB"
                stroke="#D97706"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M43 28C47 29 48 33 47 37"
                stroke="#F59E0B"
                strokeWidth="1"
                strokeLinecap="round"
            />

            {/* Forehead & Face Outline */}
            <path
                d="M23 25C23 22 41 22 41 25C43 31 43 38 41 43C40 45 37 46 35 46C33 46 32 48 32 50C32 53 35 55 38 55C41 55 43 53.5 44 51.5"
                stroke="#B45309"
                strokeWidth="2"
                strokeLinecap="round"
                fill="#FEF3C7"
            />

            {/* Right Broken Tusk */}
            <path d="M38 42L42 42.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

            {/* Left Full Tusk */}
            <path d="M26 42L21 44" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />

            {/* Trunk line detail extending gracefully */}
            <path
                d="M28 29C28 35 29 41 31 45C33 49 33 52 35 52C36.5 52 37 50.8 37 49"
                stroke="#D97706"
                strokeWidth="1.2"
                strokeLinecap="round"
            />

            {/* Modak on trunk tip */}
            <circle cx="43" cy="51" r="2.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />

            {/* Ceremonial Tilak & Trishul Mark on Forehead */}
            {/* Red Chandan U-shape */}
            <path
                d="M30 22C30 26 34 26 34 22"
                stroke="#D4301B"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
            />
            {/* Center Vermillion vertical line */}
            <line
                x1="32"
                y1="20"
                x2="32"
                y2="27"
                stroke="#D4301B"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            {/* Golden Bindi at center */}
            <circle cx="32" cy="27.5" r="1" fill="#F5A623" />

            {/* Eyes */}
            <path
                d="M26 29C27 28.5 28.5 29 29 30"
                stroke="#78350F"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
            <path
                d="M38 29C37 28.5 35.5 29 35 30"
                stroke="#78350F"
                strokeWidth="1.2"
                strokeLinecap="round"
            />

            {/* Gradients */}
            <defs>
                <radialGradient id="ganesha-aura-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#450A0A" stopOpacity="0.95" />
                </radialGradient>
                <linearGradient
                    id="ganesha-gold-fill"
                    x1="24"
                    y1="8"
                    x2="40"
                    y2="24"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient
                    id="ganesha-gold-stroke"
                    x1="0"
                    y1="0"
                    x2="64"
                    y2="64"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
            </defs>
        </svg>
    );
}
