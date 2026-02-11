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

/* Layout / utilities used by cover and sections */
.min-h-\\[80vh\\] { min-height: 80vh; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.justify-center { justify-content: center; }
.px-12 { padding-left: 3rem; padding-right: 3rem; }
.py-24 { padding-top: 6rem; padding-bottom: 6rem; }
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
.max-w-3xl { max-width: 48rem; margin-left: auto; margin-right: auto; }
.mx-auto { margin-left: auto; margin-right: auto; }
.space-y-8 > * + * { margin-top: 2rem; }
.space-y-6 > * + * { margin-top: 1.5rem; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.space-y-1 > * + * { margin-top: 0.25rem; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.font-bold { font-weight: 700; }
.tracking-tight { letter-spacing: -0.025em; }
.text-gray-900 { color: #111827; }
.leading-\\[0\\.9\\] { line-height: 0.9; }
.text-sm { font-size: 0.875rem; }
.text-gray-500 { color: #6b7280; }
.font-medium { font-weight: 500; }
.uppercase { text-transform: uppercase; }
.tracking-widest { letter-spacing: 0.1em; }
.mb-4 { margin-bottom: 1rem; }
.pt-12 { padding-top: 3rem; }
.h-1 { height: 0.25rem; }
.w-24 { width: 6rem; }
.rounded-full { border-radius: 9999px; }
.border-t { border-top-width: 1px; }
.border-gray-100 { border-color: #f3f4f6; }
.scroll-mt-4 { scroll-margin-top: 1rem; }
.px-12 { padding-left: 3rem; padding-right: 3rem; }
.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
.bg-gray-50\\/30 { background-color: rgba(249, 250, 251, 0.3); }
.border-gray-200 { border-color: #e5e7eb; }
.bg-gray-100 { background-color: #f3f4f6; }
.text-gray-600 { color: #4b5563; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.mt-2 { margin-top: 0.5rem; }
.min-h-\\[300px\\] { min-height: 300px; }
.h-\\[50vh\\] { height: 50vh; }
.shrink-0 { flex-shrink: 0; }
@media (min-width: 768px) {
  .md\\:px-20 { padding-left: 5rem; padding-right: 5rem; }
  .md\\:py-24 { padding-top: 6rem; padding-bottom: 6rem; }
  .md\\:text-8xl { font-size: 6rem; }
}
.py-16 { padding-top: 4rem; padding-bottom: 4rem; }

/* Page breaks: avoid splitting headings and trait/rule blocks */
h2, h3, .voice-trait, .rule-section {
  page-break-after: avoid;
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
