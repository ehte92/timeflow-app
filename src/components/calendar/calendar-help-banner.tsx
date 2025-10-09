"use client";

import { IconInfoCircle, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "calendar-help-banner-dismissed";

export function CalendarHelpBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // Default to true to avoid flash

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 mb-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4">
        <IconInfoCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="flex-1 text-xs sm:text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            Quick Tip: Creating Time Blocks
          </p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            <strong className="hidden sm:inline">Double-click</strong>
            <strong className="inline sm:hidden">Tap</strong> any empty calendar
            slot to quickly create a time block, or use the{" "}
            <span className="font-semibold">+</span>
            <span className="hidden sm:inline font-semibold">
              {" "}
              New Time Block
            </span>{" "}
            button
            <span className="hidden lg:inline"> in the toolbar</span>
            <span className="inline lg:hidden"> above</span>.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50"
          aria-label="Dismiss help banner"
        >
          <IconX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}
