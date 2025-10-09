"use client";

import {
  createViewDay,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import { createResizePlugin } from "@schedule-x/resize";
import "temporal-polyfill/global";
import "@schedule-x/theme-default/dist/index.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConflictPopover } from "@/components/calendar/conflict-popover";
import { TimeBlockDetailPanel } from "@/components/time-blocks/time-block-detail-panel";
import { TimeBlockFormSheet } from "@/components/time-blocks/time-block-form-sheet";
import { CALENDAR_IDS, mergeCalendarEvents } from "@/lib/calendar/events";
import { useTasks, useUpdateTask } from "@/lib/query/hooks/tasks";
import {
  useTimeBlocks,
  useUpdateTimeBlock,
} from "@/lib/query/hooks/time-blocks";
import { CalendarHelpBanner } from "./calendar-help-banner";
import { CalendarToolbar } from "./calendar-toolbar";

interface ScheduleXCalendarComponentProps {
  onCreateTimeBlock?: () => void;
}

export function ScheduleXCalendarComponent({
  onCreateTimeBlock: externalOnCreateTimeBlock,
}: ScheduleXCalendarComponentProps = {}) {
  const eventsService = useMemo(() => createEventsServicePlugin(), []);
  const calendarControls = useMemo(() => createCalendarControlsPlugin(), []);
  const dragAndDrop = useMemo(() => createDragAndDropPlugin(15), []); // 15-minute intervals
  const resize = useMemo(() => createResizePlugin(15), []); // 15-minute intervals
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [timeBlockDialogOpen, setTimeBlockDialogOpen] = useState(false);
  const [defaultStartTime, setDefaultStartTime] = useState<string | undefined>(
    undefined,
  );
  const [defaultEndTime, setDefaultEndTime] = useState<string | undefined>(
    undefined,
  );
  const [selectedTimeBlockId, setSelectedTimeBlockId] = useState<string | null>(
    null,
  );
  const [timeBlockDetailOpen, setTimeBlockDetailOpen] = useState(false);

  // Popover state for conflict messages
  const [conflictPopover, setConflictPopover] = useState<{
    isOpen: boolean;
    anchorElement: HTMLElement | null;
    conflictInfo: {
      conflictCount: number;
      conflictingEvents: Array<{
        title: string;
        startTime: string;
        endTime: string;
      }>;
    } | null;
  }>({
    isOpen: false,
    anchorElement: null,
    conflictInfo: null,
  });

  // Mutation hooks for updating tasks and time blocks
  const updateTask = useUpdateTask();
  const updateTimeBlock = useUpdateTimeBlock();

  // Calculate date range for fetching data (current month +/- 1 month for buffer)
  const dateRange = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, []);

  // Fetch tasks with due dates in the date range
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    dueDateFrom: dateRange.startDate,
    dueDateTo: dateRange.endDate,
    limit: 1000, // Get all tasks in range
  });

  // Fetch time blocks in the date range
  const { data: timeBlocksData, isLoading: timeBlocksLoading } = useTimeBlocks({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    limit: 1000, // Get all time blocks in range
  });

  // Transform and merge events
  const calendarEvents = useMemo(() => {
    const tasks = tasksData?.tasks || [];
    const timeBlocks = timeBlocksData?.timeBlocks || [];
    return mergeCalendarEvents(tasks, timeBlocks);
  }, [tasksData, timeBlocksData]);

  const handleSelectedDateUpdate = useCallback((date: Temporal.PlainDate) => {
    setSelectedDate(date.toString());
  }, []);

  const handleEventClick = useCallback((calendarEvent: any) => {
    console.log("Event clicked:", calendarEvent);

    // Parse event ID to determine type
    const eventId = String(calendarEvent.id);
    const isTask = eventId.startsWith("task-");
    const isTimeBlock = eventId.startsWith("timeblock-");

    if (isTimeBlock) {
      // Extract time block ID and open detail panel
      const timeBlockId = eventId.replace("timeblock-", "");
      setSelectedTimeBlockId(timeBlockId);
      setTimeBlockDetailOpen(true);
    } else if (isTask) {
      // TODO: Open task detail panel (future enhancement)
      console.log("Task clicked - task detail panel not yet implemented");
    }
  }, []);

  const handleEventUpdate = useCallback(
    (updatedEvent: any) => {
      console.log("Event updated:", updatedEvent);

      // Parse event ID to determine entity type
      const eventId = String(updatedEvent.id);
      const isTask = eventId.startsWith("task-");
      const isTimeBlock = eventId.startsWith("timeblock-");

      if (!isTask && !isTimeBlock) {
        console.error("Unknown event type:", eventId);
        return;
      }

      // Extract entity ID
      const entityId = isTask
        ? eventId.replace("task-", "")
        : eventId.replace("timeblock-", "");

      // Convert event date/time to ISO strings
      // Schedule-X returns objects with epochMilliseconds
      const getISOString = (dateTime: any): string => {
        if (dateTime.epochMilliseconds) {
          return new Date(dateTime.epochMilliseconds).toISOString();
        }
        // Fallback for PlainDate (all-day events)
        if (dateTime.year && dateTime.month && dateTime.day) {
          return new Date(
            dateTime.year,
            dateTime.month - 1,
            dateTime.day,
          ).toISOString();
        }
        throw new Error("Invalid date/time format from calendar event");
      };

      const startTime = getISOString(updatedEvent.start);
      const endTime = getISOString(updatedEvent.end);

      // Update the appropriate entity
      if (isTask) {
        updateTask.mutate(
          {
            id: entityId,
            data: {
              dueDate: startTime,
            },
          },
          {
            onError: (error) => {
              console.error("Failed to update task:", error);
              // TODO: Add toast notification
            },
          },
        );
      } else {
        updateTimeBlock.mutate(
          {
            id: entityId,
            data: {
              startTime,
              endTime,
            },
          },
          {
            onError: (error) => {
              console.error("Failed to update time block:", error);
              // TODO: Add toast notification
            },
          },
        );
      }
    },
    [updateTask, updateTimeBlock],
  );

  // Handle double-click on date (month view) to create time block
  const handleDoubleClickDate = useCallback((date: Temporal.PlainDate) => {
    // Set start time to 9 AM on clicked date
    const startDate = new Date(date.year, date.month - 1, date.day, 9, 0, 0);
    // Set end time to 10 AM (1 hour later)
    const endDate = new Date(date.year, date.month - 1, date.day, 10, 0, 0);

    setDefaultStartTime(startDate.toISOString());
    setDefaultEndTime(endDate.toISOString());
    setTimeBlockDialogOpen(true);
  }, []);

  // Handle double-click on date-time (week/day view) to create time block
  const handleDoubleClickDateTime = useCallback(
    (dateTime: Temporal.ZonedDateTime) => {
      // Get the clicked time as start time
      const startDate = new Date(dateTime.epochMilliseconds);
      // Set end time to 1 hour later
      const endDate = new Date(dateTime.epochMilliseconds + 60 * 60 * 1000);

      setDefaultStartTime(startDate.toISOString());
      setDefaultEndTime(endDate.toISOString());
      setTimeBlockDialogOpen(true);
    },
    [],
  );

  // Handle manual time block creation from toolbar button
  const handleCreateTimeBlock = useCallback(() => {
    // Use external handler if provided (for mobile header integration)
    if (externalOnCreateTimeBlock) {
      externalOnCreateTimeBlock();
      return;
    }

    // Default to current time rounded to next hour
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const hourAfter = new Date(nextHour);
    hourAfter.setHours(nextHour.getHours() + 1);

    setDefaultStartTime(nextHour.toISOString());
    setDefaultEndTime(hourAfter.toISOString());
    setTimeBlockDialogOpen(true);
  }, [externalOnCreateTimeBlock]);

  const calendar = useNextCalendarApp({
    views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
    // Don't set events here - use eventsService.set() instead for drag-and-drop to work
    plugins: [eventsService, calendarControls, dragAndDrop, resize],
    defaultView: "month-grid",
    calendars: {
      // Task priorities
      [CALENDAR_IDS.TASK_CRITICAL]: {
        colorName: "task-critical",
        lightColors: {
          main: "#ef4444",
          container: "#fee2e2",
          onContainer: "#7f1d1d",
        },
        darkColors: {
          main: "#fca5a5",
          container: "#7f1d1d",
          onContainer: "#fef2f2",
        },
      },
      [CALENDAR_IDS.TASK_HIGH]: {
        colorName: "task-high",
        lightColors: {
          main: "#f97316",
          container: "#ffedd5",
          onContainer: "#7c2d12",
        },
        darkColors: {
          main: "#fdba74",
          container: "#7c2d12",
          onContainer: "#fff7ed",
        },
      },
      [CALENDAR_IDS.TASK_MEDIUM]: {
        colorName: "task-medium",
        lightColors: {
          main: "#eab308",
          container: "#fef9c3",
          onContainer: "#713f12",
        },
        darkColors: {
          main: "#fde047",
          container: "#713f12",
          onContainer: "#fefce8",
        },
      },
      [CALENDAR_IDS.TASK_LOW]: {
        colorName: "task-low",
        lightColors: {
          main: "#22c55e",
          container: "#dcfce7",
          onContainer: "#14532d",
        },
        darkColors: {
          main: "#86efac",
          container: "#14532d",
          onContainer: "#f0fdf4",
        },
      },
      // Time block types
      [CALENDAR_IDS.TIMEBLOCK_SCHEDULED]: {
        colorName: "timeblock-scheduled",
        lightColors: {
          main: "#3b82f6",
          container: "#dbeafe",
          onContainer: "#1e3a8a",
        },
        darkColors: {
          main: "#93c5fd",
          container: "#1e3a8a",
          onContainer: "#eff6ff",
        },
      },
      [CALENDAR_IDS.TIMEBLOCK_ACTUAL]: {
        colorName: "timeblock-actual",
        lightColors: {
          main: "#10b981",
          container: "#d1fae5",
          onContainer: "#064e3b",
        },
        darkColors: {
          main: "#6ee7b7",
          container: "#064e3b",
          onContainer: "#ecfdf5",
        },
      },
      [CALENDAR_IDS.TIMEBLOCK_BREAK]: {
        colorName: "timeblock-break",
        lightColors: {
          main: "#64748b",
          container: "#e2e8f0",
          onContainer: "#1e293b",
        },
        darkColors: {
          main: "#cbd5e1",
          container: "#1e293b",
          onContainer: "#f8fafc",
        },
      },
    },
    callbacks: {
      onSelectedDateUpdate: handleSelectedDateUpdate,
      onEventClick: handleEventClick,
      onEventUpdate: handleEventUpdate,
      onDoubleClickDate: handleDoubleClickDate,
      onDoubleClickDateTime: handleDoubleClickDateTime,
    },
  });

  // Update calendar events when data changes
  useEffect(() => {
    if (eventsService && calendarEvents) {
      eventsService.set(calendarEvents);
    }
  }, [calendarEvents, eventsService]);

  // Helper function to format time
  const formatTime = useCallback((dateTime: any): string => {
    if (dateTime instanceof Date) {
      return dateTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if ("epochMilliseconds" in dateTime) {
      return new Date(dateTime.epochMilliseconds).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "";
  }, []);

  // Apply conflict classes to calendar event DOM elements
  useEffect(() => {
    if (!calendarEvents) return;

    // Store event handlers for cleanup
    const eventHandlers = new Map<
      HTMLElement,
      {
        mouseenter: () => void;
        mouseleave: () => void;
      }
    >();

    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      calendarEvents.forEach((event) => {
        if (event.hasConflict) {
          const eventElement = document.querySelector(
            `[data-event-id="${event.id}"]`,
          ) as HTMLElement;
          if (eventElement) {
            eventElement.classList.add("has-conflict");

            // Get computed destructive color value from CSS custom properties
            const destructiveColor = getComputedStyle(document.documentElement)
              .getPropertyValue("--destructive")
              .trim();

            // Convert hex to RGB for alpha channel support in inline styles
            const hexToRgb = (hex: string) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                hex,
              );
              return result
                ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16),
                  }
                : null;
            };

            const rgb = hexToRgb(destructiveColor);
            if (rgb) {
              // Override inline styles set by Schedule-X library with computed color values
              // CSS custom properties don't work in inline styles, so we use rgba() with actual values
              eventElement.style.setProperty(
                "background-color",
                `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
                "important",
              );
              eventElement.style.setProperty(
                "border-inline-start",
                `4px solid rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
                "important",
              );
              eventElement.style.setProperty(
                "background-image",
                `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) 10px, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) 20px)`,
                "important",
              );
            }

            // Add conflict count badge via data attribute
            const conflictCount = event.conflictingEventIds?.length || 0;
            eventElement.setAttribute(
              "data-conflict-count",
              String(conflictCount),
            );

            // Build conflict info for popover
            const conflictingEvents =
              event.conflictingEventIds
                ?.map((conflictId) => {
                  const conflictingEvent = calendarEvents.find(
                    (e) => e.id === conflictId,
                  );
                  if (!conflictingEvent) return null;

                  return {
                    title: conflictingEvent.title,
                    startTime: formatTime(conflictingEvent.start),
                    endTime: formatTime(conflictingEvent.end),
                  };
                })
                .filter(
                  (item): item is NonNullable<typeof item> => item !== null,
                ) || [];

            // Add hover event listeners for popover
            const handleMouseEnter = () => {
              setConflictPopover({
                isOpen: true,
                anchorElement: eventElement,
                conflictInfo: {
                  conflictCount,
                  conflictingEvents,
                },
              });
            };

            const handleMouseLeave = () => {
              setConflictPopover({
                isOpen: false,
                anchorElement: null,
                conflictInfo: null,
              });
            };

            eventElement.addEventListener("mouseenter", handleMouseEnter);
            eventElement.addEventListener("mouseleave", handleMouseLeave);

            // Store handlers for cleanup
            eventHandlers.set(eventElement, {
              mouseenter: handleMouseEnter,
              mouseleave: handleMouseLeave,
            });
          }
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      // Clean up event listeners
      eventHandlers.forEach((handlers, element) => {
        element.removeEventListener("mouseenter", handlers.mouseenter);
        element.removeEventListener("mouseleave", handlers.mouseleave);
      });
    };
  }, [calendarEvents, formatTime]);

  const isLoading = tasksLoading || timeBlocksLoading;

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <CalendarToolbar
        calendarControls={calendarControls}
        selectedDate={selectedDate}
        onCreateTimeBlock={handleCreateTimeBlock}
      />
      <CalendarHelpBanner />
      <div className="flex-1 min-h-0 overflow-auto">
        <ScheduleXCalendar calendarApp={calendar} />
      </div>
      <TimeBlockFormSheet
        open={timeBlockDialogOpen}
        onOpenChange={setTimeBlockDialogOpen}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
      />
      <TimeBlockDetailPanel
        timeBlockId={selectedTimeBlockId}
        open={timeBlockDetailOpen}
        onOpenChange={setTimeBlockDetailOpen}
        onSuccess={() => {
          // Refetch data to update calendar
          setTimeBlockDetailOpen(false);
          setSelectedTimeBlockId(null);
        }}
      />
      <ConflictPopover
        isOpen={conflictPopover.isOpen}
        anchorElement={conflictPopover.anchorElement}
        conflictInfo={conflictPopover.conflictInfo}
      />
    </div>
  );
}
