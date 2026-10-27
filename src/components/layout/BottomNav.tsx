import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NAV_ITEMS } from '@/src/constants/nav';
import { useT } from '@/src/i18n';
import { FONTS, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

/** Web `AppShell` bottom nav (`md:hidden`): icon over a 10px label, active item in `text-primary`. */
export function BottomNav({ state, navigateToTab }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  const activeRoute = state.routes[state.index]?.name;

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom,
          backgroundColor: alpha(colors.background, 0.95),
          borderTopColor: alpha(colors.border, 0.6),
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const route = state.routes.find((r) => r.name === item.route);
        const active = activeRoute === item.route;
        const color = active ? colors.primary : colors.mutedForeground;
        const Icon = item.icon;
        return (
          <Pressable
            key={item.route}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active && route) navigateToTab(route.key);
            }}
            style={styles.item}
          >
            <Icon size={20} color={color} style={active ? { transform: [{ scale: 1.1 }] } : undefined} />
            <Text numberOfLines={1} style={[styles.label, { color }]}>
              {t(`nav.${item.key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: 1 },
  item: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10 },
  label: { fontFamily: FONTS.bodyMedium, fontSize: 10, lineHeight: 12 },
});
