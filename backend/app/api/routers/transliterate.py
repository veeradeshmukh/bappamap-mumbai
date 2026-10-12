import re
import urllib.parse

import httpx
from fastapi import APIRouter, Query

router = APIRouter(prefix="/transliterate", tags=["transliteration"])

# Specialized Mumbai Ganeshotsav Dictionary for instant, accurate translation
MUMBAI_LOCAL_DICTIONARY: dict[str, str] = {
    # Mandals & Titles
    "raja": "राजा",
    "ganraj": "गणराज",
    "ganesh": "गणेश",
    "ganpati": "गणपती",
    "bappa": "बाप्पा",
    "mandal": "मंडळ",
    "sarvajanik": "सार्वजनिक",
    "utsav": "उत्सव",
    "seva": "सेवा",
    "mitra": "मित्र",
    "trust": "ट्रस्ट",
    "chintamani": "चिंतामणी",
    "icchapurti": "इच्छापूर्ती",
    "bal": "बाल",
    "gopal": "गोपाळ",
    "akhil": "अखिल",
    "shree": "श्री",
    "sri": "श्री",
    "sai": "साई",
    "krupa": "कृपा",
    "chawl": "चाळ",
    "chal": "चाळ",
    "compound": "कंपाऊंड",
    "lane": "गल्ली",
    "galli": "गल्ली",
    "road": "रोड",
    "street": "मार्ग",
    "marg": "मार्ग",
    "market": "मार्केट",
    "bazar": "बाजार",
    "bazaar": "बाजार",

    # Localities & Wards in South Mumbai
    "girgaon": "गिरगाव",
    "girgaum": "गिरगाव",
    "lalbaug": "लालबाग",
    "lalbagh": "लालबाग",
    "parel": "परळ",
    "lower parel": "लोअर परळ",
    "khetwadi": "खेतवाडी",
    "mazgaon": "माझगाव",
    "byculla": "भायखळा",
    "colaba": "कुलाबा",
    "fort": "फोर्ट",
    "csmt": "सीएसएमटी",
    "vt": "सीएसएमटी",
    "marine lines": "मरीन लाइन्स",
    "chira bazar": "चिरा बाजार",
    "chinchpokli": "चिंचपोकळी",
    "grant road": "ग्रँट रोड",
    "malabar hill": "मलबार हिल",
    "walkeshwar": "वाळकेश्वर",
    "dongri": "डोंगरी",
    "mandvi": "मांडवी",
    "umerkhadi": "उमरखाडी",
    "kalbadevi": "काळबादेवी",
    "bhuleshwar": "भुलेश्वर",
    "sewri": "शिवडी",
    "wadala": "वडाळा",
    "dadar": "दादर",
    "tejukaya": "तेजुकूया",
    "nikadwari": "निकदवारी",
    "keshavji": "केशवजी",
    "naik": "नाईक",
    "anjirwadi": "अंजीरवाडी",
    "chandanwadi": "चंदनवाडी",
    "currey road": "करी रोड",
    "sandhurst road": "सँडहर्स्ट रोड",
    "opera house": "ऑपेरा हाऊस",
    "churchgate": "चर्चगेट",
    "mumbai": "मुंबई",
    "bombay": "मुंबई",
}

# Phonetic consonants and vowels mapping fallback
CONSONANTS = {
    "k": "क", "kh": "ख", "g": "ग", "gh": "घ",
    "ch": "च", "chh": "छ", "j": "ज", "jh": "झ",
    "t": "त", "th": "थ", "d": "द", "dh": "ध", "n": "न",
    "p": "प", "ph": "फ", "f": "फ", "b": "ब", "bh": "भ", "m": "म",
    "y": "य", "r": "र", "l": "ल", "v": "व", "w": "व",
    "sh": "श", "shh": "ष", "s": "स", "h": "ह",
}


def rule_based_transliterate(text: str) -> str:
    """Translates text using dictionary token replacement."""
    if not text.strip():
        return ""

    words = re.split(r"(\s+|[-,/])", text)
    result_parts = []

    for word in words:
        clean = word.lower().strip()
        if clean in MUMBAI_LOCAL_DICTIONARY:
            result_parts.append(MUMBAI_LOCAL_DICTIONARY[clean])
        elif clean.endswith("cha") and clean[:-3] in MUMBAI_LOCAL_DICTIONARY:
            result_parts.append(MUMBAI_LOCAL_DICTIONARY[clean[:-3]] + "चा")
        elif clean.endswith("chi") and clean[:-3] in MUMBAI_LOCAL_DICTIONARY:
            result_parts.append(MUMBAI_LOCAL_DICTIONARY[clean[:-3]] + "ची")
        else:
            result_parts.append(word)

    return "".join(result_parts)


@router.get("")
async def transliterate_text(text: str = Query(..., description="English text to transliterate to Marathi")):
    """Converts English text to Marathi (Devanagari) using dictionary + Google Input Tools API."""
    cleaned = text.strip()
    if not cleaned:
        return {"original": text, "marathi": ""}

    # 1. Fast local dictionary check for common mandals & localities
    local_translation = rule_based_transliterate(cleaned)
    if local_translation != cleaned:
        # If every word was matched, return immediately
        words_untranslated = [w for w in re.split(r"\s+", local_translation) if re.search(r"[a-zA-Z]", w)]
        if not words_untranslated:
            return {"original": text, "marathi": local_translation}

    # 2. Query Google Input Tools transliteration service for unmapped phonetic terms
    try:
        url = (
            f"https://inputtools.google.com/request?text={urllib.parse.quote(cleaned)}"
            "&itc=mr-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage"
        )
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data and data[0] == "SUCCESS" and len(data) > 1 and data[1]:
                    # Extract suggested transliterations
                    res_words = []
                    for item in data[1]:
                        original_word = item[0]
                        clean_item = original_word.lower()
                        suggested_options = item[1]

                        # Check local dictionary with possessive suffix support first
                        if clean_item in MUMBAI_LOCAL_DICTIONARY:
                            res_words.append(MUMBAI_LOCAL_DICTIONARY[clean_item])
                        elif clean_item.endswith("cha") and clean_item[:-3] in MUMBAI_LOCAL_DICTIONARY:
                            res_words.append(MUMBAI_LOCAL_DICTIONARY[clean_item[:-3]] + "चा")
                        elif clean_item.endswith("chi") and clean_item[:-3] in MUMBAI_LOCAL_DICTIONARY:
                            res_words.append(MUMBAI_LOCAL_DICTIONARY[clean_item[:-3]] + "ची")
                        elif suggested_options and len(suggested_options) > 0:
                            res_words.append(suggested_options[0])
                        else:
                            res_words.append(original_word)

                    return {"original": text, "marathi": " ".join(res_words)}
    except Exception:
        pass

    # Fallback to local rule-based translation
    return {"original": text, "marathi": local_translation}
