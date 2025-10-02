"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalendarApp } from "@schedule-x/calendar";
import { useCallback, useState, useEffect, useRef } from "react";

interface CalendarToolbarProps {
  calendarControls: {
    setView: (view: string) => void;
    setDate: (date: Temporal.PlainDate) => void;
  };
  calendarApp: CalendarApp | null;
  selectedDate: string;
}

export function CalendarToolbar({
  calendarControls,
  calendarApp,
  selectedDate,
}: CalendarToolbarProps) {
  const [currentView, setCurrentView] = useState("month-grid");
  const [isNavigating, setIsNavigating] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Helper to execute navigation with debouncing
  const debouncedNavigate = useCallback((newDate: Temporal.PlainDate) => {
    // Clear any pending navigation
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsNavigating(true);

    // Debounce the actual navigation call
    debounceTimerRef.current = setTimeout(() => {
      calendarControls.setDate(newDate);

      // Reset navigation state after a short delay to allow UI to update
      setTimeout(() => {
        setIsNavigating(false);
      }, 150);
    }, 200);
  }, [calendarControls]);

  const handleToday = useCallback(() => {
    const today = Temporal.Now.plainDateISO();

    // Clear any pending navigation
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    calendarControls.setDate(today);
  }, [calendarControls]);

  const handlePrev = useCallback(() => {
    // Read from React state (selectedDate prop) instead of signal to avoid state mismatch
    const currentDate = selectedDate
      ? Temporal.PlainDate.from(selectedDate)
      : Temporal.Now.plainDateISO();

    let newDate: Temporal.PlainDate;

    if (currentView === "month-grid") {
      newDate = currentDate.subtract({ months: 1 });
    } else if (currentView === "week") {
      newDate = currentDate.subtract({ days: 7 });
    } else {
      newDate = currentDate.subtract({ days: 1 });
    }

    debouncedNavigate(newDate);
  }, [debouncedNavigate, selectedDate, currentView]);

  const handleNext = useCallback(() => {
    // Read from React state (selectedDate prop) instead of signal to avoid state mismatch
    const currentDate = selectedDate
      ? Temporal.PlainDate.from(selectedDate)
      : Temporal.Now.plainDateISO();

    let newDate: Temporal.PlainDate;

    if (currentView === "month-grid") {
      newDate = currentDate.add({ months: 1 });
    } else if (currentView === "week") {
      newDate = currentDate.add({ days: 7 });
    } else {
      newDate = currentDate.add({ days: 1 });
    }

    debouncedNavigate(newDate);
  }, [debouncedNavigate, selectedDate, currentView]);

  const handleViewChange = useCallback(
    (view: string) => {
      setCurrentView(view);
      calendarControls.setView(view);
    },
    [calendarControls]
  );

  const formatDisplayDate = useCallback(() => {
    if (!selectedDate) {
      const today = new Date();
      return today.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }

    const currentDate = new Date(selectedDate);

    if (currentView === "month-grid") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (currentView === "week") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate, currentView]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-border/50 bg-gradient-to-r from-background to-muted/20">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          disabled={isNavigating}
          className="font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={isNavigating}
          className="h-9 w-9 rounded-lg transition-all duration-200 hover:bg-accent hover:-translate-y-0.5 active:scale-95"
          aria-label="Previous"
        >
          <IconChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={isNavigating}
          className="h-9 w-9 rounded-lg transition-all duration-200 hover:bg-accent hover:-translate-y-0.5 active:scale-95"
          aria-label="Next"
        >
          <IconChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Center: Date Display */}
      <h2 className="text-2xl font-semibold tracking-tight">
        {formatDisplayDate()}
      </h2>

      {/* Right: View Selector */}
      <Select value={currentView} onValueChange={handleViewChange}>
        <SelectTrigger className="w-[140px] font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month-grid">Month</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="day">Day</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
