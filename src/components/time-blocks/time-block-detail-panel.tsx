"use client";

import {
  IconCalendarTime,
  IconClock,
  IconEdit,
  IconFileText,
  IconLink,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/tasks/delete-confirmation-dialog";
import { TimeBlockFormSheet } from "@/components/time-blocks/time-block-form-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { TimeBlockType } from "@/lib/db/schema/time-blocks";
import { useTask } from "@/lib/query/hooks/tasks";
import {
  useDeleteTimeBlock,
  useTimeBlock,
} from "@/lib/query/hooks/time-blocks";

interface TimeBlockDetailPanelProps {
  timeBlockId: string | null;
  createMode?: boolean;
  editMode?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const typeColors: Record<TimeBlockType, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  actual: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  break: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

type ViewMode = "view" | "edit";

export function TimeBlockDetailPanel({
  timeBlockId,
  createMode = false,
  editMode = false,
  open,
  onOpenChange,
  onSuccess,
}: TimeBlockDetailPanelProps) {
  const [mode, setMode] = useState<ViewMode>(editMode ? "edit" : "view");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useTimeBlock(
    createMode ? "" : timeBlockId || "",
  );

  const deleteTimeBlockMutation = useDeleteTimeBlock();

  const timeBlock = data?.timeBlock;

  // Fetch linked task if taskId exists
  const { data: linkedTaskData } = useTask(timeBlock?.taskId || "");
  const linkedTask = linkedTaskData?.task;

  // Reset mode when editMode prop changes or panel opens
  useEffect(() => {
    if (open && !createMode) {
      setMode(editMode ? "edit" : "view");
    }
  }, [editMode, open, createMode]);

  // Reset mode when panel closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMode("view");
    }
    onOpenChange(open);
  };

  // Handle successful edit
  const handleEditSuccess = () => {
    setMode("view");
    refetch();
    onSuccess?.();
  };

  // Handle successful create
  const handleCreateSuccess = () => {
    onSuccess?.();
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setMode("view");
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!timeBlock) return;

    try {
      await deleteTimeBlockMutation.mutateAsync(timeBlock.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error deleting time block:", err);
    }
  };

  // Format date and time
  const formatDateTime = (date: Date | string | null) => {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Format date only
  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate duration
  const calculateDuration = (
    start: Date | string,
    end: Date | string,
  ): string => {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {createMode && (
            <TimeBlockFormSheet
              open={open}
              onOpenChange={onOpenChange}
              onSuccess={handleCreateSuccess}
            />
          )}

          {!createMode && isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-muted-foreground">
                  Loading time block...
                </span>
              </div>
            </div>
          )}

          {!createMode && error && (
            <div className="py-8">
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">
                  {error.message || "Failed to load time block"}
                </div>
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Try again
                </Button>
              </div>
            </div>
          )}

          {!createMode && timeBlock && mode === "view" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold pr-8">
                  {timeBlock.title || "Time Block"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Time block details for{" "}
                  {timeBlock.title || `${timeBlock.type} time block`}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 px-4 space-y-6">
                {/* Type Badge */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={`${typeColors[timeBlock.type]} flex items-center gap-1.5`}
                  >
                    <IconTag className="size-3" />
                    <span className="capitalize">{timeBlock.type}</span>
                  </Badge>
                </div>

                {/* Time Details */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <IconClock className="size-4" />
                    Time
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Start:</span>
                      <span className="font-medium text-foreground">
                        {formatDateTime(timeBlock.startTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">End:</span>
                      <span className="font-medium text-foreground">
                        {formatDateTime(timeBlock.endTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium text-foreground">
                        {calculateDuration(
                          timeBlock.startTime,
                          timeBlock.endTime,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {timeBlock.description && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <IconFileText className="size-4" />
                      Description
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {timeBlock.description}
                    </p>
                  </div>
                )}

                {/* Linked Task */}
                {linkedTask && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <IconLink className="size-4" />
                      Linked Task
                    </h3>
                    <div className="text-sm">
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <IconCalendarTime className="size-4 text-muted-foreground" />
                        <span className="font-medium">{linkedTask.title}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Created {formatDate(timeBlock.createdAt)}</span>
                    <span>Updated {formatDate(timeBlock.updatedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t space-y-2">
                  {/* Edit Action */}
                  <Button
                    onClick={() => setMode("edit")}
                    variant="default"
                    className="w-full"
                  >
                    <IconEdit className="size-4 mr-2" />
                    Edit Time Block
                  </Button>
                  {/* Delete Action */}
                  <Button
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <IconTrash className="size-4 mr-2" />
                    Delete Time Block
                  </Button>
                </div>
              </div>
            </>
          )}

          {!createMode && timeBlock && mode === "edit" && (
            <TimeBlockFormSheet
              open={true}
              onOpenChange={(open) => {
                if (!open) {
                  handleCancelEdit();
                }
              }}
              timeBlock={timeBlock}
              onSuccess={handleEditSuccess}
            />
          )}
        </SheetContent>
      </Sheet>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Time Block"
        description="Are you sure you want to delete this time block? This action cannot be undone."
        isLoading={deleteTimeBlockMutation.isPending}
      />
    </>
  );
}
