import { MandalItem } from "@/types/mandal";

export type Language = "en" | "mr";

export interface TranslationDictionary {
    [key: string]: {
        en: string;
        mr: string;
    };
}

export const TRANSLATIONS: TranslationDictionary = {
    // Navigation and Branding
    "app.title": {
        en: "BappaMap Mumbai",
        mr: "बाप्पा मॅप मुंबई"
    },
    "app.subtitle": {
        en: "South Mumbai Ganeshotsav Darshan Map (Colaba to Lalbaug)",
        mr: "दक्षिण मुंबई गणेशोत्सव दर्शन नकाशा (कुलाबा ते लालबाग)"
    },
    "app.tagline": {
        en: "SoBo Edition",
        mr: "दक्षिण मुंबई विशेष"
    },
    "nav.mandalsCount": {
        en: "Mandals",
        mr: "मंडळे"
    },
    "nav.addReview": {
        en: "+ Add / Review Mandal",
        mr: "+ मंडळ जोडा / पुनरावलोकन"
    },

    // Filter Bar
    "filters.searchPlaceholder": {
        en: "Search mandal, locality, or ward...",
        mr: "मंडळ, परिसर किंवा प्रभाग शोधा..."
    },
    "filters.clearSearch": {
        en: "Clear search",
        mr: "शोध पुसा"
    },
    "filters.crowdTitle": {
        en: "Crowd Level",
        mr: "गर्दी पातळी"
    },
    "filters.parkingNearby": {
        en: "Parking Nearby",
        mr: "जवळपास पार्किंग"
    },
    "filters.minRating": {
        en: "Min Rating",
        mr: "किमान रेटिंग"
    },
    "filters.allRatings": {
        en: "All Ratings",
        mr: "सर्व रेटिंग"
    },
    "filters.resetAll": {
        en: "Reset Filters",
        mr: "फिल्टर रीसेट करा"
    },
    "filters.showingResults": {
        en: "Showing {count} of {total} mandals",
        mr: "{total} पैकी {count} मंडळे दाखवत आहे"
    },
    "filters.noResults": {
        en: "No mandals found matching your filters.",
        mr: "तुमच्या फिल्टरनुसार एकही मंडळ आढळले नाही."
    },
    "filters.resetPrompt": {
        en: "Clear filters to see all mandals",
        mr: "सर्व मंडळे पाहण्यासाठी फिल्टर साफ करा"
    },

    // Crowd Levels
    "crowd.low": {
        en: "Low Crowd",
        mr: "कमी गर्दी"
    },
    "crowd.moderate": {
        en: "Moderate",
        mr: "मध्यम गर्दी"
    },
    "crowd.heavy": {
        en: "Heavy",
        mr: "जास्त गर्दी"
    },
    "crowd.very_heavy": {
        en: "Very Heavy",
        mr: "अति गर्दी"
    },

    // Mandal Card & Popup
    "card.founded": {
        en: "Founded",
        mr: "स्थापना"
    },
    "card.ward": {
        en: "BMC Ward",
        mr: "महापालिका प्रभाग"
    },
    "card.locality": {
        en: "Locality",
        mr: "परिसर"
    },
    "card.showOnMap": {
        en: "Show on Map",
        mr: "नकाशावर पहा"
    },
    "card.directions": {
        en: "Directions",
        mr: "दिशादर्शन"
    },
    "card.parkingAvailable": {
        en: "Parking nearby",
        mr: "पार्किंग उपलब्ध"
    },
    "card.noParking": {
        en: "No dedicated parking",
        mr: "पार्किंग उपलब्ध नाही"
    },
    "card.reviews": {
        en: "reviews",
        mr: "पुनरावलोकने"
    },
    "card.nearestStation": {
        en: "Nearest Station",
        mr: "जवळचे रेल्वे स्थानक"
    },

    // Theme Switcher
    "theme.toggle": {
        en: "Toggle color theme",
        mr: "थीम बदला"
    },
    "theme.light": {
        en: "Switch to light mode",
        mr: "लाईट मोड सुरू करा"
    },
    "theme.dark": {
        en: "Switch to dark mode",
        mr: "डार्क मोड सुरू करा"
    },

    // Footer & Notices
    "footer.copyright": {
        en: "© 2027 BappaMap Mumbai • Community Directory & Cultural Navigation Aid",
        mr: "© २०२७ बाप्पा मॅप मुंबई • समुदाय संचिका आणि सांस्कृतिक मार्गदर्शक"
    },
    "footer.zeroGeo": {
        en: "Zero Geolocation Policy",
        mr: "शून्य स्थान ट्रॅकिंग धोरण"
    },
    "footer.osmAttribution": {
        en: "Map data © OpenStreetMap contributors via OpenFreeMap",
        mr: "नकाशा डेटा © ओपनस्ट्रीटमॅप योगदानकर्ते (ओपनफ्रीमॅप)"
    },
    "map.viewportNotice": {
        en: "South Mumbai Restricted Viewport • Colaba to Lalbaug",
        mr: "दक्षिण मुंबई मर्यादित नकाशा • कुलाबा ते लालबाग"
    },

    // Contribution Modal
    "modal.title": {
        en: "Contribute to BappaMap",
        mr: "बाप्पा मॅपमध्ये योगदान द्या"
    },
    "modal.tabSuggest": {
        en: "Suggest Mandal",
        mr: "नवीन मंडळ"
    },
    "modal.tabReview": {
        en: "Review & Crowd",
        mr: "पुनरावलोकन व गर्दी"
    },
    "modal.tabPhoto": {
        en: "Upload Photo",
        mr: "छायाचित्र जोडा"
    },
    "modal.successTitle": {
        en: "Contribution Received!",
        mr: "योगदान यशस्वीरित्या प्राप्त!"
    },
    "modal.successDetail": {
        en: "Thank you for contributing to BappaMap Mumbai! Your submission has been safely queued for volunteer review and will appear once verified.",
        mr: "बाप्पा मॅप मुंबईमध्ये योगदान दिल्याबद्दल धन्यवाद! आपले योगदान स्वयंसेवक पडताळणीसाठी सुरक्षितपणे नोंदवले आहे आणि मंजुरीनंतर दिसेल."
    },
    "modal.backToMap": {
        en: "Back to Map",
        mr: "नकाशाकडे परत जा"
    }
};

/**
 * Returns translated string for the provided key and language.
 * Falls back to English if the key does not exist for the language.
 */
export function t(key: string, lang: Language): string {
    const entry = TRANSLATIONS[key];
    if (!entry) {
        return key;
    }
    return entry[lang] || entry.en || key;
}

/**
 * Extracts the appropriate localized string field (name, locality, description)
 * from a MandalItem according to the active language.
 */
export function getLocalizedField(
    mandal: MandalItem,
    field: "name" | "locality" | "description",
    lang: Language
): string {
    if (lang === "mr") {
        if (field === "name" && mandal.nameMr) return mandal.nameMr;
        if (field === "locality" && mandal.localityMr) return mandal.localityMr;
        if (field === "description" && mandal.descriptionMr) return mandal.descriptionMr;
    }

    // Fall back to English
    if (field === "name") return mandal.nameEn;
    if (field === "locality") return mandal.localityEn;
    if (field === "description") return mandal.descriptionEn || "";
    return "";
}
