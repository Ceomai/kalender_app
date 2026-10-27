import { router } from 'expo-router';
import { LogOut, Settings, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/src/i18n';
import { useAuth } from '@/src/lib/AuthContext';
import { FONTS, RADII, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Separator } from '@/src/ui/Separator';
import { Sheet } from '@/src/ui/Sheet';
import { Text } from '@/src/ui/Text';

function initials(name?: string, email?: string) {
  const source = (name || email || '?').trim();
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function MenuItem({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.accent }]}
    >
      <Icon size={16} color={colors.foreground} />
      <Text>{label}</Text>
    </Pressable>
  );
}

/** Web `UserMenu`: avatar initials; name, e-mail, Settings and Sign out in a sheet. */
export function UserMenu() {
  const { colors } = useTheme();
  const t = useT();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? '';

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={t('um.aria')}
        style={{ borderRadius: RADII.full }}
        onPress={() => setOpen(true)}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.accentForeground }]}>
            {initials(fullName, user?.email)}
          </Text>
        </View>
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <View>
          <Text style={styles.name} numberOfLines={1}>
            {fullName || t('um.myAccount')}
          </Text>
          <Text variant="small" numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
        <Separator />
        <View style={styles.list}>
          <MenuItem
            icon={Settings}
            label={t('um.settings')}
            onPress={() => {
              setOpen(false);
              router.navigate('/ayarlar');
            }}
          />
          <MenuItem
            icon={LogOut}
            label={t('um.logout')}
            onPress={() => {
              setOpen(false);
              logout();
            }}
          />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONTS.bodySemi, fontSize: 12 },
  name: { fontFamily: FONTS.heading, fontSize: 14 },
  list: { gap: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 8, borderRadius: RADII.sm },
});
