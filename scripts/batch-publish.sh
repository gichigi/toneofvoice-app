#!/bin/bash

# Batch Blog Post Publisher
# Usage: ./scripts/batch-publish.sh [batch-number] [--dry-run] [--delay=seconds]
# Example: ./scripts/batch-publish.sh 1 --dry-run --delay=3

set -e

BATCH_NUM="${1}"
DRY_RUN=false
DELAY=3
BASE_URL="${BASE_URL:-http://localhost:3002}"
ADMIN_PASSWORD="${ADMIN_BLOG_PASSWORD}"
LOG_FILE="scripts/batch-publish.log"
PLAN_FILE="scripts/batch-publishing-plan.md"
CONTENT_PLAN_FILE="scripts/content-batch-plan.md"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --delay=*)
      DELAY="${arg#*=}"
      shift
      ;;
    *)
      ;;
  esac
done

if [ -z "$BATCH_NUM" ]; then
  echo "Usage: $0 [batch-number] [--dry-run] [--delay=seconds]"
  echo ""
  echo "Batch numbers:"
  echo "  1 - Launch Hubs & Core Definitions"
  echo "  2 - Templates & Documentation"
  echo "  3 - Examples & Comparisons"
  echo "  4 - Brand Breakdowns & Strategy"
  echo "  5 - Channel & Support Intents"
  echo ""
  echo "Options:"
  echo "  --dry-run    Test without publishing (publish=false)"
  echo "  --delay=N    Delay between posts in seconds (default: 3)"
  exit 1
fi

# Initialize log file
echo "=== Batch $BATCH_NUM Publishing Started: $(date) ===" >> "$LOG_FILE"
if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN MODE - Posts will not be published" >> "$LOG_FILE"
fi

# Cookie jar file
COOKIE_JAR=$(mktemp)
trap "rm -f $COOKIE_JAR" EXIT

# Login
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"$ADMIN_PASSWORD\"}")

if ! echo "$LOGIN_RESPONSE" | grep -q "success"; then
  echo "❌ Login failed: $LOGIN_RESPONSE"
  echo "❌ Login failed: $LOGIN_RESPONSE" >> "$LOG_FILE"
  exit 1
fi

echo "✅ Login successful"
echo "✅ Login successful" >> "$LOG_FILE"

# Extract topics from batch plan
extract_batch_topics() {
  local batch_num=$1
  local topics=()
  
  # First, try to extract from content-batch-plan.md (more structured)
  if [ -f "$CONTENT_PLAN_FILE" ]; then
    local in_batch=false
    while IFS= read -r line; do
      # Detect batch section start
      if [[ "$line" =~ ^###\ Batch\ $batch_num ]]; then
        in_batch=true
        continue
      fi
      
      # Stop at next batch
      if [[ "$in_batch" = true ]] && [[ "$line" =~ ^###\ Batch ]]; then
        break
      fi
      
      # Extract from table rows
      if [[ "$in_batch" = true ]] && [[ "$line" =~ ^\| ]]; then
        # Skip header and separator rows
        if [[ "$line" =~ \#.*\| ]] || [[ "$line" =~ ^\|.*--- ]]; then
          continue
        fi
        
        # Parse pipe-separated values
        IFS='|' read -ra fields <<< "$line"
        if [ ${#fields[@]} -ge 4 ]; then
          local title=$(echo "${fields[3]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
          if [ -n "$title" ] && [[ ! "$title" =~ Working\ Title ]] && [[ ! "$title" =~ ^[[:space:]]*$ ]]; then
            topics+=("$title")
          fi
        fi
      fi
    done < "$CONTENT_PLAN_FILE"
  fi
  
  # Fallback: extract from batch-publishing-plan.md (less structured)
  if [ ${#topics[@]} -eq 0 ] && [ -f "$PLAN_FILE" ]; then
    local in_batch=false
    while IFS= read -r line; do
      # Detect batch start
      if [[ "$line" =~ ^###\ Batch\ $batch_num ]]; then
        in_batch=true
        continue
      fi
      
      # Stop at next batch
      if [[ "$in_batch" = true ]] && [[ "$line" =~ ^###\ Batch ]]; then
        break
      fi
      
      # Extract topics from "Posts:" line
      if [[ "$in_batch" = true ]] && [[ "$line" =~ Posts:\ (.+) ]]; then
        local posts_line="${BASH_REMATCH[1]}"
        # Split by comma and clean up
        IFS=',' read -ra POSTS <<< "$posts_line"
        for post in "${POSTS[@]}"; do
          post=$(echo "$post" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
          if [ -n "$post" ]; then
            topics+=("$post")
          fi
        done
      fi
    done < "$PLAN_FILE"
  fi
  
  printf '%s\n' "${topics[@]}"
}

# Get topics for this batch
echo "📋 Extracting topics for Batch $BATCH_NUM..."
TOPICS=($(extract_batch_topics "$BATCH_NUM"))

if [ ${#TOPICS[@]} -eq 0 ]; then
  echo "❌ No topics found for Batch $BATCH_NUM"
  echo "   Please check:"
  echo "   - $CONTENT_PLAN_FILE (preferred - structured table format)"
  echo "   - $PLAN_FILE (fallback - less structured)"
  exit 1
fi

echo "✅ Found ${#TOPICS[@]} topics"
echo "✅ Found ${#TOPICS[@]} topics" >> "$LOG_FILE"

# Generate keywords from topic (simple extraction)
generate_keywords() {
  local topic="$1"
  # Convert to lowercase, replace spaces/punctuation with commas
  echo "$topic" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/ /g' | tr -s ' ' | sed 's/ /, /g'
}

# Publish each topic
SUCCESSFUL=0
FAILED=0
SKIPPED=0
TOTAL=${#TOPICS[@]}

for i in "${!TOPICS[@]}"; do
  TOPIC="${TOPICS[$i]}"
  KEYWORDS=$(generate_keywords "$TOPIC")
  INDEX=$((i + 1))
  
  echo ""
  echo "[$INDEX/$TOTAL] Processing: \"$TOPIC\""
  echo "[$INDEX/$TOTAL] Processing: \"$TOPIC\"" >> "$LOG_FILE"
  
  # Build request body
  PUBLISH_VALUE="false"
  if [ "$DRY_RUN" = false ]; then
    PUBLISH_VALUE="true"
  fi
  
  BODY="{\"topic\": \"$TOPIC\", \"publish\": $PUBLISH_VALUE"
  if [ -n "$KEYWORDS" ]; then
    KEYWORDS_JSON=$(echo "$KEYWORDS" | sed 's/,/","/g' | sed 's/^/["/' | sed 's/$/"]/')
    BODY="$BODY, \"keywords\": $KEYWORDS_JSON"
  fi
  BODY="$BODY}"
  
  # Make API call
  RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/blog/generate" \
    -H "Content-Type: application/json" \
    -d "$BODY")
  
  # Check response
  if echo "$RESPONSE" | grep -q "\"success\":true"; then
    SLUG=$(echo "$RESPONSE" | grep -o '"slug":"[^"]*' | cut -d'"' -f4 || echo "unknown")
    TITLE=$(echo "$RESPONSE" | grep -o '"title":"[^"]*' | cut -d'"' -f4 || echo "$TOPIC")
    
    echo "  ✅ Success: $TITLE"
    echo "  🔗 Slug: $SLUG"
    echo "  ✅ Success: $TITLE (slug: $SLUG)" >> "$LOG_FILE"
    SUCCESSFUL=$((SUCCESSFUL + 1))
  elif echo "$RESPONSE" | grep -q "already exists\|duplicate\|409"; then
    echo "  ⚠️  Skipped (duplicate slug)"
    echo "  ⚠️  Skipped (duplicate slug)" >> "$LOG_FILE"
    SKIPPED=$((SKIPPED + 1))
  else
    ERROR_MSG=$(echo "$RESPONSE" | grep -o '"error":"[^"]*' | cut -d'"' -f4 || echo "$RESPONSE")
    echo "  ❌ Failed: $ERROR_MSG"
    echo "  ❌ Failed: $ERROR_MSG" >> "$LOG_FILE"
    FAILED=$((FAILED + 1))
  fi
  
  # Rate limiting (except for last item)
  if [ $INDEX -lt $TOTAL ]; then
    echo "  ⏳ Waiting ${DELAY} seconds..."
    sleep "$DELAY"
  fi
done

# Summary
echo ""
echo "=========================================="
echo "🎉 Batch $BATCH_NUM Complete!"
echo "=========================================="
echo "✅ Successful: $SUCCESSFUL"
echo "⚠️  Skipped: $SKIPPED"
echo "❌ Failed: $FAILED"
echo "📊 Total: $TOTAL"
echo ""
echo "Full log: $LOG_FILE"

echo "" >> "$LOG_FILE"
echo "=== Batch $BATCH_NUM Summary ===" >> "$LOG_FILE"
echo "✅ Successful: $SUCCESSFUL" >> "$LOG_FILE"
echo "⚠️  Skipped: $SKIPPED" >> "$LOG_FILE"
echo "❌ Failed: $FAILED" >> "$LOG_FILE"
echo "📊 Total: $TOTAL" >> "$LOG_FILE"
echo "=== Batch $BATCH_NUM Completed: $(date) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

