"use client";

import {
  IconCalendar,
  IconCircle,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconEdit,
  IconFlag,
  IconHourglass,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/tasks/delete-confirmation-dialog";
import { TaskForm } from "@/components/tasks/task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { TaskPriority, TaskStatus } from "@/lib/db/schema/tasks";
import { useCategories } from "@/lib/query/hooks/categories";
import {
  useDeleteTask,
  useTask,
  useToggleTaskStatus,
} from "@/lib/query/hooks/tasks";
import {
  calculateTimeProgress,
  formatMinutesToTime,
} from "@/lib/utils/time-format";

interface TaskDetailPanelProps {
  taskId: string | null;
  createMode?: boolean;
  editMode?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const statusIcons: Record<
  TaskStatus,
  React.ComponentType<{ className?: string }>
> = {
  todo: IconCircle,
  in_progress: IconClock,
  completed: IconCircleCheck,
  cancelled: IconCircleX,
};

const statusColors: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
};

type ViewMode = "view" | "edit";

export function TaskDetailPanel({
  taskId,
  createMode = false,
  editMode = false,
  open,
  onOpenChange,
  onSuccess,
}: TaskDetailPanelProps) {
  const [mode, setMode] = useState<ViewMode>(editMode ? "edit" : "view");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useTask(
    createMode ? "" : taskId || "",
  );

  // Reset mode when editMode prop changes or panel opens
  useEffect(() => {
    if (open && !createMode) {
      setMode(editMode ? "edit" : "view");
    }
  }, [editMode, open, createMode]);
  const { data: categoriesData } = useCategories();
  const toggleStatusMutation = useToggleTaskStatus();
  const deleteTaskMutation = useDeleteTask();

  const task = data?.task;
  const categories = categoriesData?.categories || [];

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
    if (!task) return;

    try {
      await deleteTaskMutation.mutateAsync(task.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!task) return;

    try {
      await toggleStatusMutation.mutateAsync(task);
      refetch();
    } catch (err) {
      console.error("Error toggling task status:", err);
    }
  };

  // Get category by ID
  const getCategoryById = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((cat) => cat.id === categoryId);
  };

  // Format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  // Check if task is overdue
  const isOverdue =
    task?.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "completed";

  const StatusIcon = task ? statusIcons[task.status] : IconCircle;
  const category = task ? getCategoryById(task.categoryId) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {createMode && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold">
                  Create Task
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Create a new task
                </SheetDescription>
              </SheetHeader>
              <div className="p-4">
                <TaskForm
                  onSuccess={handleCreateSuccess}
                  onCancel={() => onOpenChange(false)}
                />
              </div>
            </>
          )}

          {!createMode && isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-muted-foreground">Loading task...</span>
              </div>
            </div>
          )}

          {!createMode && error && (
            <div className="py-8">
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">
                  {error.message || "Failed to load task"}
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

          {!createMode && task && mode === "view" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold pr-8">
                  {task.title}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Task details for {task.title}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 px-4 space-y-6">
                {/* Status, Priority, Category Badges - Directly under title */}
                <div className="flex flex-wrap gap-2">
                  {/* Status Badge */}
                  <Badge
                    variant="secondary"
                    className={`${statusColors[task.status]} flex items-center gap-1.5`}
                  >
                    <StatusIcon className="size-3" />
                    <span className="capitalize">
                      {task.status.replace("_", " ")}
                    </span>
                  </Badge>

                  {/* Priority Badge */}
                  <Badge
                    variant="secondary"
                    className={`${priorityColors[task.priority]} flex items-center gap-1.5`}
                  >
                    <IconFlag className="size-3" />
                    <span className="capitalize">{task.priority}</span>
                  </Badge>

                  {/* Category Badge */}
                  {category && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {task.description && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Description
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <IconCalendar className="size-4" />
                    Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    {task.dueDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Due date:</span>
                        <span
                          className={`font-semibold ${
                            isOverdue ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          {formatDateTime(task.dueDate)}
                          {isOverdue && (
                            <span className="ml-2 text-xs font-normal text-destructive">
                              (Overdue)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Completed:
                        </span>
                        <span className="text-green-600 font-medium">
                          {formatDateTime(task.completedAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        Created {formatDate(task.createdAt)}
                      </span>
                      <span className="text-muted-foreground">
                        Updated {formatDate(task.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Tracking */}
                {(task.estimatedMinutes || task.actualMinutes) && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <IconHourglass className="size-4" />
                      Time Tracking
                    </h3>
                    <div className="space-y-2">
                      {task.estimatedMinutes && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Estimated:
                          </span>
                          <span className="font-medium text-foreground">
                            {formatMinutesToTime(task.estimatedMinutes)}
                          </span>
                        </div>
                      )}
                      {task.actualMinutes && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Actual:</span>
                          <span className="font-medium text-foreground">
                            {formatMinutesToTime(task.actualMinutes)}
                          </span>
                        </div>
                      )}
                      {task.estimatedMinutes && task.actualMinutes && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>
                              {calculateTimeProgress(
                                task.estimatedMinutes,
                                task.actualMinutes,
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{
                                width: `${calculateTimeProgress(task.estimatedMinutes, task.actualMinutes)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t space-y-2">
                  {/* Primary Actions Row */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => setMode("edit")}
                      variant="default"
                      className="flex-1"
                    >
                      <IconEdit className="size-4 mr-2" />
                      Edit Task
                    </Button>
                    <Button
                      onClick={handleToggleStatus}
                      variant="outline"
                      className="flex-1"
                      disabled={toggleStatusMutation.isPending}
                    >
                      {task.status === "completed"
                        ? "Mark as Incomplete"
                        : "Mark as Complete"}
                    </Button>
                  </div>
                  {/* Delete Action */}
                  <Button
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <IconTrash className="size-4 mr-2" />
                    Delete Task
                  </Button>
                </div>
              </div>
            </>
          )}

          {!createMode && task && mode === "edit" && (
            <div className="p-4">
              <TaskForm
                task={task}
                onSuccess={handleEditSuccess}
                onCancel={handleCancelEdit}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteTaskMutation.isPending}
      />
    </>
  );
}
