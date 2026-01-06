/**
 * Supabase Admin Client
 * 
 * Use this client ONLY in server-side code for admin operations that
 * require bypassing Row Level Security (RLS).
 * 
 * ⚠️ SECURITY WARNING: Never expose this client to the browser!
 * 
 * Usage:
 * ```ts
 * import { createAdminClient } from '@/lib/supabase/admin';
 * 
 * // In an API route
 * const supabase = createAdminClient();
 * const { data } = await supabase.from('phone_verifications').select();
 * ```
 */

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Check your .env.local file.'
    );
  }

  if (!supabaseServiceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Get this from Supabase Dashboard > Settings > API > service_role key. ' +
      'See ENV_SETUP.md for instructions.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

