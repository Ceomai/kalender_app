import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, Clock, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { dayKey, formatTime, parseDateInput } from '@/src/lib/calendar-utils';
import { useT } from '@/src/i18n';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { FONTS, RADII, SHADOWS, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Sheet } from '@/src/ui/Sheet';
import { Text } from '@/src/ui/Text';

export type DateFieldProps = {
  mode: 'date' | 'time';
  /** "YYYY-MM-DD" for dates, "HH:MM" for times; "" when empty (dates only). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shows a clear button for optional dates. */
  clearable?: boolean;
};

function toDate(mode: 'date' | 'time', value: string) {
  if (mode === 'date') return value ? parseDateInput(value) : new Date();
  const [h, m] = (value || '09:00').split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function display(mode: 'date' | 'time', value: string, lang: string) {
  if (!value) return '';
  if (mode === 'time') return value;
  return parseDateInput(value).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Input-looking field (web `<Input type="date|time">`) that opens the platform picker. */
export function DateField({ mode, value, onChange, placeholder, clearable }: DateFieldProps) {
  const { colors } = useTheme();
  const { prefs } = usePreferences();
  const t = useT();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(() => toDate(mode, value));
  const Icon = mode === 'date' ? Calendar : Clock;

  const commit = (d: Date) => onChange(mode === 'date' ? dayKey(d) : formatTime(d));

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(mode, value),
        mode,
        is24Hour: prefs.time_format !== '12h',
        onChange: (event, date) => {
          if (event.type === 'set' && date) commit(date);
        },
      });
    } else {
      setDraft(toDate(mode, value));
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable onPress={open} style={[styles.field, { borderColor: colors.input }]} accessibilityRole="button">
        <Text style={[styles.value, { color: value ? colors.foreground : colors.mutedForeground }]}>
          {display(mode, value, t.lang) || placeholder || (mode === 'date' ? 'gg.aa.yyyy' : '--:--')}
        </Text>
        {clearable && value ? (
          <Pressable hitSlop={8} onPress={() => onChange('')} accessibilityLabel="Temizle">
            <X size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : (
          <Icon size={16} color={colors.foreground} />
        )}
      </Pressable>
      {Platform.OS === 'ios' && (
        <Sheet
          open={iosOpen}
          onClose={() => setIosOpen(false)}
          footer={
            <Button
              onPress={() => {
                commit(draft);
                setIosOpen(false);
              }}
            >
              {t('act.save')}
            </Button>
          }
        >
          <View style={styles.picker}>
            <DateTimePicker
              value={draft}
              mode={mode}
              display={mode === 'date' ? 'inline' : 'spinner'}
              locale={t.lang === 'en' ? 'en-GB' : 'tr-TR'}
              accentColor={colors.primary}
              themeVariant={prefs.dark_mode ? 'dark' : 'light'}
              onChange={(_, date) => date && setDraft(date)}
            />
          </View>
        </Sheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    boxShadow: SHADOWS.sm,
  },
  value: { fontFamily: FONTS.body, fontSize: 14 },
  picker: { alignItems: 'center' },
});
