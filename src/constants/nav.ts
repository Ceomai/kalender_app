import type { Href } from 'expo-router';
import { BellRing, CalendarDays, CheckSquare, Settings, Share2, Users, type LucideIcon } from 'lucide-react-native';

import { tRaw } from '@/src/i18n';

export type NavKey = 'calendar' | 'tasks' | 'reminders' | 'shared' | 'friends' | 'settings';

export type NavItem = {
  href: Href;
  /** Screen name inside `src/app/(tabs)/`. */
  route: string;
  key: NavKey;
  icon: LucideIcon;
  get label(): string;
};

// Same order and icons as the web `src/lib/nav.js`.
export const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    route: 'index',
    key: 'calendar',
    icon: CalendarDays,
    get label() {
      return tRaw('nav.calendar');
    },
  },
  {
    href: '/gorevler',
    route: 'gorevler',
    key: 'tasks',
    icon: CheckSquare,
    get label() {
      return tRaw('nav.tasks');
    },
  },
  {
    href: '/hatirlaticilar',
    route: 'hatirlaticilar',
    key: 'reminders',
    icon: BellRing,
    get label() {
      return tRaw('nav.reminders');
    },
  },
  {
    href: '/takvimler',
    route: 'takvimler',
    key: 'shared',
    icon: Share2,
    get label() {
      return tRaw('nav.shared');
    },
  },
  {
    href: '/arkadaslar',
    route: 'arkadaslar',
    key: 'friends',
    icon: Users,
    get label() {
      return tRaw('nav.friends');
    },
  },
  {
    href: '/ayarlar',
    route: 'ayarlar',
    key: 'settings',
    icon: Settings,
    get label() {
      return tRaw('nav.settings');
    },
  },
];
