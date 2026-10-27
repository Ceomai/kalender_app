import { CalendarPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CodeBox } from '@/src/components/common/CodeBox';
import { calendarColor } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import type { Calendar } from '@/src/services/types';
import { FONTS, RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

type Props = { calendar: Calendar; isOwner: boolean; busy: boolean; onLeave: () => void; onDelete: () => void };

export function CalendarCard({ calendar, isOwner, busy, onLeave, onDelete }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [confirming, setConfirming] = useState<'delete' | 'leave' | null>(null);
  const color = calendarColor(calendar.color);
  const members = calendar.member_names ?? [];

  return (
    <View style={[styles.card, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }]}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: color.dot }]}>
          <Users size={20} color="#ffffff" />
        </View>
        <View style={styles.flex}>
          <Text variant="heading" numberOfLines={1}>
            {calendar.name}
          </Text>
          <Text variant="small">
            {t('cal.card.createdBy').replace('{name}', calendar.owner_name || t('cal.card.founder'))} ·{' '}
            {t('cal.card.members').replace('{n}', String(members.length))}
          </Text>
        </View>
        {isOwner && (
          <View style={[styles.owner, { backgroundColor: alpha(colors.primary, 0.1) }]}>
            <Text style={[styles.ownerText, { color: colors.primary }]}>{t('cal.card.founder')}</Text>
          </View>
        )}
      </View>

      {!!calendar.description && (
        <Text variant="muted" style={styles.mt}>
          {calendar.description}
        </Text>
      )}
      <Text variant="small" style={styles.mt}>
        {t('cal.card.membersLabel')}: {members.length ? members.join(', ') : '—'}
      </Text>

      {!!calendar.invite_code && (
        <View style={[styles.codeBox, { borderColor: alpha(colors.border, 0.7), backgroundColor: alpha(colors.muted, 0.3) }]}>
          <CodeBox code={calendar.invite_code} label={t('cal.card.joinCode')} />
          <View style={styles.hint}>
            <CalendarPlus size={14} color={colors.mutedForeground} />
            <Text variant="small" style={styles.flex}>
              {t('cal.card.shareHint')}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {confirming ? (
          <>
            <Text variant="small" style={styles.confirmText}>
              {confirming === 'delete' ? t('cal.card.deleteConfirm') : t('cal.card.leaveConfirm')}
            </Text>
            <Button size="sm" variant="destructive" disabled={busy} onPress={confirming === 'delete' ? onDelete : onLeave}>
              {t('cal.card.yes')}
            </Button>
            <Button size="sm" variant="ghost" onPress={() => setConfirming(null)}>
              {t('act.cancel')}
            </Button>
          </>
        ) : isOwner ? (
          <Button size="sm" variant="outline" onPress={() => setConfirming('delete')}>
            <Text variant="medium" color={colors.destructiveText} style={{ fontSize: 12 }}>
              {t('cal.card.deleteBtn')}
            </Text>
          </Button>
        ) : (
          <Button size="sm" variant="outline" onPress={() => setConfirming('leave')}>
            {t('cal.card.leaveBtn')}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: RADII['3xl'], padding: 16, boxShadow: SHADOWS.sm },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: RADII['2xl'], alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  flex: { flex: 1, minWidth: 0 },
  owner: { borderRadius: RADII.full, paddingHorizontal: 10, paddingVertical: 4 },
  ownerText: { fontFamily: FONTS.bodySemi, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  mt: { marginTop: 12 },
  codeBox: { marginTop: 16, borderWidth: 1, borderRadius: RADII['2xl'], padding: 12 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  confirmText: { marginRight: 'auto', flexShrink: 1 },
});
