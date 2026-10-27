import { useLocalSearchParams } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { View, type TextInputInstance } from 'react-native';

import { AuthLayout } from '@/src/components/auth/AuthLayout';
import { OtpInput } from '@/src/components/auth/OtpInput';
import { AuthError, AuthLink, AuthSwitch, Field, SubmitButton } from '@/src/components/auth/parts';
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/lib/AuthContext';
import { authErrorMessage } from '@/src/lib/authErrors';
import { Label } from '@/src/ui/Label';
import { Text } from '@/src/ui/Text';

/** Step 2 of the reset: recovery code + new password (signs the user in on success). */
export default function ResetPasswordScreen() {
  const t = useT();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { resetPassword } = useAuth();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmRef = useRef<TextInputInstance>(null);

  async function submit() {
    setError('');
    if (password !== confirm) {
      setError(t('auth.err.mismatch'));
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email, code, password);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout icon={Lock} title={t('auth.resetTitle')} subtitle={t('auth.resetSub')}>
      <Text variant="muted" style={{ marginBottom: 16 }}>
        {t('auth.codeSentPre')}
        <Text variant="medium">{email}</Text>
        {t('auth.codeSentPost')}
      </Text>
      <AuthError>{error}</AuthError>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Label>{t('auth.code')}</Label>
          <OtpInput value={code} onChange={setCode} autoFocus />
        </View>
        <Field
          label={t('auth.newPassword')}
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
          onSubmitEditing={submit}
          editable={!busy}
        />
        <SubmitButton
          busy={busy}
          busyLabel={t('auth.saving')}
          onPress={submit}
          disabled={code.length < 6 || !password || !confirm}
        >
          {t('auth.savePassword')}
        </SubmitButton>
      </View>
      <AuthSwitch prompt="">
        <AuthLink href="/login">{t('auth.backToLogin')}</AuthLink>
      </AuthSwitch>
    </AuthLayout>
  );
}
