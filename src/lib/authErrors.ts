import { tRaw } from '@/src/i18n';

/** Maps a Supabase auth error (or anything thrown) to a translated message. */
export function authErrorMessage(err: unknown): string {
  const e = (err ?? {}) as { code?: string; name?: string; status?: number; message?: string };
  const code = e.code ?? '';

  if (code === 'not_configured') return tRaw('auth.err.config');
  if (e.name === 'AuthRetryableFetchError' || /network request failed|fetch failed/i.test(e.message ?? '')) {
    return tRaw('auth.err.network');
  }
  switch (code) {
    case 'invalid_credentials':
      return tRaw('auth.err.invalid');
    case 'email_not_confirmed':
      return tRaw('auth.err.notConfirmed');
    case 'user_already_exists':
    case 'email_exists':
      return tRaw('auth.err.exists');
    case 'weak_password':
      return tRaw('auth.err.weak');
    case 'otp_expired':
    case 'otp_disabled':
      return tRaw('auth.err.code');
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
    case 'over_sms_send_rate_limit':
      return tRaw('auth.err.rate');
    case 'validation_failed':
    case 'email_address_invalid':
      return tRaw('auth.err.email');
  }
  if (e.status === 429) return tRaw('auth.err.rate');
  return tRaw('auth.err.generic');
}

export function isEmailNotConfirmed(err: unknown) {
  return (err as { code?: string } | null)?.code === 'email_not_confirmed';
}
