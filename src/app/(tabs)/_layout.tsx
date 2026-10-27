import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { AppHeader } from '@/src/components/layout/AppHeader';
import { BottomNav } from '@/src/components/layout/BottomNav';
import { useReminderNotifications } from '@/src/lib/useReminderNotifications';
import { useTheme } from '@/src/theme';

/** Web `AppShell`: shared header on top, six-item bottom nav below every page. */
export default function TabLayout() {
  const { colors } = useTheme();
  useReminderNotifications();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <Tabs
        tabBar={(props) => <BottomNav {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="gorevler" />
        <Tabs.Screen name="hatirlaticilar" />
        <Tabs.Screen name="takvimler" />
        <Tabs.Screen name="arkadaslar" />
        <Tabs.Screen name="ayarlar" />
        {/* Reached from the calendar toolbar menu; BottomNav lists only NAV_ITEMS, so they stay
            out of the bar (as on the web). `href: null` would drop them from navigation altogether. */}
        <Tabs.Screen name="analiz" />
        <Tabs.Screen name="sablonlar" />
      </Tabs>
    </View>
  );
}
