import { BellRing, CalendarDays, CheckSquare, Settings, Share2, Users } from "lucide-react";
import { tRaw } from "@/lib/i18n";

export const NAV_ITEMS = [
  { to: "/", key: "calendar", icon: CalendarDays, get label() { return tRaw("nav.calendar"); } },
  { to: "/gorevler", key: "tasks", icon: CheckSquare, get label() { return tRaw("nav.tasks"); } },
  { to: "/hatirlaticilar", key: "reminders", icon: BellRing, get label() { return tRaw("nav.reminders"); } },
  { to: "/takvimler", key: "shared", icon: Share2, get label() { return tRaw("nav.shared"); } },
  { to: "/arkadaslar", key: "friends", icon: Users, get label() { return tRaw("nav.friends"); } },
  { to: "/ayarlar", key: "settings", icon: Settings, get label() { return tRaw("nav.settings"); } },
];