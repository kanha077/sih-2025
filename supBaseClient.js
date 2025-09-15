import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Paste your actual URL and Key here
const SUPABASE_URL = "https://wraemxcqjycuddhfgjtt.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWVteGNxanljdWRkaGZnanR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDc2MTYsImV4cCI6MjA3MjkyMzYxNn0.QyBb8idQcPmWJUQ7sMorfmnGp7fZU6DpuA1U79KpgCQ";

// The rest of the file remains the same
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
});