import { router } from 'expo-router';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  ListFilter,
  MoreHorizontal,
  Plus,
  Rows3,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PageHeader } from '@/src/components/layout/PageHeader';
import { useT } from '@/src/i18n';
import { VIEWS, rangeTitle } from '@/src/lib/calendar-utils';
import { FONTS, RADII, alpha, useTheme } from '@/src/theme';
import type { CalendarView, WeekStart } from '@/src/theme/types';
import { Button } from '@/src/ui/Button';
import { Segmented } from '@/src/ui/Pill';
import { Sheet } from '@/src/ui/Sheet';
import { Text } from '@/src/ui/Text';

export type RangeShortcut = 'today' | 'week' | 'month' | 'quarter';
const RANGE_SHORTCUTS: RangeShortcut[] = ['today', 'week', 'month', 'quarter'];

type Props = {
  view: CalendarView;
  cursor: Date;
  weekStart: WeekStart;
  detailed: boolean;
  onViewChange: (view: CalendarView) => void;
  onShift: (direction: number) => void;
  onToday: () => void;
  onRangeShortcut: (id: RangeShortcut) => void;
  onToggleDetail: () => void;
  onCreate: () => void;
  onQuickAdd: () => void;
  onExport: () => void;
};

function OutlinePill({ icon: Icon, label, onPress }: { icon?: LucideIcon; label?: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.outlinePill,
        { borderColor: alpha(colors.border, 0.7), backgroundColor: pressed ? colors.accent : alpha(colors.card, 0.7) },
      ]}
    >
      {Icon && <Icon size={14} color={colors.foreground} />}
      {label && <Text style={styles.outlineText}>{label}</Text>}
    </Pressable>
  );
}

function MenuItem({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.accent }]}>
      <Icon size={16} color={colors.foreground} />
      <Text>{label}</Text>
    </Pressable>
  );
}

export function Toolbar(props: Props) {
  const { view, cursor, weekStart, detailed } = props;
  const { colors } = useTheme();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <View style={styles.stack}>
      <PageHeader eyebrow={t('brand')} title={rangeTitle(view, cursor, weekStart)} />

      <View style={styles.actions}>
        <Button variant="outline" size="icon" icon={ChevronLeft} accessibilityLabel={t('act.prev')} onPress={() => props.onShift(-1)} />
        <Button variant="outline" size="sm" onPress={props.onToday}>
          {t('act.today')}
        </Button>
        <Button variant="outline" size="icon" icon={ChevronRight} accessibilityLabel={t('act.next')} onPress={() => props.onShift(1)} />
        <Button variant="outline" size="sm" onPress={props.onQuickAdd} accessibilityLabel={t('act.quick')}>
          <Zap size={16} color="#f59e0b" />
          <Text style={styles.btnText}>{t('act.quick')}</Text>
        </Button>
        <Button size="sm" icon={Plus} onPress={props.onCreate} style={styles.push}>
          {t('act.new')}
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Segmented<CalendarView> value={view} options={VIEWS.map((v) => ({ value: v.id, label: v.label }))} onChange={props.onViewChange} />
        <OutlinePill
          icon={detailed ? Rows3 : ListFilter}
          label={detailed ? t('act.detailed') : t('act.simple')}
          onPress={props.onToggleDetail}
        />
        <Sparkles size={14} color={colors.mutedForeground} />
        {RANGE_SHORTCUTS.map((id) => (
          <Pressable
            key={id}
            onPress={() => props.onRangeShortcut(id)}
            style={({ pressed }) => [
              styles.shortcut,
              { borderColor: alpha(colors.border, 0.6), backgroundColor: pressed ? colors.accent : 'transparent' },
            ]}
          >
            <Text style={[styles.shortcutText, { color: colors.mutedForeground }]}>{t(`range.${id}`)}</Text>
          </Pressable>
        ))}
        <OutlinePill icon={MoreHorizontal} label={t('act.more')} onPress={() => setMenuOpen(true)} />
      </ScrollView>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <View style={styles.menu}>
          <MenuItem icon={BarChart3} label={t('toolbar.analysis')} onPress={go(() => router.navigate('/analiz'))} />
          <MenuItem icon={Layers} label={t('toolbar.templates')} onPress={go(() => router.navigate('/sablonlar'))} />
          <MenuItem icon={Download} label={t('act.export')} onPress={go(props.onExport)} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  push: { marginLeft: 'auto' },
  btnText: { fontFamily: FONTS.bodyMedium, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  outlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADII.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  outlineText: { fontFamily: FONTS.bodySemi, fontSize: 12 },
  shortcut: { borderWidth: 1, borderRadius: RADII.full, paddingHorizontal: 12, paddingVertical: 6 },
  shortcutText: { fontFamily: FONTS.bodyMedium, fontSize: 12 },
  menu: { gap: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 8, borderRadius: RADII.sm },
});
