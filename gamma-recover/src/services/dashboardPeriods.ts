import type { Database } from '../types/domain';
import { addDays, addMonths, today } from '../utils/format';
export type DashboardPeriod = '1' | '3' | '6' | 'all';
export const localDay = (value: string) =>
  value.length === 10
    ? value
    : new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(value));
export const dayDistance = (start: string, end: string) =>
  Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
export const inRange = (value: string, start: string, end: string) =>
  localDay(value) >= start && localDay(value) <= end;
export function dashboardWindow(db: Database, period: DashboardPeriod, asOf = today()) {
  const history = [
    ...db.agreements.map((a) => a.createdAt),
    ...db.installments.flatMap((i) => (i.paidAt ? [i.paidAt] : [])),
    ...db.contacts.map((c) => localDay(c.date)),
  ]
    .filter((d) => d <= asOf)
    .sort();
  const start =
    period === 'all' ? history[0] || asOf : addMonths(asOf.slice(0, 7) + '-01', 1 - Number(period));
  const days = dayDistance(start, asOf) + 1;
  return {
    start,
    end: asOf,
    days,
    previousStart: period === 'all' ? undefined : addDays(start, -days),
    previousEnd: period === 'all' ? undefined : addDays(start, -1),
  };
}
export function dashboardBuckets(
  window: ReturnType<typeof dashboardWindow>,
  period: DashboardPeriod,
) {
  const result: {
    start: string;
    end: string;
    previousStart?: string;
    previousEnd?: string;
    label: string;
  }[] = [];
  const monthCount =
    (Number(window.end.slice(0, 4)) - Number(window.start.slice(0, 4))) * 12 +
    Number(window.end.slice(5, 7)) -
    Number(window.start.slice(5, 7)) +
    1;
  let cursor = window.start;
  while (cursor <= window.end) {
    const next =
      period === '1'
        ? addDays(cursor, Math.max(1, Math.ceil(window.days / 8)))
        : addMonths(cursor.slice(0, 7) + '-01', Math.max(1, Math.ceil(monthCount / 12)));
    const end = next > window.end ? window.end : addDays(next, -1);
    const offset = dayDistance(window.start, cursor);
    result.push({
      start: cursor,
      end,
      previousStart: window.previousStart ? addDays(window.previousStart, offset) : undefined,
      previousEnd: window.previousStart
        ? addDays(window.previousStart, offset + dayDistance(cursor, end))
        : undefined,
      label: new Date(cursor + 'T12:00:00').toLocaleDateString(
        'pt-BR',
        period === '1' ? { day: '2-digit', month: '2-digit' } : { month: 'short', year: '2-digit' },
      ),
    });
    cursor = next;
  }
  return result;
}
