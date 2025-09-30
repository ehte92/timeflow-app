/**
 * Formats minutes to human-readable time format (e.g., "2h 30m", "45m", "3h")
 * @param minutes - The number of minutes to format
 * @returns Formatted time string
 */
export function formatMinutesToTime(
  minutes: number | null | undefined,
): string {
  if (!minutes || minutes === 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Calculates the progress percentage based on estimated and actual time
 * @param estimated - Estimated time in minutes
 * @param actual - Actual time spent in minutes
 * @returns Progress percentage (0-100), capped at 100
 */
export function calculateTimeProgress(
  estimated: number | null | undefined,
  actual: number | null | undefined,
): number {
  if (!estimated || !actual) return 0;
  return Math.min(Math.round((actual / estimated) * 100), 100);
}
