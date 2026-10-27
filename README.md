# Takvimim

Takvim, görev ve hatırlatma uygulaması — React Native (Expo) + Supabase.
Base44 üzerindeki web uygulamasından taşındı; tasarım aynen korundu (web'in son hâli: `web-final` etiketi).

## Özellikler

- Ay / hafta / gün / ajanda / yıl görünümleri, tekrarlayan kayıtlar, kategori ve öncelik
- Doğal dille hızlı ekleme ("Toplantı yarın 15:00 acil @ Ofis")
- Görevler, şablonlar, zaman analizi
- Ortak takvimler (katılım kodu), arkadaşlar, etkinlik davetleri
- Telefon bildirimleri ve e-posta hatırlatmaları
- 6 renk teması, koyu mod, Türkçe / İngilizce
- ICS içe / dışa aktarma

## Geliştirme

```bash
npm install
cp .env.example .env      # Supabase URL ve anon anahtarını yazın
npx expo start            # Expo Go veya geliştirme derlemesi
npm run web               # tarayıcı önizlemesi
npm run check             # typecheck + lint + birim testleri + veritabanı testleri
```

Backend kurulumu (migration'lar, e-posta, Google girişi): [supabase/README.md](supabase/README.md).
Geçiş planı ve durumu: [docs/GECIS-PLANI.md](docs/GECIS-PLANI.md).
