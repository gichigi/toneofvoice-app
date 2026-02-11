import { NextResponse } from "next/server"
import puppeteer from "puppeteer-core"
import { getChromeLaunchOptions } from "@/lib/pdf-chrome"

// Allow longer run for PDF generation (cold start + render)
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
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=816, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
  <style>${css}</style>
</head>
<body><div class="pdf-rendering">${html}</div></body>
</html>`

    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 20000,
    })

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" },
    })

    await browser.close()
    browser = null

    const safeFilename =
      filename && typeof filename === "string"
        ? filename.replace(/[^a-zA-Z0-9._-]/g, "_")
        : "style-guide.pdf"

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
      },
    })
  } catch (err) {
    console.error("[export-pdf] PDF generation failed:", err)
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        console.error("[export-pdf] Error closing browser:", e)
      }
    }
    return NextResponse.json(
      { error: "PDF generation failed. Please try again." },
      { status: 500 }
    )
  }
}
