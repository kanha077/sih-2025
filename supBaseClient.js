import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "YOUR_SUPABASE_URL"; // Make sure your URL is here
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // Make sure your Key is here

// UPDATED: Added options object to use Local Storage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
});