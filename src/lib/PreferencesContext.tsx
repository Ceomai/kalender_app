import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setCurrentLang } from '@/src/i18n';
import { useAuth } from '@/src/lib/AuthContext';
import { updatePreferences, type MySpace } from '@/src/services/profiles';
import { queryKeys, useMySpace } from '@/src/services/queries';
import type { Profile } from '@/src/services/types';
import { resolveColors } from '@/src/theme/palettes';
import { DEFAULT_PREFS, type AppPreferences, type ColorTokens } from '@/src/theme/types';

const STORAGE_KEY = '@takvimim/preferences';

type PreferencesContextValue = {
  prefs: AppPreferences;
  colors: ColorTokens;
  ready: boolean;
  update: (patch: Partial<AppPreferences>) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function fromProfile(profile: Profile): AppPreferences {
  const prefs = { ...DEFAULT_PREFS };
  for (const key of Object.keys(DEFAULT_PREFS) as (keyof AppPreferences)[]) {
    if (profile[key] !== undefined && profile[key] !== null) (prefs as Record<string, unknown>)[key] = profile[key];
  }
  return prefs;
}

/**
 * Design and reminder preferences. Signed in, the profile row is the source of truth
 * (as on the web); a copy is cached on the device so the right theme shows at start-up
 * and on the auth screens.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const mySpace = useMySpace();
  const [local, setLocal] = useState<AppPreferences>(DEFAULT_PREFS);
  const [localReady, setLocalReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw && !cancelled) setLocal({ ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<AppPreferences>) });
      })
      .catch(() => {
        // Keep defaults if storage is empty or corrupt.
      })
      .finally(() => {
        if (!cancelled) setLocalReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const profile = isAuthenticated ? mySpace.data?.profile : undefined;
  const prefs = useMemo(() => (profile ? fromProfile(profile) : local), [profile, local]);

  // Keep the device copy in step with the account.
  useEffect(() => {
    if (profile) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [profile, prefs]);

  setCurrentLang(prefs.language);

  const update = useCallback(
    async (patch: Partial<AppPreferences>) => {
      setLocal((prev) => {
        const next = { ...prev, ...patch };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      if (!isAuthenticated) return;
      // Optimistic: show the change at once, then store it on the profile.
      queryClient.setQueryData<MySpace>(queryKeys.mySpace, (old) =>
        old ? { ...old, profile: { ...old.profile, ...patch } } : old,
      );
      try {
        const saved = await updatePreferences(patch);
        queryClient.setQueryData<MySpace>(queryKeys.mySpace, (old) => (old ? { ...old, profile: saved } : old));
      } catch (err) {
        // Roll back to what the server has; screens call update() without awaiting it.
        console.warn('[preferences] save failed', err);
        await queryClient.invalidateQueries({ queryKey: queryKeys.mySpace });
      }
    },
    [isAuthenticated, queryClient],
  );

  const colors = useMemo(() => resolveColors(prefs.theme, prefs.dark_mode), [prefs.theme, prefs.dark_mode]);

  // Signed in: wait for the profile (or its failure) so the first screen has the right theme.
  const ready = localReady && (!isAuthenticated || !mySpace.isPending);

  const value = useMemo(() => ({ prefs, colors, ready, update }), [prefs, colors, ready, update]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside PreferencesProvider');
  return value;
}
