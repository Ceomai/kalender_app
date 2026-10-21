import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { updatePreferences } from "@/lib/profile-fns";
import { setCurrentLang } from "@/lib/i18n";

export const DEFAULT_PREFS = {
  theme: "aurora",
  dark_mode: false,
  week_start: "mon",
  density: "comfortable",
  default_view: "month",
  time_format: "24h",
  email_reminders: false,
  default_reminder_minutes: 30,
  default_category: "personal",
  display_name: "",
  language: "tr",
};

const THEME_CLASSES = [
  "theme-aurora",
  "theme-sunset",
  "theme-forest",
  "theme-ocean",
  "theme-berry",
  "theme-mono",
];

const PreferencesContext = createContext(null);

// Kullanıcının tasarım tercihlerini tutar ve görünüme uygular.
export function PreferencesProvider({ initial, children }) {
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...(initial || {}) }));
  const save = useServerFn(updatePreferences);

  useEffect(() => {
    const root = document.documentElement;
    const theme = prefs.theme || "aurora";
    THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`theme-${theme}`);
    root.classList.toggle("dark", !!prefs.dark_mode);
  }, [prefs.theme, prefs.dark_mode]);

  // Etiket modüllerinin dil duyarlı getirileri için dili senkronize et.
  setCurrentLang(prefs.language || "tr");

  const update = useCallback(
    async (patch) => {
      setPrefs((prev) => ({ ...prev, ...patch }));
      await save({ data: patch });
    },
    [save],
  );

  const value = useMemo(() => ({ prefs, update }), [prefs, update]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences bir PreferencesProvider içinde kullanılmalı");
  return value;
}