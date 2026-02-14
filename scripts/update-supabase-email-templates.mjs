/**
 * Update Supabase auth email templates (confirm signup, reset password) via Management API.
 * Requires SUPABASE_ACCESS_TOKEN in .env (get from https://supabase.com/dashboard/account/tokens).
 * Project ref is read from NEXT_PUBLIC_SUPABASE_URL.
 */

import "dotenv/config";

const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https:\/\//, "").split(".")[0];
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const BASE = "https://api.supabase.com/v1/projects";

if (!PROJECT_REF) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env");
  process.exit(1);
}
if (!ACCESS_TOKEN) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN in .env. Get a personal access token from https://supabase.com/dashboard/account/tokens"
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

// API uses flat keys: mailer_subjects_* and mailer_templates_*_content
const patchBody = {
  mailer_subjects_confirmation: "Confirm your email for Tone of Voice App",
  mailer_subjects_recovery: "Reset your Tone of Voice App password",
  mailer_templates_confirmation_content: `<h2>Confirm your email</h2>
<p>Thanks for signing up for Tone of Voice App!</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
<br>
<p style="color: #666;">- The Tone of Voice App Team</p>`,
  mailer_templates_recovery_content: `<h2>Reset your password</h2>
<p>You requested to reset your password for Tone of Voice App.</p>
<p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<br>
<p style="color: #666;">- The Tone of Voice App Team</p>`,
};

async function main() {
  const patchRes = await fetch(`${BASE}/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patchBody),
  });
  if (!patchRes.ok) {
    const t = await patchRes.text();
    console.error("PATCH auth config failed:", patchRes.status, t);
    process.exit(1);
  }
  console.log("Email templates updated: Confirm signup, Reset password.");
}

main();
