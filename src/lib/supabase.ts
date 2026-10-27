import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { secureSessionStorage } from '@/src/lib/secureSessionStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR_PROJECT'));

/** Set EXPO_PUBLIC_GOOGLE_SIGN_IN=1 once the Google provider is enabled in Supabase. */
export const isGoogleSignInEnabled = process.env.EXPO_PUBLIC_GOOGLE_SIGN_IN === '1';

export class SupabaseNotConfiguredError extends Error {
  code = 'not_configured';
  constructor() {
    super('Supabase is not configured: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  }
}

let client: SupabaseClient | null = null;

/** The app's Supabase client. Throws when `.env` is missing so callers surface a clear error. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: secureSessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return client;
}
