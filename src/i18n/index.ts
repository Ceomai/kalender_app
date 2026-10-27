import { useMemo } from 'react';

import { dict } from '@/src/i18n/dictionary';
import { usePreferences } from '@/src/lib/PreferencesContext';
import type { AppLanguage } from '@/src/theme/types';

export const LANGUAGES: { id: AppLanguage; label: string }[] = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'English' },
];

let currentLang: AppLanguage = 'tr';

export function setCurrentLang(lang?: string) {
  currentLang = lang === 'en' ? 'en' : 'tr';
}

export function getCurrentLang() {
  return currentLang;
}

export function tRaw(key: string, lang: string = currentLang) {
  return dict[lang]?.[key] ?? dict.tr[key] ?? key;
}

export type Translate = ((key: string) => string) & { lang: string };

export function useT(): Translate {
  const { prefs } = usePreferences();
  const lang = prefs.language || 'tr';
  return useMemo(
    () => Object.assign((key: string) => dict[lang]?.[key] ?? dict.tr[key] ?? key, { lang }),
    [lang],
  );
}
