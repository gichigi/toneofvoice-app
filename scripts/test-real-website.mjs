/**
 * Test style guide generation with a REAL website.
 * Run: node scripts/test-real-website.mjs <url>
 * Example: node scripts/test-real-website.mjs https://linear.app
 * Requires: dev server (pnpm dev) and OPENAI_API_KEY
 */

import { config } from "dotenv";
import { writeFileSync } from "fs";

config();

const BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:3002");

const URL = process.argv[2] || "https://linear.app";
const FETCH_TIMEOUT_MS = 240_000; // 4 min for full style guide generation

function timeoutFetch(url, options) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: ctrl.signal }).then((res) => {
    clearTimeout(t);
    return res;
  });
}

async function main() {
  console.log("=".repeat(60));
  console.log("REAL WEBSITE STYLE GUIDE TEST");
  console.log("=".repeat(60));
  console.log("URL:", URL);
  console.log("");

  // 1. Extract from website
  console.log("Step 1: Extracting brand info from website...");
  let brandDetails;
  try {
    const res = await timeoutFetch(`${BASE}/api/extract-website`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: URL }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || data.message || "Extraction failed");
    brandDetails = {
      name: data.brandName || "Unknown",
      brandDetailsDescription: data.brandDetailsDescription || "",
      audience: data.audience || "",
      keywords: Array.isArray(data.keywords) ? data.keywords : (data.keywords || "").split(",").map((k) => k.trim()).filter(Boolean).slice(0, 25),
      traits: Array.isArray(data.suggestedTraits) ? data.suggestedTraits.slice(0, 3) : [],
      productsServices: Array.isArray(data.productsServices) ? data.productsServices : [],
    };
    console.log("  ✅ Extracted:", brandDetails.name);
    console.log("  Description length:", brandDetails.brandDetailsDescription?.length || 0, "chars");
    console.log("  Keywords:", brandDetails.keywords?.length || 0);
    console.log("  Products/Services:", brandDetails.productsServices?.length || 0);
    console.log("  Audience:", (brandDetails.audience || "").slice(0, 60) + "...");
    console.log("  Traits:", brandDetails.traits?.join(", ") || "none");
  } catch (e) {
    console.error("  ❌ Extraction failed:", e.message);
    process.exit(1);
  }

  // 2. Preview
  console.log("\nStep 2: Generating preview...");
  let preview;
  try {
    const res = await timeoutFetch(`${BASE}/api/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandDetails,
        selectedTraits: brandDetails.traits?.length ? brandDetails.traits : ["Clear & Direct", "Professional"],
      }),
    });
    const data = await res.json();
    if (!data.success || !data.preview) throw new Error(data.error || "No preview");
    preview = data.preview;
    console.log("  ✅ Preview:", data.duration, "|", preview.length, "chars");
  } catch (e) {
    console.error("  ❌ Preview failed:", e.message);
    preview = null;
  }

  // 3. Full generation
  console.log("\nStep 3: Generating full style guide...");
  let fullGuide;
  try {
    const res = await timeoutFetch(`${BASE}/api/generate-styleguide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandDetails: {
          ...brandDetails,
          traits: brandDetails.traits?.length ? brandDetails.traits : ["Clear & Direct", "Professional"],
        },
      }),
    });
    const data = await res.json();
    if (!data.success || !data.styleGuide) throw new Error(data.error || data.message || "No style guide");
    fullGuide = data.styleGuide;
    console.log("  ✅ Full guide:", fullGuide.length, "chars");
  } catch (e) {
    console.error("  ❌ Full generation failed:", e.message);
    fullGuide = null;
  }

  // 4. Honest evaluation
  console.log("\n" + "=".repeat(60));
  console.log("HONEST QUALITY EVALUATION");
  console.log("=".repeat(60));

  const evalPoints = [];
  let score = 0;
  const maxScore = 10;

  const descLen = brandDetails.brandDetailsDescription?.length || 0;
  if (descLen < 50) {
    evalPoints.push("⚠️  Extraction: Description is thin (<50 chars). Website may be hard to scrape or content-light.");
  } else if (descLen >= 400) {
    evalPoints.push("✓  Extraction: Description is full (3-6 paragraphs, " + descLen + " chars).");
    score += 1;
  } else {
    evalPoints.push("✓  Extraction: Description has sufficient detail (" + descLen + " chars).");
    score += 1;
  }

  const kwCount = brandDetails.keywords?.length || 0;
  if (kwCount >= 15) {
    evalPoints.push("✓  Extraction: Keywords rich (" + kwCount + ").");
  } else if (kwCount >= 5) {
    evalPoints.push("✓  Extraction: Keywords present (" + kwCount + ").");
  }

  const psCount = brandDetails.productsServices?.length || 0;
  if (psCount > 0) {
    evalPoints.push("✓  Extraction: Products/Services present (" + psCount + ").");
  }

  if (preview) {
    const p = preview;
    const brandNameMentions = (p.match(new RegExp(brandDetails.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length;
    const isGeneric = /general audience|your brand|innovative company/i.test(p) && !brandNameMentions;
    if (isGeneric) {
      evalPoints.push("⚠️  Preview: Feels generic. Brand name and specifics may be underused.");
    } else {
      evalPoints.push("✓  Preview: Brand-specific language present.");
      score += 2;
    }
    const hasAudience = /audience|primary|secondary/i.test(p);
    const hasGuidelines = /short-form|long-form|content guidelines/i.test(p);
    if (hasAudience && hasGuidelines) {
      evalPoints.push("✓  Preview: Expected sections (Audience, Content Guidelines) present.");
      score += 1;
    }
  }

  if (fullGuide) {
    const g = fullGuide;
    const has25Rules = (g.match(/###\s+\d+\./g) || []).length >= 20;
    const hasBeforeAfter = /before|after/i.test(g) && /\*\*Before:\*\*|\*\*After:\*\*/i.test(g);
    const hasWordList = /preferred terms|avoid terms|word list/i.test(g);
    if (has25Rules) {
      evalPoints.push("✓  Full: Style rules appear complete (~25 categories).");
      score += 2;
    } else {
      evalPoints.push("⚠️  Full: Style rules count may be low. Check rule structure.");
    }
    if (hasBeforeAfter) {
      evalPoints.push("✓  Full: Before/After examples present.");
      score += 1;
    } else {
      evalPoints.push("⚠️  Full: Before/After format may be off.");
    }
    if (hasWordList) {
      evalPoints.push("✓  Full: Word list section present.");
      score += 1;
    }
  }

  const actionability = fullGuide && /do\s+not|avoid|use\s+|don't|never\s+/i.test(fullGuide);
  if (actionability) {
    evalPoints.push("✓  Actionability: Clear do's/don'ts present.");
    score += 1;
  } else if (fullGuide) {
    evalPoints.push("⚠️  Actionability: Could use more explicit do/don't guidance.");
  }

  const repetitive = fullGuide && fullGuide.split(/\s+/).filter((w) => w.length > 5).length < 500;
  if (repetitive && fullGuide) {
    evalPoints.push("⚠️  Length: Full guide may be thin or repetitive.");
  } else if (fullGuide) {
    evalPoints.push("✓  Length: Full guide has substantial content.");
    score += 1;
  }

  evalPoints.forEach((p) => console.log(p));
  console.log("");
  console.log("Score:", score, "/", maxScore, score >= 7 ? "— Good" : score >= 5 ? "— Acceptable" : "— Needs work");
  console.log("=".repeat(60));

  // Save output
  const outPath = "style-guide-real-website-output.md";
  writeFileSync(
    outPath,
    [
      "# Real Website Style Guide Test",
      `**URL:** ${URL}`,
      `**Brand:** ${brandDetails.name}`,
      `**Extracted at:** ${new Date().toISOString()}`,
      "",
      "## Extracted Brand Details",
      "```json",
      JSON.stringify(brandDetails, null, 2),
      "```",
      "",
      "## Preview",
      preview ? "```markdown\n" + preview + "\n```" : "(failed)",
      "",
      "## Full Guide",
      fullGuide ? "```markdown\n" + fullGuide + "\n```" : "(failed)",
    ].join("\n")
  );
  console.log("\nOutput saved to", outPath);

  process.exit(preview && fullGuide ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
