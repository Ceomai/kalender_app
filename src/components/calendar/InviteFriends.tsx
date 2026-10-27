import { Check, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/src/i18n';
import { inviteToEvent } from '@/src/services/invitations';
import { queryKeys, useEventInvitations, useFriends, useServiceMutation } from '@/src/services/queries';
import type { InvitationStatus } from '@/src/services/types';
import { FONTS, RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Pill, PillRow } from '@/src/ui/Pill';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

const STATUS_STYLE: Record<InvitationStatus, { bg: string; fg: string }> = {
  pending: { bg: '#fef3c7', fg: '#b45309' },
  accepted: { bg: '#d1fae5', fg: '#047857' },
  declined: { bg: '#ffe4e6', fg: '#be123c' },
  tentative: { bg: '#e0f2fe', fg: '#0369a1' },
};

/** Friend picker inside the event sheet; shows each friend's invitation status. */
export function InviteFriends({ eventId }: { eventId: string }) {
  const { colors } = useTheme();
  const t = useT();
  const friends = useFriends().data ?? [];
  const invitations = useEventInvitations(eventId).data ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const invite = useServiceMutation((ids: string[]) => inviteToEvent(eventId, ids), [queryKeys.eventInvitations(eventId)]);

  const invited = new Map(invitations.map((i) => [i.invitee_id, i.status]));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!friends.length) {
    return (
      <View style={[styles.empty, { borderColor: alpha(colors.border, 0.7), backgroundColor: alpha(colors.muted, 0.2) }]}>
        <Text variant="small">{t('inv.noFriends')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <PillRow wrap>
        {friends.map((f) => {
          const status = invited.get(f.friend_id);
          const isSelected = selected.has(f.friend_id);
          return (
            <Pill
              key={f.friend_id}
              label={f.name}
              disabled={!!status}
              selected={isSelected}
              onPress={() => toggle(f.friend_id)}
              leading={
                status ? (
                  <View style={[styles.status, { backgroundColor: STATUS_STYLE[status].bg }]}>
                    <Text style={[styles.statusText, { color: STATUS_STYLE[status].fg }]}>{t(`inv.status.${status}`)}</Text>
                  </View>
                ) : isSelected ? (
                  <Check size={12} color={colors.primaryForeground} />
                ) : null
              }
            />
          );
        })}
      </PillRow>
      {selected.size > 0 && (
        <Button
          size="sm"
          icon={UserPlus}
          loading={invite.isPending}
          style={styles.send}
          onPress={() =>
            invite.mutate(Array.from(selected), {
              onSuccess: (res) => {
                if (!res.ok) {
                  toast.error(t('inv.errNoFriends'));
                  return;
                }
                toast.success(t('inv.toastSent').replace('{n}', String(res.created || 0)));
                setSelected(new Set());
              },
              onError: () => toast.error(t('inv.toastErr')),
            })
          }
        >
          {invite.isPending ? t('inv.sending') : t('inv.send').replace('{n}', String(selected.size))}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  empty: { borderWidth: 1, borderRadius: RADII['2xl'], padding: 12 },
  status: { borderRadius: RADII.full, paddingHorizontal: 6, paddingVertical: 1 },
  statusText: { fontFamily: FONTS.bodySemi, fontSize: 10 },
  send: { alignSelf: 'flex-start' },
});
