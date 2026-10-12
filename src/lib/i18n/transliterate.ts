/**
 * Client-side transliteration and auto-Marathi generator for BappaMap Mumbai.
 * Provides instant dictionary matching and debounced server transliteration.
 */

const LOCAL_MUMBAI_DICT: Record<string, string> = {
    // Mandals & Words
    raja: "राजा",
    ganraj: "गणराज",
    ganesh: "गणेश",
    ganpati: "गणपती",
    bappa: "बाप्पा",
    mandal: "मंडळ",
    sarvajanik: "सार्वजनिक",
    utsav: "उत्सव",
    seva: "सेवा",
    mitra: "मित्र",
    trust: "ट्रस्ट",
    chintamani: "चिंतामणी",
    icchapurti: "इच्छापूर्ती",
    bal: "बाल",
    gopal: "गोपाळ",
    akhil: "अखिल",
    shree: "श्री",
    sri: "श्री",
    sai: "साई",
    krupa: "कृपा",
    chawl: "चाळ",
    compound: "कंपाऊंड",
    lane: "गल्ली",
    galli: "गल्ली",
    road: "रोड",
    street: "मार्ग",
    marg: "मार्ग",
    market: "मार्केट",
    bazar: "बाजार",

    // South Mumbai Localities
    girgaon: "गिरगाव",
    girgaum: "गिरगाव",
    lalbaug: "लालबाग",
    parel: "परळ",
    khetwadi: "खेतवाडी",
    mazgaon: "माझगाव",
    byculla: "भायखळा",
    colaba: "कुलाबा",
    fort: "फोर्ट",
    csmt: "सीएसएमटी",
    "marine lines": "मरीन लाइन्स",
    "chira bazar": "चिरा बाजार",
    chinchpokli: "चिंचपोकळी",
    "grant road": "ग्रँट रोड",
    "malabar hill": "मलबार हिल",
    walkeshwar: "वाळकेश्वर",
    dongri: "डोंगरी",
    mandvi: "मांडवी",
    umerkhadi: "उमरखाडी",
    kalbadevi: "काळबादेवी",
    bhuleshwar: "भुलेश्वर",
    sewri: "शिवडी",
    wadala: "वडाळा",
    dadar: "दादर",
    tejukaya: "तेजुकूया",
    nikadwari: "निकदवारी",
    keshavji: "केशवजी",
    naik: "नाईक",
    anjirwadi: "अंजीरवाडी",
    chandanwadi: "चंदनवाडी"
};

/**
 * Instant local transliteration for instant responsive typing without lag.
 */
export function instantLocalTransliterate(text: string): string {
    if (!text.trim()) return "";

    const tokens = text.split(/(\s+|[-,/])/);
    const converted = tokens.map((token) => {
        const clean = token.toLowerCase().trim();
        if (LOCAL_MUMBAI_DICT[clean]) {
            return LOCAL_MUMBAI_DICT[clean];
        }
        if (clean.endsWith("cha") && LOCAL_MUMBAI_DICT[clean.slice(0, -3)]) {
            return LOCAL_MUMBAI_DICT[clean.slice(0, -3)] + "चा";
        }
        if (clean.endsWith("chi") && LOCAL_MUMBAI_DICT[clean.slice(0, -3)]) {
            return LOCAL_MUMBAI_DICT[clean.slice(0, -3)] + "ची";
        }
        return token;
    });

    return converted.join("");
}

/**
 * Asynchronous transliteration calling the backend transliterate endpoint.
 */
export async function fetchMarathiTransliteration(text: string): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return "";

    try {
        const res = await fetch(`/api/transliterate?text=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
            const data = await res.json();
            if (data?.marathi) {
                return data.marathi;
            }
        }
    } catch {
        // Fall back to instant dictionary
    }

    return instantLocalTransliterate(text);
}
