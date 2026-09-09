import { createClient } from '@supabase/supabase-js';

// Client-side Supabase instance — safe to use in the browser.
// Uses the public anon key, which is meant to be public; row-level security
// in schema.sql is what actually protects the data.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
