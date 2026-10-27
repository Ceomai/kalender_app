import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { CalendarCard } from '@/src/components/calendars/CalendarCard';
import { NewCalendarDialog } from '@/src/components/calendars/NewCalendarDialog';
import { MONO } from '@/src/components/common/CodeBox';
import { PageHeader } from '@/src/components/layout/PageHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/lib/AuthContext';
import { deleteCalendar, joinCalendarByCode, leaveCalendar } from '@/src/services/calendars';
import { queryKeys, useCalendars, useServiceMutation } from '@/src/services/queries';
import { RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { SectionCard } from '@/src/ui/Card';
import { EmptyState, LoadingCard } from '@/src/ui/EmptyState';
import { Input } from '@/src/ui/Input';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

export default function SharedCalendarsScreen() {
  const { colors } = useTheme();
  const t = useT();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const calendarsQuery = useCalendars();
  const calendars = calendarsQuery.data ?? [];

  const refresh = [queryKeys.calendars, queryKeys.events];
  const join = useServiceMutation(() => joinCalendarByCode(code.trim()), refresh);
  const leave = useServiceMutation((id: string) => leaveCalendar(id), refresh);
  const remove = useServiceMutation((id: string) => deleteCalendar(id), refresh);
  const busy = leave.isPending || remove.isPending;

  const submitJoin = () =>
    join.mutate(undefined, {
      onSuccess: (res) => {
        if (res.ok) {
          setCode('');
          setFeedback({ ok: true, text: t('cal.joined') });
        } else {
          setFeedback({
            ok: false,
            text: res.reason === 'not_found' ? t('cal.notFound') : res.reason === 'already' ? t('cal.already') : t('cal.joinFail'),
          });
        }
      },
      onError: () => setFeedback({ ok: false, text: t('cal.joinFailRetry') }),
    });

  return (
    <Screen>
      <PageHeader
        eyebrow={t('cal.eyebrow')}
        title={t('cal.title')}
        intro={t('cal.intro')}
        action={
          <Button icon={Plus} onPress={() => setDialogOpen(true)}>
            {t('cal.new')}
          </Button>
        }
      />

      <SectionCard title={t('cal.joinTitle')} description={t('cal.joinDesc')}>
        <View style={styles.joinRow}>
          <Input
            value={code}
            onChangeText={(v) => {
              setCode(v.toUpperCase());
              setFeedback(null);
            }}
            placeholder={t('cal.codePh')}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            style={[styles.codeInput, { fontFamily: MONO }]}
            returnKeyType="go"
            onSubmitEditing={() => code.trim().length >= 4 && submitJoin()}
          />
          <Button disabled={code.trim().length < 4} loading={join.isPending} onPress={submitJoin}>
            {join.isPending ? t('cal.joining') : t('cal.join')}
          </Button>
        </View>
        {feedback && (
          <View
            style={[
              styles.feedback,
              { backgroundColor: feedback.ok ? '#ecfdf5' : alpha(colors.destructive, 0.1) },
            ]}
          >
            <Text variant="small" color={feedback.ok ? '#047857' : colors.destructiveText}>
              {feedback.text}
            </Text>
          </View>
        )}
      </SectionCard>

      {calendarsQuery.isPending ? (
        <LoadingCard />
      ) : calendars.length === 0 ? (
        <EmptyState title={t('cal.empty')} description={t('cal.emptyDesc')} />
      ) : (
        <View style={[styles.grid, width >= 1024 && styles.twoCols]}>
          {calendars.map((cal) => (
            <View key={cal.id} style={width >= 1024 ? styles.half : undefined}>
              <CalendarCard
                calendar={cal}
                isOwner={cal.owner_id === user?.id}
                busy={busy}
                onLeave={() =>
                  leave.mutate(cal.id, {
                    onSuccess: (res) =>
                      res.ok ? toast.success(res.removed ? t('cal.deletedToast') : t('cal.left')) : toast.error(t('cal.fail')),
                  })
                }
                onDelete={() =>
                  remove.mutate(cal.id, {
                    onSuccess: (res) => (res.ok ? toast.success(t('cal.deletedToast')) : toast.error(t('cal.fail'))),
                  })
                }
              />
            </View>
          ))}
        </View>
      )}

      <NewCalendarDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  joinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  codeInput: { flexGrow: 1, flexBasis: 180, width: undefined, letterSpacing: 2 },
  feedback: { marginTop: 12, borderRadius: RADII.xl, paddingHorizontal: 12, paddingVertical: 8 },
  grid: { gap: 16 },
  twoCols: { flexDirection: 'row', flexWrap: 'wrap' },
  half: { flexBasis: '48%', flexGrow: 1 },
});
