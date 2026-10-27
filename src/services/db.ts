import type { PostgrestError } from '@supabase/supabase-js';

import { getSupabase } from '@/src/lib/supabase';

export { getSupabase as db };

/** Error thrown by the services; keeps Postgres' code (e.g. 23505 unique violation). */
export class ServiceError extends Error {
  code?: string;
  details?: string;
  constructor(err: PostgrestError | { message: string; code?: string; details?: string }) {
    super(err.message);
    this.name = 'ServiceError';
    this.code = err.code;
    this.details = err.details ?? undefined;
  }
}

/** Unwraps a supabase-js response, throwing on error (like the web server functions did). */
export function unwrap<T>(res: { data: T | null; error: PostgrestError | null }): T {
  if (res.error) throw new ServiceError(res.error);
  return res.data as T;
}

/** The signed-in user's id; every service except the auth screens requires one. */
export async function requireUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getSession();
  const id = data.session?.user.id;
  if (error || !id) throw new ServiceError({ message: 'not_authenticated', code: '42501' });
  return id;
}

/** Calls an RPC that returns the `{ ok, reason, ... }` JSON shape. */
export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  return unwrap(await getSupabase().rpc(fn, args));
}

/** Escapes `%`, `_` and `\` for use inside an `ilike` pattern. */
export function likeEscape(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}
