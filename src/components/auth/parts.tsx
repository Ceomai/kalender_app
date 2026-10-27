import { Link, type Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { forwardRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type TextInputInstance } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useT } from '@/src/i18n';
import { FONTS, RADII, alpha, useTheme } from '@/src/theme';
import { Button, type ButtonProps } from '@/src/ui/Button';
import { Input, type InputProps } from '@/src/ui/Input';
import { Label } from '@/src/ui/Label';
import { Text } from '@/src/ui/Text';

// Small pieces the auth screens share (web `src/components/auth/parts.jsx`).

export function AuthError({ children }: { children?: string }) {
  const { colors } = useTheme();
  if (!children) return null;
  return (
    <View accessibilityRole="alert" style={[styles.error, { backgroundColor: alpha(colors.destructive, 0.1) }]}>
      <Text style={{ color: colors.destructiveText }}>{children}</Text>
    </View>
  );
}

export function AuthNotice({ children }: { children?: string }) {
  const { colors } = useTheme();
  if (!children) return null;
  return (
    <View style={[styles.error, { backgroundColor: colors.accent }]}>
      <Text style={{ color: colors.accentForeground }}>{children}</Text>
    </View>
  );
}

export function SubmitButton({ busy, busyLabel, children, ...rest }: ButtonProps & { busy: boolean; busyLabel: string }) {
  return (
    <Button loading={busy} style={styles.tall} {...rest}>
      {busy ? busyLabel : children}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function GoogleButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const t = useT();
  return (
    <Button variant="outline" onPress={onPress} disabled={disabled} style={[styles.tall, styles.googleGap]}>
      <GoogleIcon />
      <Text variant="medium">{t('auth.google')}</Text>
    </Button>
  );
}

export function OrDivider() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <View style={styles.divider}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text style={[styles.or, { color: colors.mutedForeground }]}>{t('auth.or')}</Text>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

export function AuthLink({ href, children, small }: { href: Href; children: string; small?: boolean }) {
  const { colors } = useTheme();
  return (
    <Link href={href} replace asChild>
      <Pressable hitSlop={6}>
        <Text style={{ color: colors.primary, fontFamily: small ? FONTS.body : FONTS.bodyMedium, fontSize: small ? 12 : 14 }}>
          {children}
        </Text>
      </Pressable>
    </Link>
  );
}

/** Muted line with an inline link: "Hesabınız yok mu? Hesap oluşturun". */
export function AuthSwitch({ prompt, children }: { prompt: string; children: ReactNode }) {
  return (
    <View style={styles.switch}>
      <Text variant="muted">{prompt} </Text>
      {children}
    </View>
  );
}

type FieldProps = InputProps & { label: string; icon: LucideIcon; aside?: ReactNode };

/** Label + `h-12 pl-10` input with a leading icon, as on the web auth pages. */
export const Field = forwardRef<TextInputInstance, FieldProps>(function Field({ label, icon: Icon, aside, style, ...rest }, ref) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Label>{label}</Label>
        {aside}
      </View>
      <View>
        <View style={styles.inputIcon} pointerEvents="none">
          <Icon size={16} color={colors.mutedForeground} />
        </View>
        <Input ref={ref} style={[styles.input, style]} {...rest} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  error: { borderRadius: RADII.lg, padding: 12, marginBottom: 16 },
  tall: { height: 48, width: '100%' },
  googleGap: { marginBottom: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  or: { fontFamily: FONTS.body, fontSize: 12, textTransform: 'uppercase' },
  switch: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  field: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputIcon: { position: 'absolute', left: 12, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  input: { height: 48, paddingLeft: 40 },
});
