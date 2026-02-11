/**
 * Programmatically generate a preview style guide and PDF.
 * 1. Calls POST /api/preview to get style guide markdown (or uses minimal content if API fails).
 * 2. Builds #pdf-export-content HTML (cover + sections).
 * 3. Fetches /pdf-styles from the app.
 * 4. Generates PDF: tries Puppeteer + Chromium in-process; on failure (e.g. local macOS) tries POST /api/export-pdf.
 * 5. Writes scripts/output/preview-style-guide.pdf
 *
 * Run: pnpm dev (in another terminal), then pnpm generate-preview-pdf
 * Options: BASE_URL=http://localhost:3000 pnpm generate-preview-pdf
 * Fallback-only: FALLBACK_ONLY=1 pnpm generate-preview-pdf (calls /api/export-pdf-fallback, writes preview-style-guide-fallback.pdf; same Chrome as primary)
 * Note: Chromium often fails locally (ENOEXEC on macOS/ARM). On Vercel or Linux the script produces the PDF.
 */

import { config } from "dotenv";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

config();

const BASE_URL = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "output");
const OUTPUT_FILE = join(OUTPUT_DIR, "preview-style-guide.pdf");
const OUTPUT_FILE_FALLBACK = join(OUTPUT_DIR, "preview-style-guide-fallback.pdf");
const FALLBACK_ONLY = process.env.FALLBACK_ONLY === "1" || process.env.FALLBACK_ONLY === "true";

const SAMPLE_BRAND = {
  name: "Luna Coffee",
  brandDetailsDescription:
    "Specialty coffee roaster in Portland. We source single-origin beans from small farms and roast in small batches. Target audience: coffee enthusiasts, remote workers, and locals who value quality over convenience.",
  audience: "Coffee enthusiasts, remote workers, and quality-focused millennials",
  websiteUrl: "https://lunacoffee.co",
};

/** Minimal markdown to HTML for section body (headings, bold, paragraphs). */
function markdownToHtml(md) {
  if (!md || !md.trim()) return "";
  const lines = md.trim().split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      out.push(`<h2 class="text-2xl font-bold text-gray-900 mt-12 mb-4">${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      out.push(`<h3 class="text-xl font-semibold text-gray-900 mt-8 mb-3">${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      out.push(`<p class="text-base text-gray-700 mb-4"><strong>${escapeHtml(line.slice(2, -2))}</strong></p>`);
    } else if (line.trim()) {
      out.push(`<p class="text-base text-gray-700 mb-4">${escapeHtml(line)}</p>`);
    }
  }
  return out.join("\n");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build cover HTML (matches StyleGuideCover structure). */
function buildCoverHtml(brandName, websiteUrl, showPreviewBadge = true) {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const subtitle = websiteUrl ? websiteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") : null;
  return `
  <div id="cover" class="scroll-mt-4">
    <div class="min-h-[80vh] flex flex-col justify-center px-12 md:px-20 py-24 bg-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-gray-50/50 via-gray-50/30 to-transparent pointer-events-none animate-pulse"></div>
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none"></div>
      <div class="relative z-10 max-w-3xl space-y-8">
        <div class="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          ${showPreviewBadge ? '<span class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 mb-4">Preview Mode</span>' : ""}
          <p class="text-sm font-medium text-gray-500 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">Brand Voice & Content Guidelines</p>
        </div>
        <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h1 class="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 leading-[0.9]" style="font-family: 'Playfair Display', Georgia, serif">${escapeHtml(brandName || "Brand Voice Guidelines")}</h1>
          <div class="h-1 w-24 bg-gray-900 animate-in slide-in-from-left-4 duration-700 delay-500 rounded-full"></div>
        </div>
        <div class="pt-12 space-y-1 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
          <p class="text-sm">Generated on ${date}</p>
          ${subtitle ? `<p class="text-sm font-medium text-gray-900 mt-2">${escapeHtml(subtitle)}</p>` : ""}
        </div>
      </div>
    </div>
  </div>`;
}

/** Split markdown into sections by ## and build section HTML. */
function buildSectionsHtml(markdown) {
  const sections = markdown.split(/\n(?=## )/).filter(Boolean);
  const out = [];
  let alt = false;
  for (const block of sections) {
    const firstLine = block.indexOf("\n");
    const titleLine = firstLine === -1 ? block : block.slice(0, firstLine);
    const body = firstLine === -1 ? "" : block.slice(firstLine + 1).trim();
    const title = titleLine.replace(/^##\s*/, "").trim();
    if (!title) continue;
    const bgClass = alt ? "bg-gray-50/30" : "bg-white";
    alt = !alt;
    out.push(`
  <div class="scroll-mt-4 px-12 md:px-20 py-20 md:py-24 border-t border-gray-100 ${bgClass}">
    <div class="max-w-3xl mx-auto">
      ${markdownToHtml("## " + title + "\n\n" + body)}
    </div>
  </div>`);
  }
  return out.join("\n");
}

/** Build full #pdf-export-content HTML. */
function buildPdfExportHtml(brandName, websiteUrl, markdown) {
  const cover = buildCoverHtml(brandName, websiteUrl);
  const sections = markdown ? buildSectionsHtml(markdown) : `
  <div class="scroll-mt-4 px-12 md:px-20 py-20 md:py-24 border-t border-gray-100 bg-white">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mt-12 mb-4">About ${escapeHtml(brandName)}</h2>
      <p class="text-base text-gray-700 mb-4">Sample preview content. Run with dev server and optional OPENAI_API_KEY to generate real content via /api/preview.</p>
    </div>
  </div>`;
  return `<div id="pdf-export-content" class="bg-white rounded-lg border shadow-sm overflow-hidden preview-document">${cover}${sections}</div>`;
}

async function main() {
  console.log("Generate preview style guide and PDF");
  console.log("Base URL:", BASE_URL);

  let markdown = null;
  try {
    const previewController = new AbortController();
    const previewTimeout = setTimeout(() => previewController.abort(), 90_000);
    const res = await fetch(`${BASE_URL}/api/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandDetails: SAMPLE_BRAND, selectedTraits: ["Friendly & Approachable", "Clear & Direct"] }),
      signal: previewController.signal,
    });
    clearTimeout(previewTimeout);
    if (res.ok) {
      const data = await res.json();
      markdown = data.preview || null;
      console.log("Preview API OK, using generated content");
    }
  } catch (e) {
    console.log("Preview API skipped or failed:", e.message);
  }
  if (!markdown) {
    markdown = `## About ${SAMPLE_BRAND.name}\n\n${SAMPLE_BRAND.brandDetailsDescription}`;
    console.log("Using minimal content");
  }

  const html = buildPdfExportHtml(SAMPLE_BRAND.name, SAMPLE_BRAND.websiteUrl, markdown);

  let css;
  try {
    const cssController = new AbortController();
    const cssTimeout = setTimeout(() => cssController.abort(), 5000);
    const cssRes = await fetch(`${BASE_URL}/pdf-styles`, { signal: cssController.signal });
    clearTimeout(cssTimeout);
    if (!cssRes.ok) throw new Error(`pdf-styles ${cssRes.status}`);
    css = await cssRes.text();
    console.log("Fetched /pdf-styles");
  } catch (e) {
    console.error("Failed to fetch /pdf-styles. Is the dev server running (pnpm dev)?", e.message);
    process.exit(1);
  }

  // Wrap HTML in .pdf-rendering for server doc (API and in-process use same structure)
  const wrappedHtml = `<div class="pdf-rendering">${html}</div>`;

  function getDefaultChromePath() {
    const platform = process.platform;
    if (platform === "darwin") return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (platform === "win32") return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    return "/usr/bin/google-chrome";
  }

  async function generatePdfInProcess() {
    const puppeteer = (await import("puppeteer-core")).default;
    const localPath = process.env.CHROME_EXECUTABLE_PATH || getDefaultChromePath();
    const launchWith = async (executablePath, args, headless) => {
      const browser = await puppeteer.launch({
        args,
        defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 1 },
        executablePath,
        headless,
      });
      const page = await browser.newPage();
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=816, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
  <style>${css}</style>
</head>
<body>${wrappedHtml}</body>
</html>`;
      await page.setContent(fullHtml, { waitUntil: "networkidle0", timeout: 20000 });
      const pdfBuffer = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" },
      });
      await browser.close();
      return pdfBuffer;
    };
    try {
      return await launchWith(localPath, puppeteer.defaultArgs().filter((a) => a !== "--headless" && !a.startsWith("--headless=")), true);
    } catch (localErr) {
      const chromium = (await import("@sparticuz/chromium")).default;
      const executablePath = await chromium.executablePath();
      return launchWith(executablePath, puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }), "shell");
    }
  }

  async function generatePdfViaApi() {
    const apiController = new AbortController();
    const apiTimeout = setTimeout(() => apiController.abort(), 60_000);
    const res = await fetch(`${BASE_URL}/api/export-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, css, filename: "preview-style-guide.pdf" }),
      signal: apiController.signal,
    });
    clearTimeout(apiTimeout);
    if (!res.ok) throw new Error(`export-pdf API ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }

  // Fallback: call API so Chrome runs in Next.js (same env as primary). No local Puppeteer needed.
  async function generatePdfFallbackViaApi() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    const res = await fetch(`${BASE_URL}/api/export-pdf-fallback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, css, filename: "preview-style-guide-fallback.pdf" }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`export-pdf-fallback API ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }

  let pdfBuffer;
  if (FALLBACK_ONLY) {
    try {
      pdfBuffer = await generatePdfFallbackViaApi();
    } catch (e) {
      console.error("Fallback PDF failed:", e.message);
      console.error("Ensure dev server is running and Chrome is available (PDF_USE_LOCAL_CHROME or CHROME_EXECUTABLE_PATH in .env).");
      process.exit(1);
    }
    console.log("PDF generated via html2pdf fallback (API)");
    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(OUTPUT_FILE_FALLBACK, pdfBuffer);
    console.log("PDF written to", OUTPUT_FILE_FALLBACK);
    return;
  }

  try {
    pdfBuffer = await generatePdfInProcess();
    console.log("PDF generated in-process (Chromium)");
  } catch (e) {
    console.log("Chromium launch failed (common on local macOS/ARM), trying /api/export-pdf:", e.message);
    pdfBuffer = await generatePdfViaApi();
    console.log("PDF generated via /api/export-pdf");
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, pdfBuffer);
  console.log("PDF written to", OUTPUT_FILE);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
