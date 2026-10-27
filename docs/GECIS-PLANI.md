# Takvimim — Base44 → React Native (Expo) geçiş planı

Amaç: Base44 + TanStack Start ile yazılmış web uygulamasını, Islamic projesindeki gibi
Expo + Supabase tabanlı bir React Native uygulamasına çevirmek; web'deki tasarımı
(renk paletleri, fontlar, kart/ buton dili, alt gezinme çubuğu) olabildiğince korumak.

Web'in son hâli `web-final` git etiketiyle işaretlidir; görsel referans ve davranış
karşılaştırması için oraya bakılır.

## Teknik kararlar

| Konu | Web | Mobil |
|---|---|---|
| Backend | Base44 entities + server fns | Supabase (Postgres + RLS + Auth + Edge Functions) |
| Yetkili işlemler | `asServiceRole` | `SECURITY DEFINER` RPC |
| Veri çekme | TanStack Query | TanStack Query |
| Yönlendirme | TanStack dosya rotaları | Expo Router (`src/app`) |
| Stil | Tailwind + shadcn | `src/theme` token'ları + `src/ui` kiti (StyleSheet) |
| İkonlar | lucide-react | lucide-react-native |
| Dialog | Radix Dialog | Alt sayfa (`src/ui/Sheet`) |
| Animasyon | framer-motion | react-native-reanimated |
| Grafik | recharts | react-native-svg |
| Toast | sonner | `src/ui/Toast` (aynı `toast.success/error` API) |
| Hatırlatıcı | Base44 cron + e-posta | expo-notifications (yerel) + Supabase Edge Function / pg_cron (e-posta) |

Saf JS mantığı aynen taşınır: `calendar-utils`, `quick-add`, `categories`, `i18n`,
`ics-export`, ICS parser.

## Aşamalar

- [x] **0 — Referans:** web ekranlarının ekran görüntüleri (`docs/referans/`), `web-final` etiketi.
      *Koyu mod görüntüsü yok; sayfa başlıkları görüntülerdeki gibi Instrument Serif.*
- [x] **1 — İskelet + tasarım sistemi:** `src/app` yapısı, app.json / eas.json, font yükleme,
      ThemeProvider, UI kiti, web'in mobil görünümündeki header + 6 sekmeli alt çubuk, lint/tsc/jest.
- [x] **2 — Supabase:** 7 tablo (Calendar, Event, EventInvitation, EventTemplate, Friendship,
      Profile, Task) migration + RLS, RPC'ler (davet koduyla katılma, takvimden ayrılma,
      kodla arkadaş ekleme, davet yanıtlama), auth (e-posta/şifre, OTP, şifre sıfırlama, Google).
      *Kod tamam, PGlite'ta test edildi (`npm run test:db`); gerçek proje kurulumu `supabase/README.md`'de.*
- [x] **3 — Veri katmanı:** her `src/lib/*-fns.js` için `src/services/*.ts`, aynı fonksiyon adları ve dönüş şekli.
      *Servisler + `services/queries.ts` (web'le aynı sorgu anahtarları) + profil ile senkron tercihler.
      Canlı projede okuma doğrulandı (profil, etkinlik, görev, takvim istekleri 200).*
- [x] **4 — Ekranlar:** Auth → AppShell → Takvim (Toolbar, Ay/Hafta/Gün/Ajanda/Yıl, EventChip,
      EventDialog, QuickAdd, CategoryFilter) → Görevler → Hatırlatıcılar → Takvimler + davetler
      → Arkadaşlar → Şablonlar → Analiz → Ayarlar (tema, tercihler, ICS içe/dışa aktarma).
- [x] **5 — Bildirimler:** yerel bildirim planlama; `reminderEmails` → Edge Function + pg_cron.
      *Telefon bildirimleri (14 gün, 60 bildirim sınırı) hazır. E-posta: kod + testler hazır;
      yayına almak için Resend anahtarı ve `supabase/README.md`deki adımlar gerekiyor.*
- [x] **6 — Görsel eşleştirme:** referans görüntülerle yan yana; tüm temalar, koyu mod, küçük ekran, TR/EN.
- [ ] **7 — Veri taşıma (gerekirse):** Base44 export → Supabase import script'i.
      *Yapılmadı: Base44'te taşınacak gerçek veri olmadığı varsayıldı; varsa ayrıca yazılır.*
- [x] **8 — Base44'ten arınma:** `src/`, `base44/`, vite/wrangler, web bağımlılıkları silinir;
      `mobile/` köke taşınır; AGENTS.md / CLAUDE.md / README yeniden yazılır.
- [ ] **9 — Dağıtım:** EAS preview (APK + TestFlight), EAS Update.
