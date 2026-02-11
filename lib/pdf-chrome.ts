/**
 * Shared Chrome/Chromium launch options for PDF export (primary and fallback).
 * Use local Chrome when not on Vercel: set CHROME_EXECUTABLE_PATH or PDF_USE_LOCAL_CHROME=true.
 */
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

export function getDefaultChromePath(): string {
  const platform = process.platform
  if (platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  }
  if (platform === "win32") {
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  }
  return "/usr/bin/google-chrome"
}

export async function getChromeLaunchOptions(): Promise<{
  executablePath: string
  args: string[]
  headless: boolean | "shell"
}> {
  const useLocal =
    process.env.VERCEL !== "1" &&
    (process.env.CHROME_EXECUTABLE_PATH || process.env.PDF_USE_LOCAL_CHROME === "true")

  if (useLocal) {
    const path = process.env.CHROME_EXECUTABLE_PATH || getDefaultChromePath()
    return {
      executablePath: path,
      args: puppeteer.defaultArgs().filter((a) => a !== "--headless" && !a.startsWith("--headless=")),
      headless: true,
    }
  }
  const executablePath = await chromium.executablePath()
  return {
    executablePath,
    args: puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    headless: "shell" as const,
  }
}
