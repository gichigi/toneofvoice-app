/**
 * PDF export using html2pdf.js (same as client fallback when primary API fails).
 * Uses same Chrome as primary; call from script with FALLBACK_ONLY=1 so Chrome runs in Next.js, not locally.
 */
import { NextResponse } from "next/server"
import puppeteer from "puppeteer-core"
import { getChromeLaunchOptions } from "@/lib/pdf-chrome"

export const maxDuration = 60

export async function POST(request: Request) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    const body = await request.json()
    const { html, css, filename } = body as { html?: string; css?: string; filename?: string }

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid body: html is required" },
        { status: 400 }
      )
    }
    if (!css || typeof css !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid body: css is required" },
        { status: 400 }
      )
    }

    const { executablePath, args, headless } = await getChromeLaunchOptions()
    browser = await puppeteer.launch({
      args,
      defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 1 },
      executablePath,
      headless,
    })

    const page = await browser.newPage()
    const fullPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=816, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
  <style>${css}</style>
</head>
<body><div class="pdf-rendering">${html}</div>
<script src="https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"><\/script>
</body>
</html>`

    await page.setContent(fullPageHtml, { waitUntil: "networkidle0", timeout: 20000 })

    const dataUrl = await page.evaluate(async () => {
      await document.fonts.ready
      const el = document.getElementById("pdf-export-content")
      if (!el || typeof (window as unknown as { html2pdf?: () => unknown }).html2pdf !== "function") {
        throw new Error("html2pdf or #pdf-export-content missing")
      }
      const html2pdf = (window as unknown as { html2pdf: (opts?: object) => { set: (o: object) => { from: (el: HTMLElement) => { outputPdf: () => { get: (k: string) => Promise<{ output: (t: string) => string }> } } } } }).html2pdf
      const opt = {
        margin: 0.5,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          logging: false,
          onclone: (_doc: Document, cloneEl: HTMLElement) => {
            cloneEl.classList.add("pdf-rendering")
          },
        },
        jsPDF: { unit: "in" as const, format: "letter" as const, orientation: "portrait" as const },
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"] as const,
          avoid: ["h2", "h3", ".voice-trait", ".rule-section"],
        },
      }
      const pdf = await html2pdf().set(opt).from(el).outputPdf().get("pdf")
      return pdf.output("datauristring")
    })

    await browser.close()
    browser = null

    const base64 = dataUrl.split(",")[1]
    if (!base64) {
      return NextResponse.json({ error: "Fallback PDF: no base64 in data URL" }, { status: 500 })
    }
    const pdfBuffer = Buffer.from(base64, "base64")

    const safeFilename =
      filename && typeof filename === "string"
        ? filename.replace(/[^a-zA-Z0-9._-]/g, "_")
        : "style-guide-fallback.pdf"

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[export-pdf-fallback] PDF generation failed:", message, err)
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        console.error("[export-pdf-fallback] Error closing browser:", e)
      }
    }
    return NextResponse.json(
      {
        error: "Fallback PDF generation failed.",
        detail: message,
        hint: "Ensure Chrome is available (CHROME_EXECUTABLE_PATH or PDF_USE_LOCAL_CHROME in .env).",
      },
      { status: 500 }
    )
  }
}
