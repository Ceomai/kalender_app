import { router } from 'expo-router';
import { Check, Clock, Layers, MapPin, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { PageHeader } from '@/src/components/layout/PageHeader';
import { Screen } from '@/src/components/layout/Screen';
import { TemplateDialog, durationLabel } from '@/src/components/templates/TemplateDialog';
import { categoryOf, priorityOf } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { queryKeys, useServiceMutation, useTemplates } from '@/src/services/queries';
import { applyTemplate, deleteTemplate } from '@/src/services/templates';
import type { EventTemplate } from '@/src/services/types';
import { FONTS, RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { ConfirmDialog } from '@/src/ui/ConfirmDialog';
import { LoadingCard } from '@/src/ui/EmptyState';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

function Badge({ children, colors: c }: { children: React.ReactNode; colors?: { bg: string; border: string } }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, c ? { backgroundColor: c.bg, borderColor: c.border } : { borderColor: alpha(colors.border, 0.6) }]}>
      {children}
    </View>
  );
}

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const t = useT();
  const { width } = useWindowDimensions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<EventTemplate | null>(null);
  const templatesQuery = useTemplates();
  const templates = templatesQuery.data ?? [];

  const apply = useServiceMutation((tpl: EventTemplate) => applyTemplate(tpl.id), [queryKeys.events, queryKeys.upcoming]);
  const remove = useServiceMutation((tpl: EventTemplate) => deleteTemplate(tpl.id), [queryKeys.templates]);

  return (
    <Screen>
      <PageHeader
        eyebrow={t('tpl.eyebrow')}
        title={t('tpl.title')}
        intro={t('tpl.intro')}
        action={
          <Button icon={Plus} onPress={() => setDialogOpen(true)}>
            {t('tpl.new')}
          </Button>
        }
      />

      {templatesQuery.isPending ? (
        <LoadingCard />
      ) : templates.length === 0 ? (
        <View style={[styles.empty, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Layers size={24} color={colors.mutedForeground} />
          </View>
          <Text variant="medium">{t('tpl.empty')}</Text>
          <Text variant="small" style={{ textAlign: 'center' }}>
            {t('tpl.emptyDesc')}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {templates.map((tpl) => {
            const cat = categoryOf(tpl.category);
            const prio = priorityOf(tpl.priority);
            const Icon = cat.icon;
            return (
              <View
                key={tpl.id}
                style={[
                  styles.card,
                  { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card, flexBasis: width >= 640 ? '48%' : '100%' },
                ]}
              >
                <View style={styles.head}>
                  <View style={[styles.icon, { backgroundColor: cat.chip.dot }]}>
                    <Icon size={20} color="#ffffff" />
                  </View>
                  <View style={styles.names}>
                    <Text variant="semibold" numberOfLines={1}>
                      {tpl.name}
                    </Text>
                    <Text variant="small" numberOfLines={1}>
                      {tpl.title}
                    </Text>
                  </View>
                </View>
                <View style={styles.badges}>
                  <Badge colors={prio.chip}>
                    <View style={[styles.dot, { backgroundColor: prio.chip.dot }]} />
                    <Text style={[styles.badgeText, { color: prio.chip.fg }]}>{prio.label}</Text>
                  </Badge>
                  <Badge>
                    {!tpl.all_day && <Clock size={12} color={colors.mutedForeground} />}
                    <Text variant="small" style={styles.badgeText}>
                      {tpl.all_day ? t('tpl.allDay') : durationLabel(t, tpl.duration_minutes)}
                    </Text>
                  </Badge>
                  {!!tpl.location && (
                    <Badge>
                      <MapPin size={12} color={colors.mutedForeground} />
                      <Text variant="small" style={styles.badgeText} numberOfLines={1}>
                        {tpl.location}
                      </Text>
                    </Badge>
                  )}
                </View>
                <View style={styles.actions}>
                  <Button
                    size="sm"
                    icon={Check}
                    style={styles.flex}
                    disabled={apply.isPending}
                    onPress={() =>
                      apply.mutate(tpl, {
                        onSuccess: () => {
                          toast.success(t('tpl.toastCreated'));
                          router.navigate('/');
                        },
                        onError: () => toast.error(t('tpl.toastErr')),
                      })
                    }
                  >
                    {t('tpl.use')}
                  </Button>
                  <Button size="sm" variant="outline" onPress={() => setToDelete(tpl)}>
                    {t('act.delete')}
                  </Button>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <TemplateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('tpl.deleteTitle')}
        description={t('tpl.deleteDesc').replace('{name}', toDelete?.name ?? '')}
        confirmLabel={t('act.delete')}
        busy={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete, { onSuccess: () => setToDelete(null) })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { borderWidth: 1, borderRadius: RADII['3xl'], paddingHorizontal: 20, paddingVertical: 64, alignItems: 'center', gap: 4 },
  emptyIcon: { width: 48, height: 48, borderRadius: RADII['2xl'], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: { borderWidth: 1, borderRadius: RADII['2xl'], padding: 16 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: RADII.xl, alignItems: 'center', justifyContent: 'center' },
  names: { flex: 1, minWidth: 0 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: RADII.full, paddingHorizontal: 8, paddingVertical: 2, maxWidth: '100%' },
  badgeText: { fontFamily: FONTS.bodyMedium, fontSize: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  flex: { flex: 1 },
});
