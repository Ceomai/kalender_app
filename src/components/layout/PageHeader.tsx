import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { FONTS } from '@/src/theme';
import { Text } from '@/src/ui/Text';

/** Eyebrow + serif page title + intro, as every page of the web app opens. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  action,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  action?: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const large = width >= 640; // `sm:text-4xl`
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {eyebrow && <Text variant="eyebrow">{eyebrow}</Text>}
        <Text style={[styles.title, large && styles.large]} numberOfLines={2}>
          {title}
        </Text>
        {intro && (
          <Text variant="muted" style={styles.intro}>
            {intro}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  text: { flexGrow: 1, flexShrink: 1, minWidth: 200 },
  title: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  large: { fontSize: 40, lineHeight: 46 },
  intro: { marginTop: 4 },
});
