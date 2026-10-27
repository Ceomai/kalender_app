import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PreferenceRow } from '@/src/components/settings/PreferenceRow';
import { CATEGORIES, REMINDER_OPTIONS } from '@/src/constants/categories';
import { LANGUAGES, useT } from '@/src/i18n';
import { usePreferences } from '@/src/lib/PreferencesContext';
import type { AppLanguage, CalendarView, Density, TimeFormat, WeekStart } from '@/src/theme/types';
import { Label } from '@/src/ui/Label';
import { Pill, PillRow, Segmented } from '@/src/ui/Pill';
import { Switch } from '@/src/ui/Switch';
import { Text } from '@/src/ui/Text';

/** Text on the left, control on the right; wraps under on narrow screens. */
function Row({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text variant="medium">{title}</Text>
        <Text variant="small">{description}</Text>
      </View>
      {children}
    </View>
  );
}

/** Web `PreferencePanel`: language, density, week start, default view, time format, reminders. */
export function PreferencePanel() {
  const { prefs, update } = usePreferences();
  const t = useT();

  return (
    <View style={styles.stack}>
      <Row title={t('pp.language')} description={t('pp.languageDesc')}>
        <Segmented<AppLanguage>
          value={prefs.language}
          options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
          onChange={(language) => update({ language })}
        />
      </Row>
      <Row title={t('pp.density')} description={t('pp.densityDesc')}>
        <Segmented<Density>
          value={prefs.density}
          options={[
            { value: 'comfortable', label: t('pp.density.comf') },
            { value: 'compact', label: t('pp.density.compact') },
          ]}
          onChange={(density) => update({ density })}
        />
      </Row>
      <Row title={t('pp.weekStart')} description={t('pp.weekStartDesc')}>
        <Segmented<WeekStart>
          value={prefs.week_start}
          options={[
            { value: 'mon', label: t('pp.weekStart.mon') },
            { value: 'sun', label: t('pp.weekStart.sun') },
          ]}
          onChange={(week_start) => update({ week_start })}
        />
      </Row>
      <Row title={t('pp.defaultView')} description={t('pp.defaultViewDesc')}>
        <Segmented<CalendarView>
          value={prefs.default_view}
          options={(['month', 'week', 'day', 'agenda', 'year'] as CalendarView[]).map((v) => ({ value: v, label: t(`view.${v}`) }))}
          onChange={(default_view) => update({ default_view })}
        />
      </Row>
      <Row title={t('pp.timeFormat')} description={t('pp.timeFormatDesc')}>
        <Segmented<TimeFormat>
          value={prefs.time_format}
          options={[
            { value: '24h', label: t('pp.timeFormat.24') },
            { value: '12h', label: t('pp.timeFormat.12') },
          ]}
          onChange={(time_format) => update({ time_format })}
        />
      </Row>

      <View style={styles.field}>
        <Label>{t('pp.defaultReminder')}</Label>
        <PillRow wrap>
          {REMINDER_OPTIONS.map((o) => (
            <Pill
              key={o.minutes}
              label={o.label}
              selected={prefs.default_reminder_minutes === o.minutes}
              onPress={() => update({ default_reminder_minutes: o.minutes })}
            />
          ))}
        </PillRow>
      </View>

      <View style={styles.field}>
        <Label>{t('pp.defaultCategory')}</Label>
        <PillRow wrap>
          {CATEGORIES.map((c) => (
            <Pill
              key={c.id}
              label={c.label}
              icon={c.icon}
              colors={c.chip}
              selected={prefs.default_category === c.id}
              onPress={() => update({ default_category: c.id })}
            />
          ))}
        </PillRow>
      </View>

      <PreferenceRow
        title={t('pp.emailReminders')}
        description={t('pp.emailRemindersDesc')}
        trailing={<Switch value={prefs.email_reminders} onValueChange={(email_reminders) => update({ email_reminders })} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 20 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  text: { flexGrow: 1, flexShrink: 1, flexBasis: 200 },
  field: { gap: 8 },
});
