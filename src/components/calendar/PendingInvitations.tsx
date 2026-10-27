import { Check, Clock, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/src/i18n';
import { formatDateTimeLocal } from '@/src/lib/calendar-utils';
import { respondToInvitation } from '@/src/services/invitations';
import { queryKeys, usePendingInvitations, useServiceMutation } from '@/src/services/queries';
import type { InvitationStatus } from '@/src/services/types';
import { RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

/** Invitations waiting for my answer (renders nothing when there are none). */
export function PendingInvitations() {
  const { colors } = useTheme();
  const t = useT();
  const invitations = usePendingInvitations().data ?? [];
  const respond = useServiceMutation(
    ({ id, status }: { id: string; status: Exclude<InvitationStatus, 'pending'> }) => respondToInvitation(id, status),
    [queryKeys.pendingInvitations, queryKeys.events],
  );

  if (!invitations.length) return null;

  const answer = (id: string, status: Exclude<InvitationStatus, 'pending'>) =>
    respond.mutate({ id, status }, { onError: () => toast.error(t('inv.toastErr')) });

  return (
    <View style={styles.stack}>
      <View style={styles.label}>
        <Clock size={14} color={colors.mutedForeground} />
        <Text variant="eyebrow" style={{ letterSpacing: 0.5 }}>
          {t('inv.pending')}
        </Text>
      </View>
      {invitations.map((inv) => (
        <View
          key={inv.id}
          style={[styles.card, { borderColor: alpha(colors.primary, 0.3), backgroundColor: alpha(colors.primary, 0.05) }]}
        >
          <View>
            <Text variant="medium" numberOfLines={1}>
              {inv.event_title}
            </Text>
            <Text variant="small">
              {t('inv.from').replace('{name}', inv.inviter_name || '')}
              {inv.event_start ? ` · ${formatDateTimeLocal(inv.event_start)}` : ''}
            </Text>
          </View>
          <View style={styles.actions}>
            <Button size="sm" icon={Check} disabled={respond.isPending} onPress={() => answer(inv.id, 'accepted')}>
              {t('inv.accept')}
            </Button>
            <Button size="sm" variant="outline" disabled={respond.isPending} onPress={() => answer(inv.id, 'tentative')}>
              {t('inv.tentative')}
            </Button>
            <Button size="sm" variant="ghost" disabled={respond.isPending} onPress={() => answer(inv.id, 'declined')}>
              <X size={14} color={colors.destructiveText} />
              <Text variant="medium" color={colors.destructiveText} style={{ fontSize: 12 }}>
                {t('inv.decline')}
              </Text>
            </Button>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  card: { borderWidth: 1, borderRadius: RADII['2xl'], padding: 12, gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
