import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Trash2, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CodeBox, MONO } from '@/src/components/common/CodeBox';
import { PageHeader } from '@/src/components/layout/PageHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useT } from '@/src/i18n';
import { addFriendByCode, removeFriend } from '@/src/services/friends';
import { rotateInviteCode, type MySpace } from '@/src/services/profiles';
import { queryKeys, useFriends, useMySpace, useServiceMutation } from '@/src/services/queries';
import { RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { SectionCard } from '@/src/ui/Card';
import { Input } from '@/src/ui/Input';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

const REASON_KEYS: Record<string, string> = { not_found: 'fr.add.notFound', self: 'fr.add.self', exists: 'fr.add.exists' };

function Feedback({ ok, text }: { ok: boolean; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.feedback, { backgroundColor: ok ? '#ecfdf5' : alpha(colors.destructive, 0.1) }]}>
      <Text variant="small" color={ok ? '#047857' : colors.destructiveText}>
        {text}
      </Text>
    </View>
  );
}

function AddFriendByCode() {
  const t = useT();
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const add = useServiceMutation(() => addFriendByCode(code.trim()), [queryKeys.friends]);

  const submit = () =>
    add.mutate(undefined, {
      onSuccess: (res) => {
        if (res.ok) {
          setCode('');
          setFeedback({ ok: true, text: t('fr.add.ok').replace('{name}', res.friend.name) });
        } else {
          setFeedback({ ok: false, text: REASON_KEYS[res.reason] ? t(REASON_KEYS[res.reason]) : t('fr.add.fail') });
        }
      },
      onError: () => setFeedback({ ok: false, text: t('fr.add.failRetry') }),
    });

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Input
          value={code}
          onChangeText={(v) => {
            setCode(v.toUpperCase());
            setFeedback(null);
          }}
          placeholder={t('fr.add.ph')}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          style={[styles.codeInput, { fontFamily: MONO }]}
          returnKeyType="go"
          onSubmitEditing={() => code.trim().length >= 4 && submit()}
        />
        <Button icon={UserPlus} disabled={code.trim().length < 4} loading={add.isPending} onPress={submit}>
          {add.isPending ? t('fr.add.adding') : t('fr.add.btn')}
        </Button>
      </View>
      {feedback && <Feedback {...feedback} />}
    </View>
  );
}

function FriendList() {
  const { colors } = useTheme();
  const t = useT();
  const { data: friends = [], isPending } = useFriends();
  const remove = useServiceMutation((id: string) => removeFriend(id), [queryKeys.friends]);

  if (isPending) {
    return (
      <Text variant="muted" style={styles.center}>
        {t('common.loading')}
      </Text>
    );
  }
  if (friends.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border }]}>
        <Text variant="heading" style={styles.emptyTitle}>
          {t('fr.list.empty')}
        </Text>
        <Text variant="muted" style={styles.center}>
          {t('fr.list.emptyDesc')}
        </Text>
      </View>
    );
  }
  return (
    <View>
      {friends.map((f, i) => (
        <View
          key={f.id}
          style={[styles.friend, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: alpha(colors.border, 0.6) }]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Users size={16} color={colors.accentForeground} />
          </View>
          <View style={styles.flex}>
            <Text variant="medium" numberOfLines={1}>
              {f.name}
            </Text>
            <Text variant="small">
              {t('fr.list.addedOn').replace('{date}', new Date(f.created_date).toLocaleDateString(t.lang === 'en' ? 'en-US' : 'tr-TR'))}
            </Text>
          </View>
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel={t('fr.list.remove')}
            disabled={remove.isPending}
            onPress={() => remove.mutate(f.id, { onSuccess: () => toast.success(t('fr.list.removed')) })}
          >
            <Trash2 size={16} color={colors.destructiveText} />
          </Button>
        </View>
      ))}
    </View>
  );
}

export default function FriendsScreen() {
  const t = useT();
  const queryClient = useQueryClient();
  const profile = useMySpace().data?.profile;
  const rotate = useServiceMutation(() => rotateInviteCode(), []);

  return (
    <Screen>
      <PageHeader eyebrow={t('fr.eyebrow')} title={t('fr.title')} intro={t('fr.intro')} />

      <SectionCard
        title={t('fr.codeTitle')}
        description={t('fr.codeDesc')}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={rotate.isPending}
            onPress={() =>
              rotate.mutate(undefined, {
                onSuccess: (saved) => {
                  queryClient.setQueryData<MySpace>(queryKeys.mySpace, (old) => (old ? { ...old, profile: saved } : old));
                  toast.success(t('fr.toastRotated'));
                },
              })
            }
          >
            {t('fr.refresh')}
          </Button>
        }
      >
        <CodeBox code={profile?.invite_code || '------'} label={t('fr.codeLabel')} />
      </SectionCard>

      <SectionCard title={t('fr.addTitle')}>
        <AddFriendByCode />
      </SectionCard>

      <SectionCard title={t('fr.listTitle')} description={t('fr.listDesc')}>
        <FriendList />
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  codeInput: { flexGrow: 1, flexBasis: 180, width: undefined, letterSpacing: 2 },
  feedback: { borderRadius: RADII.xl, paddingHorizontal: 12, paddingVertical: 8 },
  center: { textAlign: 'center', paddingVertical: 4 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: RADII['2xl'], paddingHorizontal: 20, paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 14 },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
});
