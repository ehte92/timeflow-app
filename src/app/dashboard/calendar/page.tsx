"use client";

import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { ScheduleXCalendarComponent } from "@/components/calendar/schedule-x-calendar";
import { TimeBlockFormSheet } from "@/components/time-blocks/time-block-form-sheet";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SidebarTrigger } from "@/components/ui/sidebar";
import "./calendar.css";

export default function CalendarPage() {
  const [isCreatingTimeBlock, setIsCreatingTimeBlock] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* Mobile-only header */}
      <header className="flex lg:hidden h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Calendar</h1>
        </div>
        <Button onClick={() => setIsCreatingTimeBlock(true)} size="sm">
          <IconPlus className="size-4" />
        </Button>
      </header>

      {/* Desktop header */}
      <div className="hidden lg:block">
        <PageHeader
          title="Calendar"
          description="View and manage your tasks and time blocks"
        />
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-hidden">
        <div className="bg-card rounded-xl shadow-lg border border-border/50 h-full overflow-auto">
          <ScheduleXCalendarComponent
            onCreateTimeBlock={() => setIsCreatingTimeBlock(true)}
          />
        </div>
      </div>

      {/* Mobile time block creation sheet */}
      <TimeBlockFormSheet
        open={isCreatingTimeBlock}
        onOpenChange={setIsCreatingTimeBlock}
      />
    </div>
  );
}
