import { router } from 'expo-router';
import { Lock, LogIn, Mail } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { View, type TextInputInstance } from 'react-native';

import { AuthLayout } from '@/src/components/auth/AuthLayout';
import { AuthError, AuthLink, AuthSwitch, Field, GoogleButton, OrDivider, SubmitButton } from '@/src/components/auth/parts';
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/lib/AuthContext';
import { authErrorMessage, isEmailNotConfirmed } from '@/src/lib/authErrors';
import { isGoogleSignInEnabled } from '@/src/lib/supabase';

export default function LoginScreen() {
  const t = useT();
  const { signIn, signInWithGoogle, resendSignUpCode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
      // The root layout switches to the app once the session arrives.
    } catch (err) {
      if (isEmailNotConfirmed(err)) {
        // Unverified account: send a fresh code and continue on the code step.
        await resendSignUpCode(email).catch(() => {});
        router.replace({ pathname: '/register', params: { email: email.trim(), step: 'otp' } });
        return;
      }
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <AuthLayout icon={LogIn} title={t('auth.welcome')} subtitle={t('auth.loginSub')}>
      {isGoogleSignInEnabled && (
        <>
          <GoogleButton onPress={google} disabled={busy} />
          <OrDivider />
        </>
      )}
      <AuthError>{error}</AuthError>
      <View style={{ gap: 16 }}>
        <Field
          label={t('auth.email')}
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.emailPh')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!busy}
        />
        <Field
          ref={passwordRef}
          label={t('auth.password')}
          icon={Lock}
          aside={
            <AuthLink small href={{ pathname: '/forgot-password', params: email ? { email: email.trim() } : {} }}>
              {t('auth.forgot')}
            </AuthLink>
          }
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!busy}
        />
        <SubmitButton busy={busy} busyLabel={t('auth.loggingIn')} onPress={submit} disabled={!email || !password}>
          {t('auth.login')}
        </SubmitButton>
      </View>
      <AuthSwitch prompt={t('auth.noAccount')}>
        <AuthLink href="/register">{t('auth.createOne')}</AuthLink>
      </AuthSwitch>
    </AuthLayout>
  );
}
