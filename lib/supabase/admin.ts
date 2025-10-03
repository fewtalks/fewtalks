import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn("Supabase admin environment variables are not configured. Please add them to .env.local");
  // Return a mock client for development
  supabaseAdmin = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  };
} else {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
}

export { supabaseAdmin };

