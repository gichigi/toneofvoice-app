/**
 * Tests brand voice style guide generation (preview + full).
 * Run with: pnpm test:style-guide-gen [--save]
 * --save  Write generated preview and full guide to style-guide-test-output.md
 * Requires: dev server (pnpm dev) and OPENAI_API_KEY in .env
 */

import { config } from "dotenv";
import { writeFileSync } from "fs";

config();
const SAVE_OUTPUT = process.argv.includes("--save");

// Allow long runs for full generation (~30-60s)
const FETCH_TIMEOUT_MS = 120_000;

const BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:3002");

const TEST_BRAND = {
  name: "Luna Coffee",
  brandDetailsDescription: "Specialty coffee roaster in Portland. We source single-origin beans from small farms and roast in small batches. Target audience: coffee enthusiasts, remote workers, and locals who value quality over convenience.",
  audience: "Coffee enthusiasts, remote workers, and quality-focused millennials",
  websiteUrl: "https://lunacoffee.co",
};

async function runTest(name, fn) {
  process.stdout.write(`\n${name}... `);
  try {
    const result = await fn();
    console.log("✅");
    return { ok: true, result };
  } catch (e) {
    console.log("❌", e.message);
    return { ok: false, error: e.message };
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("STYLE GUIDE GENERATION TEST");
  console.log("=".repeat(60));
  console.log(`Base URL: ${BASE}`);
  console.log(`Brand: ${TEST_BRAND.name}`);
  console.log(`Description: ${TEST_BRAND.brandDetailsDescription.slice(0, 80)}...`);

  const results = { preview: null, full: null };

  // 1. Preview (traits + audience + content guidelines)
  results.preview = await runTest("Preview API (traits + audience + content guidelines)", async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${BASE}/api/preview`, {
      signal: ctrl.signal,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandDetails: TEST_BRAND,
        selectedTraits: ["Friendly & Approachable", "Clear & Direct"],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.details || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.success || !data.preview) throw new Error("No preview in response");
    clearTimeout(t);
    return { duration: data.duration, length: data.preview?.length || 0, preview: data.preview };
  });

  // 2. Full generation (all sections including style rules, before/after, word list)
  results.full = await runTest("Full generate-styleguide API", async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${BASE}/api/generate-styleguide`, {
      signal: ctrl.signal,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandDetails: {
          ...TEST_BRAND,
          traits: ["Friendly & Approachable", "Clear & Direct"],
        },
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.success || !data.styleGuide) throw new Error("No styleGuide in response");
    clearTimeout(t);
    return { length: data.styleGuide?.length || 0, styleGuide: data.styleGuide };
  });

  // Report
  console.log("\n" + "-".repeat(60));
  if (results.preview?.ok) {
    console.log("Preview:", results.preview.result.duration, "|", results.preview.result.length, "chars");
    const p = results.preview.result.preview || "";
    const hasAbout = /about|luna coffee/i.test(p);
    const hasAudience = /audience|your audience/i.test(p);
    const hasContent = /content guidelines|short-form|long-form/i.test(p);
    const hasVoice = /brand voice|voice/i.test(p);
    const hasLocked = /_Unlock to see/i.test(p);
    console.log("  Sections present: About=" + hasAbout + " Audience=" + hasAudience + " Content Guidelines=" + hasContent + " Brand Voice=" + hasVoice + " Locked placeholders=" + hasLocked);
  }
  if (results.full?.ok) {
    console.log("Full guide:", results.full.result.length, "chars");
    const g = results.full.result.styleGuide || "";
    const hasRules = /style rules|25|rules/i.test(g);
    const hasBeforeAfter = /before|after/i.test(g);
    const hasWordList = /word list|preferred terms|avoid/i.test(g);
    console.log("  Sections present: Style Rules=" + hasRules + " Before/After=" + hasBeforeAfter + " Word List=" + hasWordList);
  }
  console.log("-".repeat(60));

  if (SAVE_OUTPUT && (results.preview?.ok || results.full?.ok)) {
    const out = [
      "# Style Guide Generation Test Output",
      `**Generated:** ${new Date().toISOString()}`,
      `**Brand:** ${TEST_BRAND.name}`,
      "",
      "## Preview",
      results.preview?.ok ? "```markdown\n" + (results.preview.result.preview || "") + "\n```" : "(failed)",
      "",
      "## Full Guide",
      results.full?.ok ? "```markdown\n" + (results.full.result.styleGuide || "") + "\n```" : "(failed)",
    ].join("\n");
    writeFileSync("style-guide-test-output.md", out);
    console.log("\nOutput saved to style-guide-test-output.md");
  }

  const allOk = results.preview?.ok && results.full?.ok;
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
