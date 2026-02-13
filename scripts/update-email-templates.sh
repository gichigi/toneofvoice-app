#!/bin/bash
#
# Update Supabase email templates via Management API
# Usage: ./scripts/update-email-templates.sh
#

set -e

# Load .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Extract project ref from Supabase URL
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  SUPABASE_PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
fi

# Check if required env vars are set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN not set in .env"
  echo ""
  echo "To fix:"
  echo "1. Go to: https://supabase.com/dashboard/account/tokens"
  echo "2. Generate a new access token"
  echo "3. Add to .env: SUPABASE_ACCESS_TOKEN=your-token"
  exit 1
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "Error: Could not determine project ref from NEXT_PUBLIC_SUPABASE_URL"
  exit 1
fi

# Read HTML templates
RECOVERY_CONTENT=$(cat supabase/templates/recovery.html)
CONFIRMATION_CONTENT=$(cat supabase/templates/confirmation.html)

echo "Updating email templates for project: $SUPABASE_PROJECT_REF"

# Update email templates
curl -X PATCH "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"mailer_subjects_recovery\": \"Reset your Tone of Voice password\",
    \"mailer_templates_recovery_content\": $(echo "$RECOVERY_CONTENT" | jq -Rs .),
    \"mailer_subjects_confirmation\": \"Confirm your email for Tone of Voice\",
    \"mailer_templates_confirmation_content\": $(echo "$CONFIRMATION_CONTENT" | jq -Rs .)
  }"

echo ""
echo "✓ Email templates updated successfully!"
