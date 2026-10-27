import { BarChart3, CalendarClock, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Bars, Donut } from '@/src/components/analytics/Charts';
import { PageHeader } from '@/src/components/layout/PageHeader';
import { Screen } from '@/src/components/layout/Screen';
import { categoryOf } from '@/src/constants/categories';
import { tRaw, useT } from '@/src/i18n';
import { weekdayShort } from '@/src/lib/calendar-utils';
import type { Period } from '@/src/services/analytics';
import { useAnalytics } from '@/src/services/queries';
import { FONTS, RADII, alpha, useTheme } from '@/src/theme';
import { LoadingCard } from '@/src/ui/EmptyState';
import { Segmented } from '@/src/ui/Pill';
import { Text } from '@/src/ui/Text';

export function formatHours(minutes: number) {
  if (!minutes) return tRaw('an.hours0');
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return tRaw('an.min').replace('{n}', String(m));
  if (m === 0) return tRaw('an.hr').replace('{n}', String(h));
  return tRaw('an.hm').replace('{h}', String(h)).replace('{m}', String(m));
}

function Stat({ icon: Icon, tint, label, value }: { icon: LucideIcon; tint: string; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: alpha(tint, 0.1) }]}>
        <Icon size={16} color={tint} />
      </View>
      <Text variant="small" style={{ fontFamily: FONTS.bodyMedium, fontSize: 11 }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const t = useT();
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState<Period>('week');
  const { data, isPending } = useAnalytics(period);

  const dayLabels = Array.from({ length: 7 }, (_, i) => weekdayShort(i));
  const pieData = (data?.categories ?? []).map((c) => ({
    key: c.category,
    name: categoryOf(c.category).label,
    value: c.minutes,
    count: c.count,
    color: categoryOf(c.category).chip.dot,
  }));
  const card = [styles.card, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }];

  return (
    <Screen>
      <PageHeader eyebrow={t('an.eyebrow')} title={t('an.title')} intro={t('an.intro')} />
      <Segmented<Period>
        value={period}
        onChange={setPeriod}
        options={(['week', 'month', 'year'] as Period[]).map((id) => ({ value: id, label: t(`an.period.${id}`) }))}
      />

      {isPending || !data ? (
        <LoadingCard />
      ) : (
        <>
          <View style={styles.stats}>
            <Stat icon={CalendarClock} tint={colors.primary} label={t('an.totalTime')} value={formatHours(data.totalMinutes)} />
            <Stat icon={BarChart3} tint="#059669" label={t('an.events')} value={String(data.totalEvents)} />
            <Stat icon={TrendingUp} tint="#d97706" label={t('an.busiestDay')} value={dayLabels[data.busiestDay]} />
          </View>

          <View style={[styles.charts, width >= 1024 && styles.row]}>
            <View style={card}>
              <Text variant="semibold" style={styles.cardTitle}>
                {t('an.byCategory')}
              </Text>
              {pieData.length === 0 || data.totalMinutes === 0 ? (
                <Text variant="small" style={styles.noData}>
                  {t('an.noData')}
                </Text>
              ) : (
                <View style={[styles.pie, width >= 640 && styles.row]}>
                  <Donut data={pieData} />
                  <View style={styles.legend}>
                    {pieData.map((d) => (
                      <View key={d.key} style={styles.legendRow}>
                        <View style={styles.legendName}>
                          <View style={[styles.swatch, { backgroundColor: d.color }]} />
                          <Text style={styles.legendText}>{d.name}</Text>
                        </View>
                        <Text variant="small">
                          {formatHours(d.value)} · {d.count}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={card}>
              <Text variant="semibold" style={styles.cardTitle}>
                {t('an.byDay')}
              </Text>
              <Bars data={data.days.map((d) => ({ label: dayLabels[d.day], value: d.minutes }))} />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: RADII['2xl'], padding: 14 },
  statIcon: { width: 32, height: 32, borderRadius: RADII.md - 4, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontFamily: FONTS.heading, fontSize: 17, lineHeight: 24 },
  charts: { gap: 16 },
  row: { flexDirection: 'row' },
  card: { flex: 1, borderWidth: 1, borderRadius: RADII['2xl'], padding: 16 },
  cardTitle: { marginBottom: 12 },
  noData: { textAlign: 'center', paddingVertical: 40 },
  pie: { alignItems: 'center', gap: 16 },
  legend: { alignSelf: 'stretch', flexGrow: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  legendName: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
});
