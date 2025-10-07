import type { TimeBlock } from "@/lib/db/schema/time-blocks";

/**
 * Check if two time ranges overlap
 * Two ranges overlap if: (start1 < end2) AND (start2 < end1)
 */
export function doTimeRangesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string,
): boolean {
  // Normalize timestamps to remove timezone information for local comparison
  const normalizeTimestamp = (timestamp: Date | string): string => {
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    // Remove timezone suffix (Z or +00:00) to treat all times as local
    // This handles:
    // - "2025-10-08T03:00:00.000Z" → "2025-10-08T03:00:00.000"
    // - "2025-10-08T03:00" → "2025-10-08T03:00"
    // - "2025-10-08 03:00:00" → "2025-10-08T03:00:00"
    let normalized = timestamp.replace(" ", "T"); // PostgreSQL format
    normalized = normalized.replace(/Z$/, ""); // Remove UTC marker
    normalized = normalized.replace(/[+-]\d{2}:\d{2}$/, ""); // Remove timezone offset
    return normalized;
  };

  const s1 = new Date(normalizeTimestamp(start1)).getTime();
  const e1 = new Date(normalizeTimestamp(end1)).getTime();
  const s2 = new Date(normalizeTimestamp(start2)).getTime();
  const e2 = new Date(normalizeTimestamp(end2)).getTime();

  return s1 < e2 && s2 < e1;
}

/**
 * Find all time blocks that conflict with a given time block
 * @param timeBlocks - Array of existing time blocks to check against
 * @param targetBlock - The time block to check for conflicts
 * @returns Array of conflicting time blocks
 */
export function findConflicts(
  timeBlocks: TimeBlock[],
  targetBlock: { startTime: string; endTime: string; id?: string },
): TimeBlock[] {
  return timeBlocks.filter((block) => {
    // Skip self-comparison when editing existing block
    if (targetBlock.id && block.id === targetBlock.id) {
      return false;
    }

    return doTimeRangesOverlap(
      targetBlock.startTime,
      targetBlock.endTime,
      block.startTime,
      block.endTime,
    );
  });
}
