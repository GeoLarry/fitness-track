// e.g. "1 h 05 min" or "48 min".
export function workoutDuration(seconds: number | null): string {
  if (seconds === null) return '';
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${(minutes % 60).toString().padStart(2, '0')} min` : `${minutes} min`;
}
