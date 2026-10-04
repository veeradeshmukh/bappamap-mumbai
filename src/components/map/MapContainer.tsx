"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { MandalItem } from "@/types/mandal";
import {
    SOUTH_MUMBAI_BOUNDS,
    MAP_CENTER,
    MIN_ZOOM,
    MAX_ZOOM,
    DEFAULT_ZOOM
} from "@/lib/geo/bounds";
import { getGoogleMapsUrl } from "@/lib/geo/google-maps";
import { BAPPAMAP_STYLE } from "@/lib/map/theme";

interface MapContainerProps {
    mandals: MandalItem[];
    onSelectMandal?: (mandal: MandalItem) => void;
}

export default function MapContainer({ mandals, onSelectMandal }: MapContainerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: BAPPAMAP_STYLE,
            center: MAP_CENTER,
            zoom: DEFAULT_ZOOM,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            maxBounds: SOUTH_MUMBAI_BOUNDS,
            attributionControl: { compact: true }
        });

        // Add standard navigation controls (zoom in/out, bearing pitch reset)
        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Synchronize markers with mandals list
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        mandals.forEach((mandal) => {
            // Accessible custom HTML marker element
            const el = document.createElement("button");
            el.className =
                "bappamap-marker scroll-mt-32 group relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 focus:scale-110 focus:outline-none";
            el.setAttribute("tabindex", "0");
            el.setAttribute(
                "aria-label",
                `${mandal.nameEn} (${mandal.nameMr}), ${mandal.localityEn}, founded in ${mandal.foundedYear}`
            );
            el.setAttribute("data-testid", `mandal-pin-${mandal.slug}`);

            // Custom ceremonial vermillion pin marker SVG
            el.innerHTML = `
                <div class="relative flex items-center justify-center">
                    <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-red-500 opacity-20"></span>
                    <div class="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-surface border-2 border-brand-vermillion shadow-lg shadow-red-950/50 group-focus:ring-2 group-focus:ring-brand-marigold">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-brand-vermillion" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                        </svg>
                    </div>
                </div>
            `;

            const gmapsUrl = getGoogleMapsUrl(mandal.latitude, mandal.longitude);

            // Accessible popup
            const popup = new maplibregl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false
            }).setHTML(`
                <div data-testid="mandal-popup" class="space-y-2">
                    <div class="border-b border-brand-border pb-1.5">
                        <h3 class="font-bold text-base text-brand-vermillion font-sans">${mandal.nameEn}</h3>
                        <p class="text-sm font-marathi text-brand-marigold font-medium">${mandal.nameMr}</p>
                    </div>
                    <div class="text-xs text-slate-300 space-y-1">
                        <p><span class="text-slate-400">Locality:</span> ${mandal.localityEn} (${mandal.localityMr})</p>
                        <p><span class="text-slate-400">Founded:</span> ${mandal.foundedYear} • <span class="text-slate-400">BMC Ward:</span> ${mandal.bmcWard}</p>
                    </div>
                    <div class="pt-2">
                        <a 
                            data-testid="google-maps-btn"
                            href="${gmapsUrl}" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-vermillion hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors focus:ring-2 focus:ring-brand-marigold focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            Open in Google Maps
                        </a>
                    </div>
                </div>
            `);

            popup.on("open", () => {
                onSelectMandal?.(mandal);
            });

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([mandal.longitude, mandal.latitude])
                .setPopup(popup)
                .addTo(map);

            // Unified click and touch activation
            el.addEventListener("click", (e) => {
                e.stopPropagation();
                marker.togglePopup();
            });

            // Accessible keyboard navigation (Enter / Space)
            el.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    marker.togglePopup();
                }
            });

            markersRef.current.push(marker);
        });
    }, [mandals, onSelectMandal]);

    return (
        <div className="relative w-full h-full min-h-[500px]">
            <div
                ref={mapContainerRef}
                data-testid="maplibre-container"
                className="w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-2xl border border-brand-border"
            />
            {/* Viewport Boundary Notice */}
            <div className="absolute bottom-2 left-2 z-10 rounded bg-brand-surface/90 px-2.5 py-1 text-[11px] text-slate-400 backdrop-blur-sm border border-brand-border">
                South Mumbai Restricted Viewport • Colaba to Lalbaug
            </div>
        </div>
    );
}
