import { Text, type TextProps } from '@/src/ui/Text';

/** shadcn `Label`: `text-sm font-medium leading-none`. */
export function Label({ style, ...rest }: TextProps) {
  return <Text variant="medium" style={[{ lineHeight: 16 }, style]} {...rest} />;
}
