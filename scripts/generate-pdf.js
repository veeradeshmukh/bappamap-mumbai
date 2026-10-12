const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { chromium } = require('@playwright/test');

async function generatePdf() {
    const mdPath = path.resolve(__dirname, '../docs/technical-report-ieee.md');
    const outPdfPath = path.resolve(__dirname, '../docs/technical-report-ieee.pdf');
    
    if (!fs.existsSync(mdPath)) {
        console.error('File not found:', mdPath);
        process.exit(1);
    }

    const mdContent = fs.readFileSync(mdPath, 'utf-8');

    // Custom marked renderer for clean IEEE layout
    const renderer = new marked.Renderer();
    
    // Convert Markdown to HTML
    marked.setOptions({
        renderer,
        gfm: true,
        breaks: false
    });

    const rawHtml = marked.parse(mdContent);

    // Build the full HTML document with IEEE styling
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BappaMap Mumbai: Technical Report (IEEE Format)</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false});"></script>
<style>
    @page {
        size: letter;
        margin: 20mm 15mm 22mm 15mm;
    }

    *, *::before, *::after {
        box-sizing: border-box;
    }

    body {
        font-family: "Times New Roman", Times, Georgia, serif;
        font-size: 9.5pt;
        line-height: 1.25;
        color: #111;
        background: #fff;
        margin: 0;
        padding: 0;
    }

    /* Title & Metadata Banner (Spans full page width) */
    .paper-header {
        text-align: center;
        margin-bottom: 14pt;
        padding-bottom: 8pt;
        border-bottom: 0.5pt solid #ddd;
    }

    .paper-title {
        font-size: 20pt;
        font-weight: bold;
        line-height: 1.15;
        margin: 0 0 10pt 0;
        color: #000;
        letter-spacing: -0.2pt;
    }

    .paper-authors {
        font-size: 10pt;
        margin-bottom: 12pt;
        line-height: 1.35;
        color: #222;
    }

    .paper-authors strong {
        font-size: 11pt;
    }

    .paper-authors em {
        font-style: italic;
        color: #444;
    }

    /* Abstract & Index Terms */
    .abstract-box {
        max-width: 90%;
        margin: 0 auto 14pt auto;
        font-size: 9pt;
        line-height: 1.25;
        text-align: justify;
    }

    .abstract-title {
        font-weight: bold;
        font-style: italic;
        display: inline;
    }

    .index-terms {
        margin-top: 6pt;
        font-size: 8.5pt;
        line-height: 1.25;
        text-align: justify;
    }

    .index-terms strong {
        font-style: italic;
    }

    /* Two-Column Body Content */
    .paper-body {
        column-count: 2;
        column-gap: 18pt;
        text-align: justify;
    }

    /* Headings */
    h1, h2, h3, h4 {
        font-family: "Times New Roman", Times, serif;
        page-break-after: avoid;
        break-after: avoid;
    }

    h2 {
        font-size: 10pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
        text-align: center;
        margin: 12pt 0 5pt 0;
        padding-top: 4pt;
        border-top: 0.5pt solid #ccc;
    }

    h3 {
        font-size: 9.5pt;
        font-weight: bold;
        font-style: italic;
        margin: 8pt 0 3pt 0;
    }

    h4 {
        font-size: 9pt;
        font-weight: bold;
        margin: 6pt 0 2pt 0;
    }

    p {
        margin: 0 0 5pt 0;
        text-indent: 12pt;
    }

    p:first-of-type, .no-indent {
        text-indent: 0;
    }

    /* Formulas & Math */
    .math, p:has(code) {
        text-indent: 0;
    }

    /* Tables */
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 8pt 0;
        font-size: 7.5pt;
        line-height: 1.15;
        page-break-inside: avoid;
        break-inside: avoid;
        border-top: 1.2pt solid #000;
        border-bottom: 1.2pt solid #000;
    }

    th, td {
        padding: 3pt 4pt;
        text-align: left;
    }

    th {
        font-weight: bold;
        border-bottom: 0.8pt solid #000;
        text-transform: uppercase;
        font-size: 7pt;
    }

    tr:nth-child(even) {
        background-color: #fbfbfb;
    }

    /* Preformatted Code & ASCII Architecture Diagrams */
    pre {
        background-color: #f8f9fa;
        border: 0.5pt solid #ccc;
        border-radius: 2pt;
        padding: 4pt 4pt;
        font-family: "Courier New", Courier, monospace;
        font-size: 5pt;
        line-height: 1.08;
        overflow-x: hidden;
        white-space: pre;
        margin: 6pt 0;
        page-break-inside: avoid;
        break-inside: avoid;
    }

    code {
        font-family: "Courier New", Courier, monospace;
        font-size: 8pt;
        background-color: #f3f4f6;
        padding: 0.5pt 2pt;
        border-radius: 1.5pt;
    }

    pre code {
        font-size: 6pt;
        background: transparent;
        padding: 0;
    }

    /* Lists */
    ol, ul {
        margin: 3pt 0 6pt 0;
        padding-left: 14pt;
    }

    li {
        margin-bottom: 2pt;
        font-size: 9pt;
        line-height: 1.2;
    }

    /* Blockquotes */
    blockquote {
        margin: 5pt 0;
        padding: 3pt 8pt;
        border-left: 2pt solid #888;
        font-style: italic;
        color: #333;
    }

    /* Figures & Captions */
    em {
        font-style: italic;
    }

    /* References */
    .references-section ol, .references-section ul {
        list-style-type: none;
        padding-left: 0;
    }

    .references-section li {
        text-indent: -14pt;
        padding-left: 14pt;
        font-size: 8pt;
        line-height: 1.2;
        margin-bottom: 3pt;
    }

    /* Print Optimizations */
    @media print {
        body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    }
</style>
</head>
<body>

<div class="paper-header">
    <h1 class="paper-title">BappaMap Mumbai: High-Performance, Privacy-Preserving Geospatial Crowdsourcing and Real-Time Event Architecture for Mega-Festival Navigation</h1>
    <div class="paper-authors">
        <strong>Ranveer Deshmukh</strong><br>
        <em>Department of Computer Science & Engineering</em><br>
        <em>Autonomous Agentic Systems Laboratory</em><br>
        Email: ranveer.deshmukh110804@gmail.com
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
    ${cleanBodyContent(rawHtml)}
</div>

</body>
</html>`;

    // Launch Chromium via Playwright
    console.log('Launching Playwright Chromium for PDF generation...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(fullHtml, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // Allow KaTeX auto-render to complete

    console.log('Rendering PDF with IEEE print layout...');
    await page.pdf({
        path: outPdfPath,
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="width:100%; font-size:7.5pt; font-family:\'Times New Roman\', serif; color:#666; text-align:right; padding-right:15mm;">IEEE TECHNICAL REPORT • BAPPAMAP MUMBAI</div>',
        footerTemplate: '<div style="width:100%; font-size:8pt; font-family:\'Times New Roman\', serif; color:#333; text-align:center;"><span class="pageNumber"></span></div>',
        margin: {
            top: '20mm',
            bottom: '22mm',
            left: '15mm',
            right: '15mm'
        }
    });

    await browser.close();

    const stats = fs.statSync(outPdfPath);
    console.log(`PDF successfully generated at: ${outPdfPath} (${(stats.size / 1024).toFixed(1)} kB)`);
}

function cleanBodyContent(html) {
    // Strip redundant paper title, authors, abstract, index terms from body since they are in the header
    let content = html;

    // Remove the h1 and author block from body
    content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');
    content = content.replace(/<p><strong>Ranveer Deshmukh<\/strong>[\s\S]*?<\/p>/i, '');
    content = content.replace(/<hr\s*\/?>/gi, '');

    // Remove redundant abstract and index terms from body
    content = content.replace(/<h3[^>]*>Abstract<\/h3>[\s\S]*?(?=<h2)/i, '');
    content = content.replace(/<h3[^>]*>Index Terms<\/h3>[\s\S]*?(?=<h2)/i, '');

    // Format References section
    content = content.replace(/<h2[^>]*>References<\/h2>([\s\S]*)/i, (match, p1) => {
        return `<div class="references-section"><h2>References</h2>${p1}</div>`;
    });

    return content;
}

generatePdf().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
});
