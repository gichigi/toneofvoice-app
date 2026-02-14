import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);

// Query the schema to see plan_type constraint
const { data, error } = await sb.rpc('exec_sql', {
  query: `
    SELECT constraint_name, check_clause
    FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%plan_type%'
  `
}).catch(() => ({ data: null, error: "RPC not available" }));

// Alternative: just try to read the table definition
const { data: guides } = await sb.from("style_guides").select("plan_type").limit(5);
console.log("Existing plan_type values:", guides?.map(g => g.plan_type));
