import { DateTime } from 'luxon';

export function getUpcomingRaidWindow(now: DateTime): { start: DateTime; end: DateTime } {
  const weekday = now.weekday;
  const daysUntilNextWednesday = ((3 - weekday + 7) % 7) || 7;
  const start = now.plus({ days: daysUntilNextWednesday }).startOf('day');
  const end = start.plus({ days: 6 }).endOf('day');

  return { start, end };
}

export function getCurrentRaidWindow(now: DateTime): { start: DateTime; end: DateTime } {
  const daysSinceWednesday = (now.weekday - 3 + 7) % 7;
  const start = now.minus({ days: daysSinceWednesday }).startOf('day');
  const end = start.plus({ days: 6 }).endOf('day');

  return { start, end };
}

export function getRaidDates(start: DateTime): DateTime[] {
  return Array.from({ length: 7 }, (_, index) => start.plus({ days: index }));
}

export function formatWindowId(start: DateTime, end: DateTime): string {
  return `${start.toFormat('yyyy-LL-dd')}_${end.toFormat('yyyy-LL-dd')}`;
}
