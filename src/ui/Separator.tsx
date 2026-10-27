import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/src/theme';

export function Separator({ vertical, style }: { vertical?: boolean; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        vertical ? { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' } : { height: StyleSheet.hairlineWidth },
        { backgroundColor: colors.border },
        style,
      ]}
    />
  );
}
