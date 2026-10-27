import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { clearScheduledReminders } from '@/src/lib/notifications';
import { getSupabase, isSupabaseConfigured } from '@/src/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Sends a 6-digit confirmation code; the account is usable only after `verifySignUp`. */
  signUp: (email: string, password: string) => Promise<void>;
  verifySignUp: (email: string, token: string) => Promise<void>;
  resendSignUpCode: (email: string) => Promise<void>;
  /** Sends a 6-digit recovery code to the address. */
  requestPasswordReset: (email: string) => Promise<void>;
  /** Verifies the recovery code (which signs in) and sets the new password. */
  resetPassword: (email: string, token: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

WebBrowser.maybeCompleteAuthSession();

/** Same surface as the web `useAuth()`, backed by Supabase Auth. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setSession(data.session);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signUp({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const verifySignUp = useCallback(async (email: string, token: string) => {
    const { error } = await getSupabase().auth.verifyOtp({ email: email.trim(), token, type: 'signup' });
    if (error) throw error;
  }, []);

  const resendSignUpCode = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.resend({ type: 'signup', email: email.trim() });
    if (error) throw error;
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string, token: string, password: string) => {
    const supabase = getSupabase();
    const verified = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'recovery' });
    if (verified.error) throw verified.error;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return;
    const code = new URL(result.url).searchParams.get('code');
    if (!code) return;
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error) throw exchanged.error;
  }, []);

  const logout = useCallback(async () => {
    // Reminders belong to this account; the next user must not get them.
    await clearScheduledReminders().catch(() => {});
    await getSupabase().auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoadingAuth,
      signIn,
      signUp,
      verifySignUp,
      resendSignUpCode,
      requestPasswordReset,
      resetPassword,
      signInWithGoogle,
      logout,
    }),
    [session, isLoadingAuth, signIn, signUp, verifySignUp, resendSignUpCode, requestPasswordReset, resetPassword, signInWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
