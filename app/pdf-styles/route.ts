import { NextResponse } from "next/server"

/**
 * Critical CSS for PDF export (Puppeteer and html2pdf fallback).
 * Kept in sync with #pdf-export-content, StyleGuideCover, and globals.css .pdf-rendering block.
 */
function getPdfCriticalCss(): string {
  return `
/* Minimal reset */
*, *::before, *::after { box-sizing: border-box; }

/* Container */
#pdf-export-content.preview-document {
  font-family: "Playfair Display", Georgia, serif;
}
#pdf-export-content h1,
#pdf-export-content h2,
#pdf-export-content h3,
#pdf-export-content h4,
#pdf-export-content h5,
#pdf-export-content h6 {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.style-guide-document {
  font-family: "Playfair Display", Georgia, serif;
}
.style-guide-document .trait-dos {
  border-left: 4px solid #10b981;
  background-color: rgba(239, 246, 252, 0.3);
  padding-left: 1rem;
}
.style-guide-document .trait-donts {
  border-left: 4px solid #ef4444;
  background-color: rgba(254, 242, 242, 0.3);
  padding-left: 1rem;
}
.style-guide-document .example-good {
  border-left: 4px solid #10b981;
  background-color: #f0fdf4;
  padding: 0.75rem;
  margin-top: 1rem;
}
.style-guide-document .example-bad {
  border-left: 4px solid #ef4444;
  background-color: #fef2f2;
  padding: 0.75rem;
  margin-top: 1rem;
}

/* PDF export visibility: hide spacer in PDF doc */
.pdf-exclude {
  display: none !important;
}
.pdf-only {
  display: block !important;
}

/* Font variable for cover title */
:root { --font-display: "Playfair Display", Georgia, serif; }

/* Layout / utilities used by cover and sections */
.min-h-\\[80vh\\] { min-height: 80vh; }
.min-h-\\[60vh\\] { min-height: 60vh; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.justify-center { justify-content: center; }
.items-center { align-items: center; }
.px-12 { padding-left: 3rem; padding-right: 3rem; }
.py-24 { padding-top: 6rem; padding-bottom: 6rem; }
.py-16 { padding-top: 4rem; padding-bottom: 4rem; }
.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.bg-white { background-color: #fff; }
.relative { position: relative; }
.overflow-hidden { overflow: hidden; }
.absolute { position: absolute; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.top-0 { top: 0; }
.right-0 { right: 0; }
.w-\\[50\\%\\] { width: 50%; }
.h-full { height: 100%; }
.pointer-events-none { pointer-events: none; }
.z-10 { z-index: 10; }
.max-w-3xl { max-width: 48rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.space-y-8 > * + * { margin-top: 2rem; }
.space-y-6 > * + * { margin-top: 1.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.space-y-1 > * + * { margin-top: 0.25rem; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.text-7xl { font-size: 4.5rem; line-height: 1; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.tracking-tight { letter-spacing: -0.025em; }
.tracking-tighter { letter-spacing: -0.05em; }
.text-gray-900 { color: #111827; }
.leading-\\[0\\.9\\] { line-height: 0.9; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-base { font-size: 1rem; }
.text-gray-500 { color: #6b7280; }
.text-gray-400 { color: #9ca3af; }
.font-medium { font-weight: 500; }
.uppercase { text-transform: uppercase; }
.tracking-widest { letter-spacing: 0.1em; }
.mb-4 { margin-bottom: 1rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-6 { margin-top: 1.5rem; }
.pt-6 { padding-top: 1.5rem; }
.pt-8 { padding-top: 2rem; }
.pt-12 { padding-top: 3rem; }
.text-center { text-align: center; }
.h-1 { height: 0.25rem; }
.w-24 { width: 6rem; }
.bg-gray-900 { background-color: #111827; }
.rounded-full { border-radius: 9999px; }
.border-t { border-top-width: 1px; border-top-style: solid; }
.border-gray-100 { border-color: #f3f4f6; }
.border-gray-200 { border-color: #e5e7eb; }
.scroll-mt-4 { scroll-margin-top: 1rem; }
.bg-gray-50\\/30 { background-color: rgba(249, 250, 251, 0.3); }
.bg-gray-100 { background-color: #f3f4f6; }
.text-gray-600 { color: #4b5563; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.min-h-\\[300px\\] { min-height: 300px; }
.h-\\[50vh\\] { height: 50vh; }
.shrink-0 { flex-shrink: 0; }

/* Cover page: fill the PDF page, force page break after */
#cover {
  page-break-after: always;
  break-after: page;
}
#cover > div {
  min-height: calc(100vh - 1in) !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  padding: 4rem 5rem !important;
  background-color: #fff !important;
  position: relative !important;
  overflow: hidden !important;
}

/* Cover title - match the on-page design */
#cover h1 {
  font-family: "Playfair Display", Georgia, serif !important;
  font-size: 8rem !important;
  font-weight: 700 !important;
  letter-spacing: -0.025em !important;
  line-height: 0.9 !important;
  color: #111827 !important;
  opacity: 1 !important;
  margin: 0 !important;
}

/* Cover eyebrow text */
#cover p[class*="uppercase"] {
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  color: #6b7280 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
  opacity: 1 !important;
}

/* Cover decorative line under title */
#cover div[class*="h-1"][class*="w-24"] {
  height: 0.25rem !important;
  width: 6rem !important;
  background-color: #111827 !important;
  border-radius: 9999px !important;
  opacity: 1 !important;
}

/* Cover metadata text */
#cover div[class*="pt-12"] p {
  font-size: 0.875rem !important;
  opacity: 1 !important;
}

/* Cover background gradient overlay */
#cover > div > div[class*="absolute"][class*="bg-gradient"] {
  position: absolute !important;
  background: linear-gradient(to left, rgba(249, 250, 251, 0.5), transparent) !important;
}

/* Cover grid pattern - simplify for PDF */
#cover > div > div[class*="absolute"][class*="inset-0"] {
  background: rgba(0, 0, 0, 0.015) !important;
  background-image: none !important;
}

/* Branding footer on cover */
#cover div[class*="border-t"] {
  border-top: 1px solid #e5e7eb !important;
}

/* Responsive overrides - Puppeteer viewport is 816px wide so md: breakpoint applies */
@media (min-width: 768px) {
  .md\\:px-20 { padding-left: 5rem; padding-right: 5rem; }
  .md\\:py-24 { padding-top: 6rem; padding-bottom: 6rem; }
  .md\\:text-9xl { font-size: 8rem; line-height: 1; }
  .md\\:text-8xl { font-size: 6rem; }
}

/* Page breaks: keep sections on same page; avoid splitting headings and trait/rule blocks */
#pdf-export-content .pdf-section {
  page-break-inside: avoid;
  break-inside: avoid;
}
h2, h3, .voice-trait, .rule-section {
  page-break-after: avoid;
  break-after: avoid;
}

/* PDF rendering overrides: animations off, fonts/colors solid (Puppeteer + fallback) */
.pdf-rendering .animate-pulse,
.pdf-rendering [class*="animate-in"] {
  animation: none !important;
  opacity: 1 !important;
}
.pdf-rendering #pdf-export-content h1,
.pdf-rendering #pdf-export-content h2,
.pdf-rendering #pdf-export-content h3,
.pdf-rendering #pdf-export-content h4,
.pdf-rendering #pdf-export-content h5,
.pdf-rendering #pdf-export-content h6,
.pdf-rendering h1,
.pdf-rendering h2,
.pdf-rendering h3,
.pdf-rendering h4,
.pdf-rendering h5,
.pdf-rendering h6 {
  font-family: "Playfair Display", Georgia, serif !important;
  color: #111827 !important;
  opacity: 1 !important;
}
.pdf-rendering [class*="bg-gradient-to-l"] {
  background: #f9fafb !important;
  background-image: none !important;
}
.pdf-rendering [class*="linear-gradient(to_right,#80808012"] {
  background-color: rgba(0, 0, 0, 0.03) !important;
  background-image: none !important;
}
.pdf-rendering .text-gray-500,
.pdf-rendering .text-gray-600,
.pdf-rendering .text-gray-400 {
  color: #4b5563 !important;
  opacity: 1 !important;
}
.pdf-rendering .text-gray-900 {
  color: #111827 !important;
  opacity: 1 !important;
}
`.trim()
}

export function GET() {
  const css = getPdfCriticalCss()
  return new NextResponse(css, {
    status: 200,
    headers: {
      "Content-Type": "text/css",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
