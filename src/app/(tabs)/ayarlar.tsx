import { AlertTriangle, Moon, Sun } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PageHeader } from '@/src/components/layout/PageHeader';
import { Screen } from '@/src/components/layout/Screen';
import { ICSImport } from '@/src/components/settings/ICSImport';
import { PreferencePanel } from '@/src/components/settings/PreferencePanel';
import { PreferenceRow } from '@/src/components/settings/PreferenceRow';
import { ThemePicker } from '@/src/components/settings/ThemePicker';
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/lib/AuthContext';
import { usePreferences } from '@/src/lib/PreferencesContext';
import { wipeAccount } from '@/src/services/profiles';
import { useServiceMutation } from '@/src/services/queries';
import { useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { SectionCard } from '@/src/ui/Card';
import { ConfirmDialog } from '@/src/ui/ConfirmDialog';
import { Input } from '@/src/ui/Input';
import { Label } from '@/src/ui/Label';
import { Switch } from '@/src/ui/Switch';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const t = useT();
  const { prefs, update } = usePreferences();
  const { user, logout } = useAuth();
  // null = untouched, so the field follows the saved name until the user edits it.
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const name = draft ?? prefs.display_name;

  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(id);
  }, [saved]);

  const remove = useServiceMutation(() => wipeAccount(), []);

  return (
    <Screen>
      <PageHeader eyebrow={t('set.eyebrow')} title={t('set.title')} intro={t('set.intro')} />

      <SectionCard title={t('set.profile')} description={t('set.profileDesc')}>
        <View style={styles.field}>
          <Label>{t('set.displayName')}</Label>
          <View style={styles.inline}>
            <Input value={name} onChangeText={setDraft} placeholder={t('set.displayNamePh')} style={styles.flex} maxLength={60} />
            <Button
              disabled={!name.trim()}
              onPress={() => {
                update({ display_name: name.trim() });
                setDraft(null);
                setSaved(true);
              }}
            >
              {saved ? t('act.saved') : t('act.save')}
            </Button>
          </View>
        </View>
        <Text variant="small" style={styles.mt}>
          {t('set.accountEmail')}: {user?.email}
        </Text>
      </SectionCard>

      <SectionCard title={t('set.design')} description={t('set.designDesc')}>
        <View style={styles.stack}>
          <ThemePicker />
          <PreferenceRow
            icon={prefs.dark_mode ? Moon : Sun}
            title={t('set.darkMode')}
            description={t('set.darkModeDesc')}
            trailing={<Switch value={prefs.dark_mode} onValueChange={(dark_mode) => update({ dark_mode })} />}
          />
        </View>
      </SectionCard>

      <SectionCard title={t('set.viewReminder')} description={t('set.viewReminderDesc')}>
        <PreferencePanel />
      </SectionCard>

      <SectionCard title={t('ics.title')} description={t('ics.desc')}>
        <ICSImport />
      </SectionCard>

      <SectionCard title={t('set.deleteAccount')} description={t('set.deleteAccountDesc')}>
        <View style={styles.deleteRow}>
          <View style={styles.deleteText}>
            <AlertTriangle size={16} color={colors.destructiveText} style={{ marginTop: 2 }} />
            <View style={styles.flex}>
              <Text variant="medium">{t('set.deleteMe')}</Text>
              <Text variant="small">{t('set.deleteMeDesc')}</Text>
            </View>
          </View>
          <Button variant="destructive" onPress={() => setConfirmDelete(true)}>
            {t('set.deleteBtn')}
          </Button>
        </View>
      </SectionCard>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('set.deleteConfirmTitle')}
        description={t('set.deleteConfirmDesc')}
        confirmLabel={remove.isPending ? t('act.deleting') : t('act.confirmDelete')}
        busy={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: async () => {
              setConfirmDelete(false);
              await logout().catch(() => {});
            },
            onError: () => toast.error(t('ev.toastErr')),
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  inline: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1, width: undefined, minWidth: 0 },
  mt: { marginTop: 12 },
  stack: { gap: 16 },
  deleteRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  deleteText: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexGrow: 1, flexShrink: 1, flexBasis: 220 },
});
