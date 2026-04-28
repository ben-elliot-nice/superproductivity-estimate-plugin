export function formatTime(ms: number): string {
  if (ms <= 0) return '—';
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes === 0) return '—';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
