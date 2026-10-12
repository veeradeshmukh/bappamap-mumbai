import React, { Suspense } from "react";
import MandalExplorer from "@/components/directory/MandalExplorer";
import { getSeedMandals } from "@/lib/data/mandals";
import { MandalItem } from "@/types/mandal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
    let mandals: MandalItem[] = [];

    try {
        const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${backendUrl}/api/mandals`, {
            cache: "no-store",
            next: { revalidate: 0 }
        });
        if (res.ok) {
            mandals = await res.json();
        } else {
            console.error(`FastAPI backend returned HTTP ${res.status}, falling back to seed mandals.`);
            mandals = getSeedMandals();
        }
    } catch {
        // Backend offline or unreachable at build/render time
        mandals = getSeedMandals();
    }

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
