import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.warn("Supabase client environment variables are not configured. Please add them to .env.local");
    // Return a mock client for development
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null } }),
        signInWithOAuth: () => Promise.resolve({ data: { url: null }, error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as any;
  }

  return createBrowserClient(supabaseUrl, anonKey);
}

