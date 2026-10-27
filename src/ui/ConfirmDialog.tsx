import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/src/i18n';
import { RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  busy?: boolean;
  destructive?: boolean;
};

/** Web `AlertDialog`: centered card with Cancel / Confirm. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, busy, destructive = true }: Props) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: alpha('#000000', 0.8) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text variant="heading" style={styles.title}>
            {title}
          </Text>
          {description && <Text variant="muted">{description}</Text>}
          <View style={styles.actions}>
            <Button variant="outline" onPress={onClose} disabled={busy}>
              {t('act.cancel')}
            </Button>
            <Button variant={destructive ? 'destructive' : 'default'} onPress={onConfirm} loading={busy}>
              {confirmLabel ?? t('act.confirmDelete')}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 512, borderWidth: 1, borderRadius: RADII.lg, padding: 24, gap: 8, boxShadow: SHADOWS.lg },
  title: { fontSize: 18, lineHeight: 24 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
