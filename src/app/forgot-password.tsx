import { router, useLocalSearchParams } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthLayout } from '@/src/components/auth/AuthLayout';
import { AuthError, AuthLink, AuthSwitch, Field, SubmitButton } from '@/src/components/auth/parts';
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/lib/AuthContext';
import { authErrorMessage } from '@/src/lib/authErrors';

/** Step 1 of the reset: e-mail a 6-digit recovery code, then continue on /reset-password. */
export default function ForgotPasswordScreen() {
  const t = useT();
  const params = useLocalSearchParams<{ email?: string }>();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await requestPasswordReset(email);
      router.replace({ pathname: '/reset-password', params: { email: email.trim() } });
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout icon={Mail} title={t('auth.forgotTitle')} subtitle={t('auth.forgotSub')}>
      <AuthError>{error}</AuthError>
      <View style={{ gap: 16 }}>
        <Field
          label={t('auth.emailAddress')}
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.emailPh')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          autoFocus
          returnKeyType="send"
          onSubmitEditing={submit}
          editable={!busy}
        />
        <SubmitButton busy={busy} busyLabel={t('auth.sending')} onPress={submit} disabled={!email}>
          {t('auth.sendCode')}
        </SubmitButton>
      </View>
      <AuthSwitch prompt="">
        <AuthLink href="/login">{t('auth.backToLogin')}</AuthLink>
      </AuthSwitch>
    </AuthLayout>
  );
}
