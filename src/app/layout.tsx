import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Mukta } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap"
});

const mukta = Mukta({
    subsets: ["devanagari", "latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-marathi",
    display: "swap"
});

export const metadata: Metadata = {
    title: "BappaMap Mumbai — South Mumbai Ganpati Mandal Map",
    description:
        "Interactive festival navigation guide for iconic Ganpati mandals in South Mumbai (Colaba to Lalbaug/Parel). Bounded, offline-friendly, and privacy-first."
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`dark ${plusJakartaSans.variable} ${mukta.variable}`}>
            <body className="min-h-screen bg-brand-base text-slate-100 antialiased selection:bg-brand-vermillion selection:text-white">
                {children}
            </body>
        </html>
    );
}
