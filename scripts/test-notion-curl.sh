#!/bin/bash
# Test full style guide generation for notion.com via curl
# Requires: dev server running (pnpm dev --port 3002)
# Token stats: check dev server terminal for TOKEN USAGE SUMMARY logs

BASE="${BASE:-http://localhost:3002}"
echo "=============================================="
echo "NOTION.COM STYLE GUIDE GENERATION TEST"
echo "=============================================="
echo "Base URL: $BASE"
echo ""

# Step 1: Extract
echo "Step 1: Extract brand info from notion.com..."
START_EXTRACT=$(date +%s.%N)
EXTRACT=$(curl -s -X POST "$BASE/api/extract-website" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://notion.so"}')
END_EXTRACT=$(date +%s.%N)
EXTRACT_TIME=$(echo "$END_EXTRACT - $START_EXTRACT" | bc)

if ! echo "$EXTRACT" | jq -e '.success == true' >/dev/null 2>&1; then
  echo "  FAILED: $(echo "$EXTRACT" | jq -r '.error // .message // .')"
  exit 1
fi

BRAND=$(echo "$EXTRACT" | jq -c '{
  name: .brandName,
  brandDetailsDescription: .brandDetailsDescription,
  audience: .audience,
  keywords: .keywords,
  traits: .suggestedTraits[0:3]
}')
echo "  OK (${EXTRACT_TIME}s) | Brand: $(echo "$BRAND" | jq -r '.name')"
echo "  Traits: $(echo "$BRAND" | jq -r '.traits | join(", ")')"
echo ""

# Step 2: Generate full guide
echo "Step 2: Generate full style guide..."
START_GEN=$(date +%s.%N)
GUIDE=$(curl -s -X POST "$BASE/api/generate-styleguide" \
  -H "Content-Type: application/json" \
  -d "{\"brandDetails\": $BRAND}")
END_GEN=$(date +%s.%N)
GEN_TIME=$(echo "$END_GEN - $START_GEN" | bc)

if ! echo "$GUIDE" | jq -e '.success == true' >/dev/null 2>&1; then
  echo "  FAILED: $(echo "$GUIDE" | jq -r '.error // .message // .')"
  exit 1
fi

LEN=$(echo "$GUIDE" | jq -r '.styleGuide | length')
echo "  OK (${GEN_TIME}s) | Output: $LEN chars"
echo ""

# Step 3: Verify sections
echo "Step 3: Sections"
echo "$GUIDE" | jq -r '.styleGuide' | grep -E '^## ' | sed 's/^/  /'
echo ""

# Summary
TOTAL=$(echo "$EXTRACT_TIME + $GEN_TIME" | bc)
echo "=============================================="
echo "SUMMARY"
echo "=============================================="
echo "  Extraction:    ${EXTRACT_TIME}s"
echo "  Generation:   ${GEN_TIME}s"
echo "  Total:        ${TOTAL}s"
echo "  Guide length: $LEN chars"
echo ""
echo "  Token stats: check dev server terminal for TOKEN USAGE SUMMARY"
echo "  (each API call logs prompt + completion tokens per model)"
