import { useLocalSearchParams } from 'expo-router';
import { Lock, Mail, UserPlus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputInstance } from 'react-native';

import { AuthLayout } from '@/src/components/auth/AuthLayout';
import { OtpInput } from '@/src/components/auth/OtpInput';
import {
  AuthError,
  AuthLink,
  AuthNotice,
  AuthSwitch,
  Field,
  GoogleButton,
  OrDivider,
  SubmitButton,
} from '@/src/components/auth/parts';
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/lib/AuthContext';
import { authErrorMessage } from '@/src/lib/authErrors';
import { isGoogleSignInEnabled } from '@/src/lib/supabase';
import { useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

/**
 * Register → 6-digit e-mail code → verifyOtp. Signing up alone does not sign the
 * user in (the account is unverified), so the code step is never skipped.
 */
export default function RegisterScreen() {
  const t = useT();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ email?: string; step?: string }>();
  const { signUp, verifySignUp, resendSignUpCode, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>(params.step === 'otp' && params.email ? 'otp' : 'form');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  async function register() {
    setError('');
    if (password !== confirm) {
      setError(t('auth.err.mismatch'));
      return;
    }
    setBusy(true);
    try {
      await signUp(email, password);
      setStep('otp');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError('');
    setBusy(true);
    try {
      await verifySignUp(email, code);
      // Signed in: the root layout switches to the app.
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  async function resend() {
    setError('');
    setNotice('');
    try {
      await resendSignUpCode(email);
      setNotice(t('auth.resent'));
    } catch (err) {
      setError(authErrorMessage(err));
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

  if (step === 'otp') {
    return (
      <AuthLayout icon={UserPlus} title={t('auth.registerTitle')} subtitle={t('auth.registerSub')}>
        <Text variant="muted" style={{ marginBottom: 16 }}>
          {t('auth.codeSentPre')}
          <Text variant="medium">{email.trim()}</Text>
          {t('auth.codeSentPost')}
        </Text>
        <AuthError>{error}</AuthError>
        <AuthNotice>{notice}</AuthNotice>
        <View style={{ marginBottom: 24 }}>
          <OtpInput value={code} onChange={setCode} autoFocus />
        </View>
        <SubmitButton busy={busy} busyLabel={t('auth.verifying')} onPress={verify} disabled={code.length < 6}>
          {t('auth.verify')}
        </SubmitButton>
        <AuthSwitch prompt={t('auth.noCode')}>
          <Pressable onPress={resend} hitSlop={6}>
            <Text variant="medium" color={colors.primary}>
              {t('auth.resend')}
            </Text>
          </Pressable>
        </AuthSwitch>
        <View style={styles.otpFooter}>
          <Pressable
            hitSlop={6}
            onPress={() => {
              setCode('');
              setError('');
              setNotice('');
              setStep('form');
            }}
          >
            <Text variant="small" color={colors.primary}>
              {t('auth.changeEmail')}
            </Text>
          </Pressable>
          <AuthLink small href="/login">
            {t('auth.backToLogin')}
          </AuthLink>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={UserPlus} title={t('auth.registerTitle')} subtitle={t('auth.registerSub')}>
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
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          editable={!busy}
        />
        <Field
          ref={confirmRef}
          label={t('auth.passwordConfirm')}
          icon={Lock}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={register}
          editable={!busy}
        />
        <SubmitButton
          busy={busy}
          busyLabel={t('auth.creating')}
          onPress={register}
          disabled={!email || !password || !confirm}
        >
          {t('auth.create')}
        </SubmitButton>
      </View>
      <AuthSwitch prompt={t('auth.haveAccount')}>
        <AuthLink href="/login">{t('auth.loginLink')}</AuthLink>
      </AuthSwitch>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  otpFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
});
