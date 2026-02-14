import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing env vars"); process.exit(1); }

const sb = createClient(url, key);

const { data: users } = await sb.auth.admin.listUsers();
const user = users?.users?.find(u => u.email === "gichigi@me.com");
if (!user) { console.log("User not found"); process.exit(1); }
console.log("User ID:", user.id);
console.log("Email:", user.email);

const { data: profile } = await sb.from("profiles")
  .select("subscription_tier, guides_limit")
  .eq("id", user.id)
  .single();
console.log("Profile:", profile);

const { data: guides, error } = await sb.from("style_guides")
  .select("id, title, brand_name, plan_type, created_at, updated_at")
  .eq("user_id", user.id)
  .order("updated_at", { ascending: false });

if (error) { console.error("Error:", error); process.exit(1); }
console.log("\nGuides found:", guides?.length || 0);
guides?.forEach(g => {
  console.log(`  - "${g.title}" | plan: ${g.plan_type} | brand: ${g.brand_name} | created: ${g.created_at} | updated: ${g.updated_at}`);
});
