import {
  Briefcase,
  Cake,
  CreditCard,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Plane,
  Sun,
  Tag,
  User,
  Users,
} from "lucide-react";
import { tRaw } from "@/lib/i18n";

// Her kategori: kimlik, ikon ve görünüm renkleri. Etiketler dile duyarlı.
export const CATEGORIES = [
  {
    id: "personal",
    icon: User,
    chip: "border-violet-200 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
    solid: "bg-violet-500",
    get label() { return tRaw("cat.personal"); },
  },
  {
    id: "work",
    icon: Briefcase,
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    solid: "bg-sky-500",
    get label() { return tRaw("cat.work"); },
  },
  {
    id: "meeting",
    icon: Users,
    chip: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
    solid: "bg-indigo-500",
    get label() { return tRaw("cat.meeting"); },
  },
  {
    id: "birthday",
    icon: Cake,
    chip: "border-pink-200 bg-pink-50 text-pink-700",
    dot: "bg-pink-500",
    solid: "bg-pink-500",
    get label() { return tRaw("cat.birthday"); },
  },
  {
    id: "health",
    icon: HeartPulse,
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    solid: "bg-rose-500",
    get label() { return tRaw("cat.health"); },
  },
  {
    id: "payment",
    icon: CreditCard,
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    solid: "bg-amber-500",
    get label() { return tRaw("cat.payment"); },
  },
  {
    id: "education",
    icon: GraduationCap,
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    dot: "bg-teal-500",
    solid: "bg-teal-500",
    get label() { return tRaw("cat.education"); },
  },
  {
    id: "travel",
    icon: Plane,
    chip: "border-cyan-200 bg-cyan-50 text-cyan-700",
    dot: "bg-cyan-500",
    solid: "bg-cyan-500",
    get label() { return tRaw("cat.travel"); },
  },
  {
    id: "sport",
    icon: Dumbbell,
    chip: "border-lime-200 bg-lime-50 text-lime-700",
    dot: "bg-lime-500",
    solid: "bg-lime-500",
    get label() { return tRaw("cat.sport"); },
  },
  {
    id: "holiday",
    icon: Sun,
    chip: "border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
    solid: "bg-orange-500",
    get label() { return tRaw("cat.holiday"); },
  },
  {
    id: "other",
    icon: Tag,
    chip: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
    solid: "bg-slate-400",
    get label() { return tRaw("cat.other"); },
  },
];

export const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

export function categoryOf(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP.other;
}

export const PRIORITIES = [
  { id: "low", chip: "border-slate-200 bg-slate-50 text-slate-600", dot: "bg-slate-400", get label() { return tRaw("pr.low"); } },
  { id: "medium", chip: "border-sky-200 bg-sky-50 text-sky-700", dot: "bg-sky-500", get label() { return tRaw("pr.medium"); } },
  { id: "high", chip: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500", get label() { return tRaw("pr.high"); } },
  { id: "urgent", chip: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500", get label() { return tRaw("pr.urgent"); } },
];

export const PRIORITY_MAP = PRIORITIES.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

export function priorityOf(id) {
  return PRIORITY_MAP[id] || PRIORITY_MAP.medium;
}

export const REPEATS = [
  { id: "none", get label() { return tRaw("rep.none"); } },
  { id: "daily", get label() { return tRaw("rep.daily"); } },
  { id: "weekly", get label() { return tRaw("rep.weekly"); } },
  { id: "biweekly", get label() { return tRaw("rep.biweekly"); } },
  { id: "monthly", get label() { return tRaw("rep.monthly"); } },
  { id: "yearly", get label() { return tRaw("rep.yearly"); } },
];

// Tekrar sıklığı için birim etiketi.
export function repeatUnitLabel(repeat) {
  if (repeat === "daily") return tRaw("unit.daily");
  if (repeat === "weekly") return tRaw("unit.weekly");
  if (repeat === "biweekly") return tRaw("unit.biweekly");
  if (repeat === "monthly") return tRaw("unit.monthly");
  if (repeat === "yearly") return tRaw("unit.yearly");
  return "";
}

export const REMINDER_OPTIONS = [
  { minutes: 0, get label() { return tRaw("rem.0"); } },
  { minutes: 10, get label() { return tRaw("rem.10"); } },
  { minutes: 30, get label() { return tRaw("rem.30"); } },
  { minutes: 60, get label() { return tRaw("rem.60"); } },
  { minutes: 180, get label() { return tRaw("rem.180"); } },
  { minutes: 1440, get label() { return tRaw("rem.1440"); } },
  { minutes: 2880, get label() { return tRaw("rem.2880"); } },
  { minutes: 10080, get label() { return tRaw("rem.10080"); } },
];

function fmt(key, n) {
  return tRaw(key).replace("{n}", n);
}

export function reminderLabel(minutes) {
  const found = REMINDER_OPTIONS.find((o) => o.minutes === minutes);
  if (found) return found.label;
  if (minutes % 1440 === 0) return fmt("rem.fmt.days", minutes / 1440);
  if (minutes % 60 === 0) return fmt("rem.fmt.hours", minutes / 60);
  return fmt("rem.fmt.mins", minutes);
}

export const CALENDAR_COLORS = [
  { id: "violet", dot: "bg-violet-500", ring: "border-violet-400 bg-violet-50 text-violet-700", get label() { return tRaw("col.violet"); } },
  { id: "sky", dot: "bg-sky-500", ring: "border-sky-400 bg-sky-50 text-sky-700", get label() { return tRaw("col.sky"); } },
  { id: "emerald", dot: "bg-emerald-500", ring: "border-emerald-400 bg-emerald-50 text-emerald-700", get label() { return tRaw("col.emerald"); } },
  { id: "amber", dot: "bg-amber-500", ring: "border-amber-400 bg-amber-50 text-amber-700", get label() { return tRaw("col.amber"); } },
  { id: "rose", dot: "bg-rose-500", ring: "border-rose-400 bg-rose-50 text-rose-700", get label() { return tRaw("col.rose"); } },
  { id: "slate", dot: "bg-slate-500", ring: "border-slate-400 bg-slate-50 text-slate-700", get label() { return tRaw("col.slate"); } },
];

export function calendarColor(id) {
  return CALENDAR_COLORS.find((c) => c.id === id) || CALENDAR_COLORS[0];
}

export const THEMES = [
  { id: "aurora", swatch: "bg-violet-500", get label() { return tRaw("th.aurora"); }, get hint() { return tRaw("th.hint.aurora"); } },
  { id: "sunset", swatch: "bg-orange-500", get label() { return tRaw("th.sunset"); }, get hint() { return tRaw("th.hint.sunset"); } },
  { id: "forest", swatch: "bg-emerald-600", get label() { return tRaw("th.forest"); }, get hint() { return tRaw("th.hint.forest"); } },
  { id: "ocean", swatch: "bg-sky-600", get label() { return tRaw("th.ocean"); }, get hint() { return tRaw("th.hint.ocean"); } },
  { id: "berry", swatch: "bg-rose-500", get label() { return tRaw("th.berry"); }, get hint() { return tRaw("th.hint.berry"); } },
  { id: "mono", swatch: "bg-slate-700", get label() { return tRaw("th.mono"); }, get hint() { return tRaw("th.hint.mono"); } },
];