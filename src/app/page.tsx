import React from "react";
import MapContainer from "@/components/map/MapContainer";
import { getSeedMandals } from "@/lib/data/mandals";

export default function HomePage() {
    const mandals = getSeedMandals();

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-brand-base">
            {/* Header */}
            <header className="shrink-0 w-full border-b border-brand-border bg-brand-base">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-vermillion shadow-lg shadow-red-900/40">
                            <span className="text-lg font-bold text-white font-marathi">श्री</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                                    BappaMap{" "}
                                    <span className="text-brand-vermillion font-medium">
                                        Mumbai
                                    </span>
                                </h1>
                                <span className="rounded-full bg-brand-vermillion/20 px-2 py-0.5 text-[10px] font-semibold text-brand-vermillion border border-brand-vermillion/30">
                                    SoBo Edition
                                </span>
                            </div>
                            <p className="text-[11px] text-brand-marigold font-marathi">
                                दक्षिण मुंबई गणेशोत्सव दर्शन नकाशा (कुलाबा ते लालबाग)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1.5 text-xs font-medium text-slate-200 shadow-sm hover:border-brand-marigold/60 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                            12 Mandals
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-vermillion px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-950/50 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-marigold"
                        >
                            + Add / Review Mandal
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Interactive Map Stage */}
            <main className="flex-1 w-full p-2 sm:p-3 overflow-hidden flex flex-col">
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col h-full">
                    <MapContainer mandals={mandals} />
                </div>
            </main>

            {/* Footer & Privacy Assurance */}
            <footer className="border-t border-brand-border bg-brand-surface/60 py-4 px-4 text-center text-xs text-slate-400">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>© 2027 BappaMap Mumbai • Community Directory & Cultural Navigation Aid</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Zero Geolocation Policy
                        </span>
                        <span>•</span>
                        <span>Map data © OpenStreetMap contributors via OpenFreeMap</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
