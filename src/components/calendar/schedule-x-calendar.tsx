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
import { useCallback, useMemo, useState } from "react";
import { CalendarToolbar } from "./calendar-toolbar";

interface ScheduleXCalendarProps {
  events?: any[];
}

export function ScheduleXCalendarComponent({
  events = [],
}: ScheduleXCalendarProps) {
  const eventsService = useMemo(() => createEventsServicePlugin(), []);
  const calendarControls = useMemo(() => createCalendarControlsPlugin(), []);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const handleSelectedDateUpdate = useCallback((date: Temporal.PlainDate) => {
    setSelectedDate(date.toString());
  }, []);

  const calendar = useNextCalendarApp({
    views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
    events: events,
    plugins: [eventsService, calendarControls],
    defaultView: "month-grid",
    callbacks: {
      onSelectedDateUpdate: handleSelectedDateUpdate,
    },
  });

  return (
    <div className="h-full w-full flex flex-col">
      <CalendarToolbar
        calendarControls={calendarControls}
        calendarApp={calendar}
        selectedDate={selectedDate}
      />
      <div className="flex-1 min-h-0 overflow-auto">
        <ScheduleXCalendar calendarApp={calendar} />
      </div>
    </div>
  );
}
