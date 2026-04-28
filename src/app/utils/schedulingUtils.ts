import type { Task } from '../types'; // used in distributeSubtaskTimes / hasScheduledSubtasks

export interface DayChip {
  label: string;
  date: Date; // midnight local time on that day
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function getDayChips(): DayChip[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()];
    return { label, date: d };
  });
}

export function getTimestamp(date: Date, hour: number): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    0,
    0,
    0,
  ).getTime();
}

export type ScheduleTiming = 'today' | 'tomorrow' | 'this-week' | 'future' | 'overdue';

export function getScheduleTiming(dueWithTime: number): ScheduleTiming {
  const now = new Date();
  const d = new Date(dueWithTime);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return 'this-week';
  return 'future';
}

export function formatScheduledDate(dueWithTime: number): string {
  const d = new Date(dueWithTime);
  const now = new Date();
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const time = `${hour}:${min}`;
  const day = DAY_NAMES[d.getDay()];

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) return `Today ${time}`;
  if (diffDays === 1) return `Tomorrow ${time}`;
  if (diffDays > 1 && diffDays < 7) return `${day} This Week ${time}`;

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${day} ${dd}/${mm} ${time}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Distribute sequential start times to subtasks starting from a given timestamp.
 * Subtasks with no estimate are skipped (not scheduled).
 */
export function distributeSubtaskTimes(
  subtasks: Task[],
  startTimestamp: number,
): { id: string; dueWithTime: number }[] {
  const results: { id: string; dueWithTime: number }[] = [];
  let cursor = startTimestamp;
  for (const sub of subtasks) {
    const estimate = sub.timeEstimate ?? 0;
    if (estimate > 0) {
      results.push({ id: sub.id, dueWithTime: cursor });
      cursor += estimate;
    }
  }
  return results;
}

export function hasScheduledSubtasks(subtasks: Task[]): boolean {
  return subtasks.some((t) => !!t.dueWithTime);
}
