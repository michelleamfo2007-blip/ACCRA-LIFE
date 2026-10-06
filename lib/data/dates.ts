import { addDays, parseISODate, sameDay, startOfDay, toISODate } from "@/lib/format";
import type { EventSlot, WindowKey } from "@/lib/types";

export function dateForSlot(slot: EventSlot, now = new Date()) {
  const today = startOfDay(now);
  const day = today.getDay();
  const saturday = (6 - day + 7) % 7;
  const sunday = (7 - day) % 7;
  const offsets: Record<EventSlot, number> = {
    today: 0,
    "today-late": 0,
    tomorrow: 1,
    "tomorrow-late": 1,
    plus2: 2,
    plus3: 3,
    plus4: 4,
    sat: saturday,
    sun: sunday,
    plus10: 10,
    plus12: 12,
    plus14: 14,
    plus20: 20,
  };
  return toISODate(addDays(today, offsets[slot]));
}

export function weekendDates(now = new Date()) {
  const today = startOfDay(now);
  const day = today.getDay();
  if (day === 0) return [today];
  if (day === 6) return [today, addDays(today, 1)];
  const saturday = addDays(today, 6 - day);
  return [saturday, addDays(saturday, 1)];
}

export function windowsFor(isoDate: string, now = new Date()): WindowKey[] {
  const today = startOfDay(now);
  const date = parseISODate(isoDate);
  const day = today.getDay();
  const tomorrow = addDays(today, 1);
  const endOfWeek = addDays(today, (7 - day) % 7);
  const keys: WindowKey[] = [];
  if (sameDay(date, today)) keys.push("today");
  if (sameDay(date, tomorrow)) keys.push("tomorrow");
  if (weekendDates(today).some((weekendDay) => sameDay(date, weekendDay))) keys.push("weekend");
  if (date >= today && date <= endOfWeek) keys.push("week");
  if (date > endOfWeek) keys.push("upcoming");
  return keys;
}
