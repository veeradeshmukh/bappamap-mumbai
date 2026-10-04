import type { StyleSpecification } from "maplibre-gl";

/**
 * Custom Dark Basalt Style Specification for MapLibre GL JS
 * Rooted in South Mumbai's basalt architecture and Arabian Sea night tones.
 */
export const BAPPAMAP_STYLE: StyleSpecification = {
    version: 8,
    name: "BappaMap Basalt Dark",
    sources: {
        openfreemap: {
            type: "vector",
            url: "https://tiles.openfreemap.org/planet"
        }
    },
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    layers: [
        {
            id: "background",
            type: "background",
            paint: {
                "background-color": "#070A10" // Arabian Sea & waterbodies
            }
        },
        {
            id: "land",
            type: "fill",
            source: "openfreemap",
            "source-layer": "landcover",
            paint: {
                "fill-color": "#0F141D", // Basalt landmass
                "fill-opacity": 0.95
            }
        },
        {
            id: "water",
            type: "fill",
            source: "openfreemap",
            "source-layer": "water",
            paint: {
                "fill-color": "#070A10",
                "fill-opacity": 1.0
            }
        },
        {
            id: "roads-subtle",
            type: "line",
            source: "openfreemap",
            "source-layer": "transportation",
            filter: ["all", ["!=", "class", "motorway"], ["!=", "class", "primary"]],
            paint: {
                "line-color": "#1A2230", // Gallis and local alleyways
                "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.5, 16, 1.5]
            }
        },
        {
            id: "roads-primary",
            type: "line",
            source: "openfreemap",
            "source-layer": "transportation",
            filter: ["any", ["==", "class", "motorway"], ["==", "class", "primary"]],
            paint: {
                "line-color": "#263346", // Arterials & flyovers
                "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.2, 16, 3.0]
            }
        },
        {
            id: "place-labels",
            type: "symbol",
            source: "openfreemap",
            "source-layer": "place",
            layout: {
                "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
                "text-font": ["Noto Sans Regular"],
                "text-size": 11,
                "text-letter-spacing": 0.05
            },
            paint: {
                "text-color": "#64748B",
                "text-halo-color": "#0F141D",
                "text-halo-width": 1.5
            }
        }
    ]
};
