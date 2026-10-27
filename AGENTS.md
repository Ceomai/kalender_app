This is **Takvimim**, an Expo/React Native calendar app (TypeScript) backed by Supabase. It was ported from a Base44 web app (git tag `web-final`), keeping that app's design. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

Known SDK 58 details in this project:
- Tabs come from `expo-router/js-tabs`; the custom tab bar receives `navigateToTab(routeKey)`, not `navigation`.
- Do not hide a tab with `href: null` — it removes the route from navigation. `BottomNav` lists only `NAV_ITEMS`, so extra tab routes (`analiz`, `sablonlar`) are simply not shown.
- The auth gate is `Stack.Protected` in `src/app/_layout.tsx`; the signed-out screens sit at the root (`login.tsx`, …), not in a group, so the gate can redirect to `/login`.
- TypeScript 6 does not load global types by default; `tsconfig.json` lists `"types": ["jest"]`.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # dev server (npm run web for the browser preview)
npm run check               # tsc + expo lint + jest + database tests — run before declaring a task done
npm run test:db             # Supabase migrations + RLS scenarios in PGlite (no Docker needed)
npx expo-doctor             # diagnose dependency and config issues
```

## Layout

- `src/app/` — Expo Router screens. `(tabs)/` is the signed-in app (header + `BottomNav`); `login`, `register`, `forgot-password`, `reset-password` are the signed-out screens.
- `src/components/` — feature components (calendar, tasks, templates, calendars, settings, layout, auth).
- `src/ui/` — the design kit (Button, Card, Input, Sheet, Select, Pill, Segmented, Switch, DateField, Toast…). Values mirror the web's shadcn/Tailwind classes; keep new UI consistent with it.
- `src/theme/` — palettes (6 themes × light/dark), `useTheme()`, `RADII`, `SHADOWS`, `alpha()`. Use `colors.destructiveText` for red text/icons (the dark palettes' `destructive` is a background shade).
- `src/services/` — data layer, one file per former Base44 server-function file, same function names and return shapes. `queries.ts` has the TanStack Query hooks and keys.
- `src/lib/` — Supabase client and auth, preferences (synced to the `profiles` row), i18n-aware date helpers, quick-add parser, ICS import/export, local notifications.
- `src/i18n/dictionary.ts` — every string in Turkish and English; a test fails when an English key is missing.
- `supabase/` — migrations, the `reminder-emails` Edge Function, e-mail templates, `config.toml`, PGlite tests. See `supabase/README.md`.

## Supabase rules

- Every change to the schema is a new file in `supabase/migrations/`; never edit an applied migration. Add scenarios to `supabase/tests/rls.test.mjs` and run `npm run test:db`.
- Clients get column-level grants only. Owners, viewers (`visible_to`), calendar snapshots and membership are derived by triggers or changed through `SECURITY DEFINER` RPCs that check `auth.uid()` themselves.
- The app uses only the anon key (`.env`, `EXPO_PUBLIC_*`). Never put the service role key in the app.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `npx eas-cli@latest <command>`.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries.
- Modals: render a confirmation inside the sheet it belongs to; a sibling `Modal` opened over another one does not show on iOS.
