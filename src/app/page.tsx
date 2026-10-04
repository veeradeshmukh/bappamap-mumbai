import React, { Suspense } from "react";
import MandalExplorer from "@/components/directory/MandalExplorer";
import { getSeedMandals } from "@/lib/data/mandals";

export default function HomePage() {
    const mandals = getSeedMandals();

    return (
        <Suspense
            fallback={
                <div className="flex h-screen w-full items-center justify-center bg-brand-base text-brand-marigold">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-vermillion border-t-transparent" />
                        <span className="text-sm font-marathi">
                            बाप्पा मॅप मुंबई लोड होत आहे...
                        </span>
                    </div>
                </div>
            }
        >
            <MandalExplorer initialMandals={mandals} />
        </Suspense>
    );
}
