const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { chromium } = require('@playwright/test');

function parseMarkdownWithMath(mdContent) {
    const displayMath = [];
    const inlineMath = [];

    // 1. Protect block/display math ($$...$$)
    let text = mdContent.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
        const id = displayMath.length;
        displayMath.push(math.trim());
        return `@@DISPLAY_MATH_${id}@@`;
    });

    // 2. Protect inline math ($...$)
    text = text.replace(/\$([^$\n]+?)\$/g, (match, math) => {
        const id = inlineMath.length;
        inlineMath.push(math.trim());
        return `@@INLINE_MATH_${id}@@`;
    });

    marked.setOptions({ gfm: true, breaks: false });
    let html = marked.parse(text);

    // 3. Restore display math
    html = html.replace(/@@DISPLAY_MATH_(\d+)@@/g, (match, id) => {
        const formula = displayMath[parseInt(id, 10)];
        return `<div class="katex-display-wrapper">$$${formula}$$</div>`;
    });

    // 4. Restore inline math
    html = html.replace(/@@INLINE_MATH_(\d+)@@/g, (match, id) => {
        const formula = inlineMath[parseInt(id, 10)];
        return `$${formula}$`;
    });

    return html;
}

async function buildOnePageReport(browser) {
    const mdPath = path.resolve(__dirname, '../docs/technical-report-ieee.md');
    const outPdfPath = path.resolve(__dirname, '../docs/technical-report-ieee.pdf');
    const mdContent = fs.readFileSync(mdPath, 'utf-8');

    const rawHtml = parseMarkdownWithMath(mdContent);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BappaMap Mumbai: 1-Page IEEE Technical Report</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false});"></script>
<style>
    @page {
        size: letter;
        margin: 9mm 11mm 9mm 11mm;
    }

    *, *::before, *::after {
        box-sizing: border-box;
    }

    html, body {
        height: 100%;
    }

    body {
        font-family: "Times New Roman", Times, Georgia, serif;
        font-size: 8.5pt;
        line-height: 1.22;
        color: #050505;
        background: #fff;
        margin: 0;
        padding: 0;
    }

    .paper-header {
        text-align: center;
        margin-bottom: 8pt;
        padding-bottom: 4.5pt;
        border-bottom: 0.6pt solid #333;
    }

    .paper-title {
        font-size: 14.5pt;
        font-weight: bold;
        line-height: 1.18;
        margin: 0 0 3.5pt 0;
        color: #000;
        letter-spacing: -0.1pt;
    }

    .paper-authors {
        font-size: 8.6pt;
        margin-bottom: 2pt;
        line-height: 1.25;
        color: #222;
    }

    .abstract-box {
        margin: 0 0 8pt 0;
        font-size: 8.0pt;
        line-height: 1.20;
        text-align: justify;
    }

    .abstract-title {
        font-weight: bold;
        font-style: italic;
    }

    .index-terms {
        font-size: 7.6pt;
        margin-top: 3pt;
    }

    .index-terms strong {
        font-style: italic;
    }

    .paper-body {
        column-count: 2;
        column-gap: 13pt;
        text-align: justify;
    }

    h2 {
        font-size: 8.8pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.3pt;
        text-align: center;
        margin: 7pt 0 3pt 0;
        padding-top: 3pt;
        border-top: 0.5pt solid #aaa;
    }

    h3 {
        font-size: 8.4pt;
        font-weight: bold;
        font-style: italic;
        margin: 5pt 0 2pt 0;
    }

    p {
        margin: 0 0 4pt 0;
        text-indent: 9pt;
    }

    p:first-of-type, .no-indent {
        text-indent: 0;
    }

    /* ASCII Diagrams & Code */
    pre {
        background-color: #f8f9fa;
        border: 0.5pt solid #888;
        border-radius: 1.5pt;
        padding: 3.5pt 4.5pt;
        font-family: Consolas, "Courier New", Courier, monospace;
        font-size: 5.1pt;
        line-height: 1.10;
        white-space: pre;
        margin: 4pt 0;
        page-break-inside: avoid;
        break-inside: avoid;
        max-width: 100%;
        overflow: visible;
        box-sizing: border-box;
    }

    code {
        font-family: Consolas, "Courier New", Courier, monospace;
        font-size: 7.2pt;
        background-color: #f1f2f4;
        padding: 0.2pt 1.5pt;
        border-radius: 1pt;
    }

    pre code {
        font-size: inherit;
        background: transparent;
        padding: 0;
    }

    /* Tables */
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 4pt 0;
        font-size: 7.1pt;
        line-height: 1.15;
        page-break-inside: avoid;
        break-inside: avoid;
        border-top: 1.1pt solid #000;
        border-bottom: 1.1pt solid #000;
    }

    th, td {
        padding: 2.0pt 2.8pt;
        text-align: left;
    }

    th {
        font-weight: bold;
        border-bottom: 0.6pt solid #000;
        font-size: 6.6pt;
        text-transform: uppercase;
    }

    ul, ol {
        margin: 2pt 0 3.5pt 0;
        padding-left: 10pt;
    }

    li {
        margin-bottom: 1.2pt;
        font-size: 8.2pt;
        line-height: 1.18;
    }

    /* Math formulas */
    .katex-display-wrapper {
        margin: 3pt 0;
        text-align: center;
    }

    .katex-display {
        margin: 2pt 0 !important;
        font-size: 0.92em !important;
    }

    /* References */
    .references-section {
        margin-top: 5.5pt;
    }

    .references-section h2 {
        margin-top: 4pt;
        margin-bottom: 2pt;
    }

    .references-section p {
        text-indent: -9pt;
        padding-left: 9pt;
        font-size: 7.1pt;
        line-height: 1.16;
        margin-bottom: 2.2pt;
    }
</style>
</head>
<body>

<div class="paper-header">
    <div class="paper-title">BappaMap Mumbai: High-Performance, Privacy-Preserving Geospatial Crowdsourcing and Real-Time Event Architecture for Mega-Festival Navigation</div>
    <div class="paper-authors">
        <strong>Veera Deshmukh</strong> • <em>Department of Biomedical Engineering</em> • desh.veera@gmail.com
    </div>
</div>

<div class="abstract-box">
    <p class="no-indent">
        <span class="abstract-title">Abstract</span>—During Mumbai's annual 10-day Ganeshotsav festival, over 15 million devotees navigate dense South Mumbai corridors (Girgaon to Lalbaug). Cellular network congestion, high-rise urban GPS multipath errors, and the failure of commercial maps to account for ephemeral barricades and queue bifurcations severely impair navigation. We present <strong>BappaMap Mumbai</strong>, a privacy-first, edge-optimized geospatial crowdsourcing system. Powered by MapLibre GL JS and OpenFreeMap vector tiles bounded strictly to South Mumbai (72.78°E, 18.89°N to 72.87°E, 19.015°N), the platform deploys a dual-queue 120-minute temporal decay model separating <em>Mukh Darshan</em> (glimpse) from <em>Charan Sparsh</em> (votive touch) queues. An authentic Roman-to-Devanagari phonetic transliteration engine resolves Marathi morphology. Guided by the Indian Digital Personal Data Protection (DPDP) Act 2023, the system enforces a strict Zero-Geolocation invariant, client-side HTML5 Canvas EXIF stripping, and HMAC-SHA256 salted IP anonymization. An asynchronous FastAPI ASGI backend with PostgreSQL/PostGIS spatial GiST indexing streams live updates via Server-Sent Events (SSE) upon moderation. Benchmarks demonstrate p95 spatial lookup latencies under 12 ms, an initial JavaScript payload of 78 kB (gzipped), and 100% WCAG 2.2 AA accessibility compliance.
    </p>
    <div class="index-terms">
        <strong>Index Terms</strong>—GIS, PostGIS, Server-Sent Events, Temporal Crowd Decay, DPDP Act 2023, Zero-Geolocation, Devanagari Transliteration.
    </div>
</div>

<div class="paper-body">
    ${cleanOnePageBody(rawHtml)}
</div>

</body>
</html>`;

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.pdf({
        path: outPdfPath,
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="width:100%; font-size:6.5pt; font-family:\'Times New Roman\', serif; color:#666; text-align:right; padding-right:11mm;">IEEE 1-PAGE TECHNICAL REPORT • BAPPAMAP MUMBAI</div>',
        footerTemplate: '<div style="width:100%; font-size:7pt; font-family:\'Times New Roman\', serif; color:#333; text-align:center;"><span class="pageNumber"></span></div>',
        margin: {
            top: '9mm',
            bottom: '9mm',
            left: '11mm',
            right: '11mm'
        }
    });

    await page.close();
    console.log(`Generated 1-Page PDF at: ${outPdfPath}`);
}

async function buildFullReport(browser) {
    const mdPath = path.resolve(__dirname, '../docs/technical-report-ieee-full.md');
    const outPdfPath = path.resolve(__dirname, '../docs/technical-report-ieee-full.pdf');
    if (!fs.existsSync(mdPath)) return;

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    const rawHtml = parseMarkdownWithMath(mdContent);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BappaMap Mumbai: Full Technical Report (IEEE Format)</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false});"></script>
<style>
    @page {
        size: letter;
        margin: 16mm 14mm 18mm 14mm;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
        font-family: "Times New Roman", Times, Georgia, serif;
        font-size: 8.8pt;
        line-height: 1.20;
        color: #111;
        background: #fff;
        margin: 0;
        padding: 0;
    }
    .paper-header {
        text-align: center;
        margin-bottom: 10pt;
        padding-bottom: 5pt;
        border-bottom: 0.5pt solid #ccc;
    }
    .paper-title {
        font-size: 17pt;
        font-weight: bold;
        line-height: 1.15;
        margin: 0 0 6pt 0;
        color: #000;
    }
    .paper-authors {
        font-size: 9pt;
        margin-bottom: 6pt;
        line-height: 1.25;
        color: #222;
    }
    .abstract-box {
        max-width: 94%;
        margin: 0 auto 8pt auto;
        font-size: 8.2pt;
        line-height: 1.18;
        text-align: justify;
    }
    .abstract-title { font-weight: bold; font-style: italic; }
    .index-terms { margin-top: 3.5pt; font-size: 7.8pt; text-align: justify; }
    .index-terms strong { font-style: italic; }
    .paper-body {
        column-count: 2;
        column-gap: 15pt;
        text-align: justify;
    }
    h2 {
        font-size: 9.2pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.4pt;
        text-align: center;
        margin: 9pt 0 3.5pt 0;
        padding-top: 2.5pt;
        border-top: 0.5pt solid #ccc;
    }
    h3 { font-size: 8.8pt; font-weight: bold; font-style: italic; margin: 6pt 0 2pt 0; }
    p { margin: 0 0 4pt 0; text-indent: 9pt; }
    p:first-of-type, .no-indent { text-indent: 0; }

    /* Wide full-width figures across two columns */
    .full-width-figure {
        column-span: all;
        -webkit-column-span: all;
        margin: 9pt 0 7pt 0;
        text-align: center;
        width: 100%;
        page-break-inside: avoid;
        break-inside: avoid;
    }
    .full-width-figure pre {
        display: block;
        margin: 0 auto;
        width: 100%;
        max-width: 100%;
        font-family: Consolas, "Courier New", Courier, monospace;
        font-size: 5.6pt;
        line-height: 1.08;
        background-color: #f8f9fa;
        border: 0.5pt solid #777;
        border-radius: 2pt;
        padding: 5pt 8pt;
        overflow: visible;
        white-space: pre;
        box-sizing: border-box;
        text-align: left;
    }
    .full-width-figure p {
        font-size: 7.8pt;
        font-weight: normal;
        text-align: center;
        margin: 3.5pt 0 4pt 0;
        text-indent: 0;
    }

    /* Normal pre (in-column code) */
    pre {
        background-color: #f8f9fa;
        border: 0.5pt solid #bbb;
        border-radius: 2pt;
        padding: 3pt 3pt;
        font-family: Consolas, "Courier New", Courier, monospace;
        font-size: 5.4pt;
        line-height: 1.08;
        white-space: pre-wrap;
        word-break: break-all;
        margin: 4pt 0;
        page-break-inside: avoid;
        break-inside: avoid;
    }
    code {
        font-family: Consolas, "Courier New", Courier, monospace;
        font-size: 7.2pt;
        background-color: #f3f4f6;
        padding: 0.5pt 2pt;
        border-radius: 1.5pt;
    }
    pre code { font-size: inherit; background: transparent; padding: 0; }

    table {
        width: 100%;
        border-collapse: collapse;
        margin: 5pt 0;
        font-size: 7.0pt;
        line-height: 1.12;
        page-break-inside: avoid;
        break-inside: avoid;
        border-top: 1.2pt solid #000;
        border-bottom: 1.2pt solid #000;
    }
    th, td { padding: 2.2pt 3pt; text-align: left; }
    th { font-weight: bold; border-bottom: 0.8pt solid #000; font-size: 6.6pt; text-transform: uppercase; }
    ul, ol { margin: 2pt 0 3.5pt 0; padding-left: 11pt; }
    li { margin-bottom: 1.2pt; font-size: 8.2pt; line-height: 1.16; }

    .katex-display-wrapper {
        margin: 2.5pt 0;
        text-align: center;
    }
    .katex-display {
        margin: 2.5pt 0 !important;
        font-size: 0.9em !important;
    }

    .references-section p {
        text-indent: -11pt;
        padding-left: 11pt;
        font-size: 7.2pt;
        line-height: 1.14;
        margin-bottom: 1.8pt;
    }
</style>
</head>
<body>
<div class="paper-header">
    <div class="paper-title">BappaMap Mumbai: High-Performance, Privacy-Preserving Geospatial Crowdsourcing and Real-Time Event Architecture for Mega-Festival Navigation</div>
    <div class="paper-authors">
        <strong>Veera Deshmukh</strong><br>
        <em>Department of Biomedical Engineering</em><br>
        Email: desh.veera@gmail.com
    </div>
</div>
<div class="abstract-box">
    <p class="no-indent">
        <span class="abstract-title">Abstract</span>—During Mumbai's annual 10-day Ganeshotsav festival, millions of devotees converge upon South Mumbai's dense urban corridors (Girgaon, Khetwadi, Byculla, Lalbaug) to visit historic Ganpati mandals. This hyper-dense pedestrian migration triggers severe cellular network degradation, standard global positioning system (GPS) inaccuracies due to high-rise urban canyons and barricaded alleyways, and the complete inadequacy of mainstream commercial mapping providers, which lack ephemeral pedestrian contexts and queue-specific routing. This paper introduces <strong>BappaMap Mumbai</strong>, an edge-first, privacy-preserving geospatial crowdsourcing platform and real-time streaming engine engineered specifically for congested mobile networks. The system achieves complete independence from paid, proprietary map APIs by pairing MapLibre GL JS with open vector tiles bounded strictly to South Mumbai (72.78°E, 18.89°N to 72.87°E, 19.015°N). We formulate and deploy a dual-queue temporal crowd decay model across a 120-minute sliding window that differentiates <em>Mukh Darshan</em> (glimpse) from <em>Charan Sparsh</em> (votive touch) wait times. To respect linguistic cultural nuances while maintaining low friction, we present a hybrid phonetic Devanagari transliteration engine with Marathi inflectional suffix parsing. Addressing strict privacy mandates and the Indian Digital Personal Data Protection (DPDP) Act 2023, the platform enforces an absolute zero-geolocation policy (verified through automated Abstract Syntax Tree static analysis), executes in-browser client-side HTML5 Canvas EXIF/GPS telemetry stripping, and anonymizes telemetry via HMAC-SHA256 salted IP hashes. The production backend couples an asynchronous FastAPI ASGI engine with PostgreSQL/PostGIS spatial GiST indexing, delivering Server-Sent Events (SSE) broadcasts to connected clients upon administrative moderation approval. Empirical benchmarks demonstrate p95 spatial lookup latencies under 12 ms, an initial client JavaScript bundle of 78 kB (gzipped, excluding map worker), and 100% WCAG 2.2 AA accessibility compliance.
    </p>
    <div class="index-terms">
        <strong>Index Terms</strong>—Geographic Information Systems (GIS), PostGIS, Spatial Indexing, Server-Sent Events (SSE), Crowd Density Estimation, Temporal Decay Model, Digital Personal Data Protection (DPDP) Act, Privacy-Preserving Telemetry, Devanagari Phonetic Transliteration, Edge Computing.
    </div>
</div>
<div class="paper-body">
    ${cleanFullBody(rawHtml)}
</div>
</body>
</html>`;

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.pdf({
        path: outPdfPath,
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="width:100%; font-size:7pt; font-family:\'Times New Roman\', serif; color:#666; text-align:right; padding-right:14mm;">IEEE TECHNICAL REPORT (FULL) • BAPPAMAP MUMBAI</div>',
        footerTemplate: '<div style="width:100%; font-size:7.5pt; font-family:\'Times New Roman\', serif; color:#333; text-align:center;"><span class="pageNumber"></span></div>',
        margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' }
    });

    await page.close();
    console.log(`Generated Full PDF at: ${outPdfPath}`);
}

function cleanOnePageBody(html) {
    let content = html;
    content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');
    content = content.replace(/<p><strong>Veera Deshmukh<\/strong>[\s\S]*?<\/p>/i, '');
    content = content.replace(/<hr\s*\/?>/gi, '');
    content = content.replace(/<h3[^>]*>Abstract<\/h3>[\s\S]*?(?=<h2)/i, '');
    content = content.replace(/<h2[^>]*>References<\/h2>([\s\S]*)/i, (m, p1) => `<div class="references-section"><h2>References</h2>${p1}</div>`);
    return content;
}

function cleanFullBody(html) {
    let content = html;
    content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');
    content = content.replace(/<p><strong>Veera Deshmukh<\/strong>[\s\S]*?<\/p>/i, '');
    content = content.replace(/<hr\s*\/?>/gi, '');
    content = content.replace(/<h3[^>]*>Abstract<\/h3>[\s\S]*?(?=<h2)/i, '');
    content = content.replace(/<h3[^>]*>Index Terms<\/h3>[\s\S]*?(?=<h2)/i, '');

    // Break out Fig. 1 into full-width band between two-column sections
    content = content.replace(
        /(<pre>(?:(?!<\/pre>)[\s\S])*?<\/pre>\s*<p><em>Fig\.\s*1[\s\S]*?<\/p>)/i,
        '</div><div class="full-width-figure">$1</div><div class="paper-body">'
    );

    // Break out Fig. 2 into full-width band between two-column sections
    content = content.replace(
        /(<pre>(?:(?!<\/pre>)[\s\S])*?<\/pre>\s*<p><em>Fig\.\s*2[\s\S]*?<\/p>)/i,
        '</div><div class="full-width-figure">$1</div><div class="paper-body">'
    );

    content = content.replace(/<h2[^>]*>References<\/h2>([\s\S]*)/i, (m, p1) => `<div class="references-section"><h2>References</h2>${p1}</div>`);
    return content;
}

async function main() {
    console.log('Launching Playwright Chromium...');
    const browser = await chromium.launch({ headless: true });
    try {
        await buildOnePageReport(browser);
        await buildFullReport(browser);
    } finally {
        await browser.close();
    }
}

main().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
