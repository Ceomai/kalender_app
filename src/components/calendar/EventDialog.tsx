import { Mail, Trash2, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InviteFriends } from '@/src/components/calendar/InviteFriends';
import { CATEGORIES, PRIORITIES, REMINDER_OPTIONS, REPEATS, reminderLabel, repeatUnitLabel } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { dateInputValue, formatTime, timeInputValue, toISO, type Occurrence } from '@/src/lib/calendar-utils';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { createEvent, deleteEvent, updateEvent, type EventInput } from '@/src/services/events';
import { queryKeys, useServiceMutation } from '@/src/services/queries';
import type { Calendar, Priority, Repeat } from '@/src/services/types';
import { RADII, alpha, useTheme } from '@/src/theme';
import type { AppPreferences } from '@/src/theme/types';
import { Button } from '@/src/ui/Button';
import { ConfirmDialog } from '@/src/ui/ConfirmDialog';
import { DateField } from '@/src/ui/DateField';
import { Input, Textarea } from '@/src/ui/Input';
import { Label } from '@/src/ui/Label';
import { Pill, PillRow } from '@/src/ui/Pill';
import { Select } from '@/src/ui/Select';
import { Sheet } from '@/src/ui/Sheet';
import { Switch } from '@/src/ui/Switch';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

type Form = {
  title: string;
  description: string;
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  category: string;
  priority: Priority;
  location: string;
  repeat: Repeat;
  repeatInterval: number;
  repeatEndDate: string;
  reminderMinutes: number[];
  emailReminder: boolean;
  emailAll: boolean;
  calendarId: string;
};

function emptyForm(prefs: AppPreferences, date: Date | null): Form {
  const base = date ? new Date(date) : new Date();
  const start = new Date(base);
  if (!date) start.setHours(start.getHours() + 1, 0, 0, 0);
  else start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    title: '',
    description: '',
    date: dateInputValue(base),
    allDay: false,
    startTime: timeInputValue(start),
    endTime: timeInputValue(end),
    category: prefs.default_category || 'personal',
    priority: 'medium',
    location: '',
    repeat: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    reminderMinutes: [prefs.default_reminder_minutes ?? 30],
    emailReminder: false,
    emailAll: false,
    calendarId: '',
  };
}

function fromOccurrence(occ: Occurrence): Form {
  const start = new Date(occ.start_at);
  const end = occ.end_at ? new Date(occ.end_at) : new Date(start.getTime() + 3600000);
  return {
    title: occ.title || '',
    description: occ.description || '',
    date: dateInputValue(start),
    allDay: occ.all_day,
    startTime: formatTime(start),
    endTime: formatTime(end),
    category: occ.category || 'personal',
    priority: occ.priority || 'medium',
    location: occ.location || '',
    repeat: occ.repeat || 'none',
    repeatInterval: occ.repeat_interval || 1,
    repeatEndDate: occ.repeat_end_date ? String(occ.repeat_end_date).slice(0, 10) : '',
    reminderMinutes: occ.reminder_minutes?.length ? occ.reminder_minutes : [30],
    emailReminder: occ.email_reminder,
    emailAll: (occ.email_recipients ?? []).length > 1,
    calendarId: occ.calendar_id || '',
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** The tapped occurrence when editing, null for a new entry. */
  occurrence: Occurrence | null;
  defaultDate: Date | null;
  calendars: Calendar[];
};

/** Create / edit sheet: the web `EventDialog`, field for field. */
export function EventDialog(props: Props) {
  // Remount per opening so the form starts from the tapped entry (or a blank one).
  if (!props.open) return <Sheet open={false} onClose={props.onClose} />;
  return <EventForm key={props.occurrence?.occurrence_key ?? `new-${props.defaultDate?.toISOString()}`} {...props} />;
}

function EventForm({ open, onClose, occurrence, defaultDate, calendars }: Props) {
  const { colors } = useTheme();
  const { prefs } = usePreferences();
  const t = useT();
  const editing = !!occurrence;
  const [form, setForm] = useState<Form>(() => (occurrence ? fromOccurrence(occurrence) : emptyForm(prefs, defaultDate)));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (patch: Partial<Form>) => setForm((prev) => ({ ...prev, ...patch }));

  const invalidate = [queryKeys.events, queryKeys.upcoming];
  const save = useServiceMutation(
    (payload: EventInput) => (occurrence ? updateEvent(occurrence.id, payload) : createEvent(payload)),
    invalidate,
  );
  const remove = useServiceMutation(() => deleteEvent(occurrence!.id), invalidate);

  const handleSave = () => {
    if (!form.title.trim()) return;
    save.mutate(
      {
        title: form.title.trim(),
        description: form.description,
        start_at: toISO(form.date, form.allDay ? '00:00' : form.startTime),
        end_at: toISO(form.date, form.allDay ? '23:59' : form.endTime),
        all_day: form.allDay,
        category: form.category,
        priority: form.priority,
        location: form.location,
        repeat: form.repeat,
        repeat_interval: form.repeatInterval,
        repeat_end_date: form.repeatEndDate || null,
        reminder_minutes: form.reminderMinutes.length ? form.reminderMinutes : [30],
        email_reminder: form.emailReminder,
        email_all_members: form.emailAll,
        calendar_id: form.calendarId || null,
      },
      {
        onSuccess: () => {
          toast.success(editing ? t('ev.toastUpdated') : t('ev.toastCreated'));
          onClose();
        },
        onError: () => toast.error(t('ev.toastErr')),
      },
    );
  };

  const toggleReminder = (minutes: number) =>
    set({
      reminderMinutes: form.reminderMinutes.includes(minutes)
        ? form.reminderMinutes.filter((m) => m !== minutes)
        : [...form.reminderMinutes, minutes].sort((a, b) => a - b),
    });

  const boxed = [styles.box, { borderColor: alpha(colors.border, 0.7), backgroundColor: alpha(colors.muted, 0.2) }];

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={editing ? t('ev.editTitle') : t('ev.newTitle')}
        footer={
          <View style={styles.footer}>
            {editing ? (
              <Button variant="ghost" icon={Trash2} onPress={() => setConfirmOpen(true)}>
                <Text variant="medium" color={colors.destructiveText}>
                  {t('act.delete')}
                </Text>
              </Button>
            ) : (
              <View />
            )}
            <View style={styles.footerRight}>
              <Button variant="outline" onPress={onClose}>
                {t('act.cancel')}
              </Button>
              <Button disabled={!form.title.trim()} loading={save.isPending} onPress={handleSave}>
                {save.isPending ? t('act.saving') : editing ? t('act.save') : t('act.add')}
              </Button>
            </View>
          </View>
        }
      >
        <View style={styles.field}>
          <Label>{t('ev.titleLabel')}</Label>
          <Input value={form.title} onChangeText={(title) => set({ title })} placeholder={t('ev.titlePh')} maxLength={120} />
        </View>

        <View style={styles.field}>
          <Label>{t('ev.category')}</Label>
          <PillRow wrap>
            {CATEGORIES.map((c) => (
              <Pill
                key={c.id}
                label={c.label}
                icon={c.icon}
                colors={c.chip}
                selected={form.category === c.id}
                onPress={() => set({ category: c.id })}
              />
            ))}
          </PillRow>
        </View>

        <View style={styles.field}>
          <Label>{t('ev.priority')}</Label>
          <PillRow wrap>
            {PRIORITIES.map((p) => (
              <Pill
                key={p.id}
                label={p.label}
                dot={p.chip.dot}
                colors={p.chip}
                selected={form.priority === p.id}
                onPress={() => set({ priority: p.id })}
              />
            ))}
          </PillRow>
        </View>

        <View style={styles.cols}>
          <View style={[styles.field, styles.col]}>
            <Label>{t('ev.date')}</Label>
            <DateField mode="date" value={form.date} onChange={(date) => date && set({ date })} />
          </View>
          <View style={[styles.col, styles.switchBox, { borderColor: alpha(colors.border, 0.7) }]}>
            <Text>{t('ev.allDay')}</Text>
            <Switch value={form.allDay} onValueChange={(allDay) => set({ allDay })} />
          </View>
        </View>

        {!form.allDay && (
          <View style={styles.cols}>
            <View style={[styles.field, styles.col]}>
              <Label>{t('ev.start')}</Label>
              <DateField mode="time" value={form.startTime} onChange={(startTime) => set({ startTime })} />
            </View>
            <View style={[styles.field, styles.col]}>
              <Label>{t('ev.end')}</Label>
              <DateField mode="time" value={form.endTime} onChange={(endTime) => set({ endTime })} />
            </View>
          </View>
        )}

        <View style={styles.cols}>
          <View style={[styles.field, styles.col]}>
            <Label>{t('ev.repeat')}</Label>
            <Select<Repeat>
              value={form.repeat}
              title={t('ev.repeat')}
              options={REPEATS.map((r) => ({ value: r.id, label: r.label }))}
              onChange={(repeat) => set({ repeat })}
            />
          </View>
          <View style={[styles.field, styles.col]}>
            <Label>{t('ev.calendar')}</Label>
            <Select<string>
              value={form.calendarId || 'personal'}
              title={t('ev.calendar')}
              options={[{ value: 'personal', label: t('ev.personalCal') }, ...calendars.map((c) => ({ value: c.id, label: c.name }))]}
              onChange={(v) => set({ calendarId: v === 'personal' ? '' : v })}
            />
          </View>
        </View>

        {form.repeat !== 'none' && (
          <View style={[...boxed, styles.cols]}>
            <View style={[styles.field, styles.col]}>
              <Label>{t('ev.repeatInterval')}</Label>
              <View style={styles.inline}>
                <Input
                  value={String(form.repeatInterval)}
                  onChangeText={(v) => set({ repeatInterval: Math.min(365, Math.max(1, Number(v.replace(/\D/g, '')) || 1)) })}
                  keyboardType="number-pad"
                  style={styles.interval}
                />
                <Text variant="small">{repeatUnitLabel(form.repeat)}</Text>
              </View>
            </View>
            <View style={[styles.field, styles.col]}>
              <Label>{t('ev.repeatEnd')}</Label>
              <DateField mode="date" value={form.repeatEndDate} onChange={(repeatEndDate) => set({ repeatEndDate })} clearable />
            </View>
          </View>
        )}

        <View style={styles.field}>
          <Label>{t('ev.location')}</Label>
          <Input value={form.location} onChangeText={(location) => set({ location })} placeholder={t('ev.locationPh')} maxLength={160} />
        </View>

        <View style={styles.field}>
          <Label>{t('ev.note')}</Label>
          <Textarea
            value={form.description}
            onChangeText={(description) => set({ description })}
            placeholder={t('ev.notePh')}
            numberOfLines={3}
            maxLength={2000}
          />
        </View>

        {editing && occurrence && (
          <View style={[...boxed, styles.field]}>
            <View style={styles.inline}>
              <UserPlus size={16} color={colors.foreground} />
              <Label>{t('inv.label')}</Label>
            </View>
            <InviteFriends eventId={occurrence.id} />
          </View>
        )}

        <View style={styles.field}>
          <Label>{t('ev.reminderLabel')}</Label>
          <PillRow wrap>
            {REMINDER_OPTIONS.map((o) => (
              <Pill key={o.minutes} label={o.label} selected={form.reminderMinutes.includes(o.minutes)} onPress={() => toggleReminder(o.minutes)} />
            ))}
          </PillRow>
          <Text variant="small">
            {t('rem.selected')}:{' '}
            {form.reminderMinutes.length ? form.reminderMinutes.map(reminderLabel).join(', ') : t('rem.default30')}
          </Text>
        </View>

        <View style={[styles.box, { borderColor: alpha(colors.border, 0.7), backgroundColor: alpha(colors.muted, 0.3) }, styles.emailBox]}>
          <View style={styles.between}>
            <View style={styles.emailText}>
              <Mail size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text variant="medium">{t('ev.emailSend')}</Text>
                <Text variant="small">{t('ev.emailDesc')}</Text>
              </View>
            </View>
            <Switch value={form.emailReminder} onValueChange={(emailReminder) => set({ emailReminder })} />
          </View>
          {form.emailReminder && !!form.calendarId && (
            <View style={[styles.between, styles.divider, { borderTopColor: alpha(colors.border, 0.6) }]}>
              <Text style={{ flex: 1 }}>{t('ev.emailAll')}</Text>
              <Switch value={form.emailAll} onValueChange={(emailAll) => set({ emailAll })} />
            </View>
          )}
          {form.emailReminder && !prefs.email_reminders && (
            <View style={styles.warn}>
              <Text variant="small" color="#92400e">
                {t('ev.emailOff')}
              </Text>
            </View>
          )}
        </View>

        {/* Rendered inside the sheet: a sibling modal would open behind it (and not at all on iOS). */}
        <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('ev.deleteTitle')}
        description={t('ev.deleteDesc')}
        busy={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              toast.success(t('ev.toastDeleted'));
              setConfirmOpen(false);
              onClose();
            },
            onError: () => toast.error(t('ev.toastErr')),
          })
        }
        />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  col: { flexGrow: 1, flexBasis: 140 },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADII['2xl'],
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-end',
  },
  box: { borderWidth: 1, borderRadius: RADII['2xl'], padding: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  interval: { width: 96 },
  emailBox: { gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  emailText: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  divider: { borderTopWidth: 1, paddingTop: 12 },
  warn: { borderRadius: RADII.xl, backgroundColor: '#fffbeb', paddingHorizontal: 12, paddingVertical: 8 },
  footer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  footerRight: { flexDirection: 'row', gap: 8 },
});
