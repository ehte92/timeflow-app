import { Temporal } from "temporal-polyfill";
import type { Task } from "@/lib/db/schema/tasks";
import type { TimeBlock } from "@/lib/db/schema/time-blocks";

// ScheduleX calendar event type
export interface CalendarEvent {
  id: string;
  start: Temporal.ZonedDateTime | Temporal.PlainDate;
  end: Temporal.ZonedDateTime | Temporal.PlainDate;
  title: string;
  description?: string;
  calendarId: string; // Used for color coding
}

// Calendar IDs for color coding
export const CALENDAR_IDS = {
  // Task priorities
  TASK_CRITICAL: "task-critical",
  TASK_HIGH: "task-high",
  TASK_MEDIUM: "task-medium",
  TASK_LOW: "task-low",

  // Time block types
  TIMEBLOCK_SCHEDULED: "timeblock-scheduled",
  TIMEBLOCK_ACTUAL: "timeblock-actual",
  TIMEBLOCK_BREAK: "timeblock-break",
} as const;

// Transform a task into a calendar event
export function transformTaskToEvent(task: Task): CalendarEvent | null {
  // Only show tasks with due dates
  if (!task.dueDate) {
    return null;
  }

  const dueDate = new Date(task.dueDate);

  // Determine calendar ID based on priority
  let calendarId: string;
  switch (task.priority) {
    case "urgent":
      calendarId = CALENDAR_IDS.TASK_CRITICAL;
      break;
    case "high":
      calendarId = CALENDAR_IDS.TASK_HIGH;
      break;
    case "medium":
      calendarId = CALENDAR_IDS.TASK_MEDIUM;
      break;
    default:
      calendarId = CALENDAR_IDS.TASK_LOW;
      break;
  }

  // Check if it's an all-day task (time is exactly midnight UTC)
  const isAllDay =
    dueDate.getUTCHours() === 0 &&
    dueDate.getUTCMinutes() === 0 &&
    dueDate.getUTCSeconds() === 0;

  let start: Temporal.PlainDate | Temporal.ZonedDateTime;
  let end: Temporal.PlainDate | Temporal.ZonedDateTime;

  if (isAllDay) {
    // For all-day tasks, use Temporal.PlainDate
    start = Temporal.PlainDate.from({
      year: dueDate.getFullYear(),
      month: dueDate.getMonth() + 1,
      day: dueDate.getDate(),
    });
    end = start; // Same day for all-day events
  } else {
    // For timed tasks, use Temporal.ZonedDateTime
    start = Temporal.Instant.fromEpochMilliseconds(
      dueDate.getTime(),
    ).toZonedDateTimeISO("UTC");

    // Default duration: 1 hour
    const endInstant = Temporal.Instant.fromEpochMilliseconds(
      dueDate.getTime() + 60 * 60 * 1000,
    );
    end = endInstant.toZonedDateTimeISO("UTC");
  }

  return {
    id: `task-${task.id}`,
    start,
    end,
    title: task.title,
    description: task.description || undefined,
    calendarId,
  };
}

// Transform a time block into a calendar event
export function transformTimeBlockToEvent(timeBlock: TimeBlock): CalendarEvent {
  const startDate = new Date(timeBlock.startTime);
  const endDate = new Date(timeBlock.endTime);

  // Determine calendar ID based on type
  let calendarId: string;
  switch (timeBlock.type) {
    case "scheduled":
      calendarId = CALENDAR_IDS.TIMEBLOCK_SCHEDULED;
      break;
    case "actual":
      calendarId = CALENDAR_IDS.TIMEBLOCK_ACTUAL;
      break;
    case "break":
      calendarId = CALENDAR_IDS.TIMEBLOCK_BREAK;
      break;
    default:
      calendarId = CALENDAR_IDS.TIMEBLOCK_SCHEDULED;
  }

  // Convert to Temporal.ZonedDateTime (time blocks are always timed events)
  const start = Temporal.Instant.fromEpochMilliseconds(
    startDate.getTime(),
  ).toZonedDateTimeISO("UTC");

  const end = Temporal.Instant.fromEpochMilliseconds(
    endDate.getTime(),
  ).toZonedDateTimeISO("UTC");

  return {
    id: `timeblock-${timeBlock.id}`,
    start,
    end,
    title: timeBlock.title || `${timeBlock.type} time block`,
    description: timeBlock.description || undefined,
    calendarId,
  };
}

// Merge tasks and time blocks into a single array of calendar events
export function mergeCalendarEvents(
  tasks: Task[] = [],
  timeBlocks: TimeBlock[] = [],
): CalendarEvent[] {
  const taskEvents = tasks
    .map(transformTaskToEvent)
    .filter((event): event is CalendarEvent => event !== null);

  const timeBlockEvents = timeBlocks.map(transformTimeBlockToEvent);

  return [...taskEvents, ...timeBlockEvents];
}
