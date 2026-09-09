import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY client. Uses the service role key, which bypasses row-level
// security — that's exactly why it must never be imported into any file
// that ships to the browser. Only used inside /pages/api/*.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
