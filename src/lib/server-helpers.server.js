// Sunucu tarafı yardımcılar (yalnızca sunucuda çalışır).

export function randomCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function asArray(result) {
  if (Array.isArray(result)) return result;
  return result?.items ?? [];
}

// Kullanıcının profilini bulur, yoksa oluşturur (kendi adına, ziyaretçi yetkisiyle).
export async function ensureProfile(base44, user) {
  const found = asArray(await base44.entities.Profile.filter({ user_id: user.id }, { limit: 1 }))[0];
  if (found) return found;
  const fallback = (user.full_name || (user.email || "").split("@")[0] || "Kullanıcı").trim();
  return base44.entities.Profile.create({
    user_id: user.id,
    display_name: fallback,
    invite_code: randomCode(6),
    theme: "aurora",
    dark_mode: false,
    week_start: "mon",
    density: "comfortable",
    email_reminders: false,
    default_reminder_minutes: 30,
    default_category: "personal",
  });
}

export async function displayNameOf(base44, user) {
  const profile = asArray(await base44.entities.Profile.filter({ user_id: user.id }, { limit: 1 }))[0];
  return profile?.display_name || user.full_name || (user.email || "").split("@")[0] || "Kullanıcı";
}