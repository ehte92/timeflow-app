"use client";

import {
  createViewDay,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import "temporal-polyfill/global";
import "@schedule-x/theme-default/dist/index.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CALENDAR_IDS, mergeCalendarEvents } from "@/lib/calendar/events";
import { useTasks } from "@/lib/query/hooks/tasks";
import { useTimeBlocks } from "@/lib/query/hooks/time-blocks";
import { CalendarToolbar } from "./calendar-toolbar";

export function ScheduleXCalendarComponent() {
  const eventsService = useMemo(() => createEventsServicePlugin(), []);
  const calendarControls = useMemo(() => createCalendarControlsPlugin(), []);
  const [selectedDate, setSelectedDate] = useState<string>("");

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
    // TODO: Open event details modal/sidebar in future task
  }, []);

  const calendar = useNextCalendarApp({
    views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
    events: calendarEvents,
    plugins: [eventsService, calendarControls],
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
    },
  });

  // Update calendar events when data changes
  useEffect(() => {
    if (eventsService && calendarEvents) {
      eventsService.set(calendarEvents);
    }
  }, [calendarEvents, eventsService]);

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
      />
      <div className="flex-1 min-h-0 overflow-auto">
        <ScheduleXCalendar calendarApp={calendar} />
      </div>
    </div>
  );
}
