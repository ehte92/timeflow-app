"use client";

import { IconAlertTriangle, IconClock } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

interface ConflictingEvent {
  title: string;
  startTime: string;
  endTime: string;
}

interface ConflictInfo {
  conflictCount: number;
  conflictingEvents: ConflictingEvent[];
}

interface ConflictPopoverProps {
  isOpen: boolean;
  anchorElement: HTMLElement | null;
  conflictInfo: ConflictInfo | null;
}

export function ConflictPopover({
  isOpen,
  anchorElement,
  conflictInfo,
}: ConflictPopoverProps) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // Update anchor position when element changes
  useEffect(() => {
    if (anchorElement && isOpen) {
      setAnchorRect(anchorElement.getBoundingClientRect());
    } else {
      setAnchorRect(null);
    }
  }, [anchorElement, isOpen]);

  if (!conflictInfo || !anchorRect) {
    return null;
  }

  return (
    <Popover open={isOpen}>
      <PopoverAnchor
        style={{
          position: "fixed",
          left: anchorRect.left + anchorRect.width / 2,
          top: anchorRect.top,
          width: 1,
          height: 1,
          pointerEvents: "none",
        }}
      />
      <PopoverContent
        className="w-80 p-0"
        side="top"
        align="center"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-4 pb-3 border-b bg-destructive/5">
          <IconAlertTriangle className="size-5 text-destructive" />
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Scheduling Conflict
            </h3>
            <p className="text-xs text-muted-foreground">
              {conflictInfo.conflictCount} overlapping time block
              {conflictInfo.conflictCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Conflicting Events List */}
        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-2">
            This time block conflicts with:
          </p>
          {conflictInfo.conflictingEvents.map((event, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
            >
              <IconClock className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {event.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.startTime} - {event.endTime}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 pt-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Click event to view details
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
