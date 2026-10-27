import { Link } from 'expo-router';
import { CalendarDays, Moon, Sun } from 'lucide-react-native';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReminderBell } from '@/src/components/layout/ReminderBell';
import { UserMenu } from '@/src/components/layout/UserMenu';
import { useT } from '@/src/i18n';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { FONTS, RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

/** Web `AppShell` header: logo, theme toggle, reminder bell and the account avatar. */
export function AppHeader() {
  const { colors } = useTheme();
  const { prefs, update } = usePreferences();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          backgroundColor: alpha(colors.background, 0.95),
          borderBottomColor: alpha(colors.border, 0.6),
        },
      ]}
    >
      <View style={styles.row}>
        <Link href="/" asChild>
          <Pressable style={styles.brand} accessibilityRole="link">
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <CalendarDays size={20} color={colors.primaryForeground} />
            </View>
            {/* `hidden sm:block` on the web */}
            {width >= 640 && <Text style={styles.brandText}>{t('brand')}</Text>}
          </Pressable>
        </Link>

        <View style={styles.actions}>
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel={t('as.toggleTheme')}
            onPress={() => update({ dark_mode: !prefs.dark_mode })}
          >
            {prefs.dark_mode ? <Sun size={20} color={colors.foreground} /> : <Moon size={20} color={colors.foreground} />}
          </Button>
          <ReminderBell />
          <UserMenu />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1 },
  row: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: RADII['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: SHADOWS.sm,
  },
  brandText: { fontFamily: FONTS.heading, fontSize: 18, letterSpacing: -0.4 },
  actions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },
});
