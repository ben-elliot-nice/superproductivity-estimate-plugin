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

export function formatScheduledDate(dueWithTime: number): string {
  const d = new Date(dueWithTime);
  const day = DAY_NAMES[d.getDay()];
  const hour = String(d.getHours()).padStart(2, '0');
  return `${day} ${hour}:00`;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
