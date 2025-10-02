"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ScheduleXCalendarComponent } from "@/components/calendar/schedule-x-calendar";
import "./calendar.css";

export default function CalendarPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading (will be replaced with actual data fetching)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const events: any[] = []; // Empty for now, will be populated in later tasks

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Calendar"
        description="View and manage your tasks and time blocks"
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-hidden">
        <div className="bg-card rounded-xl shadow-lg border border-border/50 h-full overflow-auto">
          {/* Loading state with skeleton */}
          {isLoading && (
            <div className="calendar-skeleton">
              <div className="calendar-skeleton-header" />
              <div className="calendar-skeleton-grid">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="calendar-skeleton-cell"
                    style={{ "--i": i } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          {!isLoading && <ScheduleXCalendarComponent events={events} />}
        </div>
      </div>
    </div>
  );
}
