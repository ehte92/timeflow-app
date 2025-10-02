"use client";

import { ScheduleXCalendarComponent } from "@/components/calendar/schedule-x-calendar";
import { PageHeader } from "@/components/ui/page-header";
import "./calendar.css";

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Calendar"
        description="View and manage your tasks and time blocks"
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-hidden">
        <div className="bg-card rounded-xl shadow-lg border border-border/50 h-full overflow-auto">
          <ScheduleXCalendarComponent />
        </div>
      </div>
    </div>
  );
}
