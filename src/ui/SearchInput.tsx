import { Search } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/src/theme';
import { Input, type InputProps } from '@/src/ui/Input';

/** Input with a leading search icon (`relative` + `pl-9` on the web). */
export function SearchInput({ containerStyle, style, ...rest }: InputProps & { containerStyle?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, containerStyle]}>
      <View style={styles.icon} pointerEvents="none">
        <Search size={16} color={colors.mutedForeground} />
      </View>
      <Input autoCapitalize="none" autoCorrect={false} style={[styles.input, style]} {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, flexBasis: 180 },
  icon: { position: 'absolute', left: 12, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  input: { paddingLeft: 36 },
});
