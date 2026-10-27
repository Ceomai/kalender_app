import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { THEME_SWATCHES } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { THEME_IDS } from '@/src/theme/types';
import { Text } from '@/src/ui/Text';

/** Web `ThemePicker`: 2 (sm: 3) column grid of palette cards. */
export function ThemePicker() {
  const { colors } = useTheme();
  const { prefs, update } = usePreferences();
  const t = useT();
  const { width } = useWindowDimensions();
  const basis = width >= 640 ? '31.5%' : '48.5%';

  return (
    <View style={styles.grid}>
      {THEME_IDS.map((id) => {
        const active = prefs.theme === id;
        return (
          <Pressable
            key={id}
            onPress={() => update({ theme: id })}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.item,
              { flexBasis: basis },
              active
                ? { borderColor: colors.primary, backgroundColor: alpha(colors.primary, 0.05), boxShadow: SHADOWS.sm }
                : { borderColor: alpha(colors.border, 0.7), backgroundColor: pressed ? alpha(colors.accent, 0.5) : 'transparent' },
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: THEME_SWATCHES[id] }]}>
              {active && <Check size={16} color="#ffffff" />}
            </View>
            <View style={styles.text}>
              <Text variant="medium" numberOfLines={1}>
                {t(`th.${id}`)}
              </Text>
              <Text variant="small" numberOfLines={1}>
                {t(`th.hint.${id}`)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: RADII['2xl'],
    padding: 12,
  },
  swatch: { width: 36, height: 36, borderRadius: RADII.xl, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
});
