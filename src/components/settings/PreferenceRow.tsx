import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { RADII, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Inline control (e.g. a Switch) shown to the right of the text. */
  trailing?: ReactNode;
  /** Full-width control (e.g. a Select) shown under the text. */
  children?: ReactNode;
};

/** Web settings row: `rounded-2xl border border-border/70 bg-muted/30 p-3.5`. */
export function PreferenceRow({ icon: Icon, title, description, trailing, children }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderColor: alpha(colors.border, 0.7), backgroundColor: alpha(colors.muted, 0.3) }]}>
      <View style={styles.top}>
        <View style={styles.label}>
          {Icon && <Icon size={16} color={colors.foreground} />}
          <View style={styles.text}>
            <Text variant="medium">{title}</Text>
            {description && <Text variant="small">{description}</Text>}
          </View>
        </View>
        {trailing}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderWidth: 1, borderRadius: RADII['2xl'], padding: 14, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  text: { flex: 1 },
});
