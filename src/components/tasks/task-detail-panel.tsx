"use client";

import { CheckCircle, Circle, Clock, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  todo: Circle,
  in_progress: Clock,
  completed: CheckCircle,
  cancelled: Circle,
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
  open,
  onOpenChange,
}: TaskDetailPanelProps) {
  const [mode, setMode] = useState<ViewMode>("view");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useTask(taskId || "");
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

  const StatusIcon = task ? statusIcons[task.status] : Circle;
  const category = task ? getCategoryById(task.categoryId) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-gray-600">Loading task...</span>
              </div>
            </div>
          )}

          {error && (
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

          {task && mode === "view" && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold pr-8">
                  {task.title}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Task details for {task.title}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Description */}
                {task.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Description
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Status, Priority, Category */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Details
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Status Badge */}
                    <Badge
                      variant="secondary"
                      className={`${statusColors[task.status]} flex items-center gap-1.5`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span className="capitalize">
                        {task.status.replace("_", " ")}
                      </span>
                    </Badge>

                    {/* Priority Badge */}
                    <Badge
                      variant="secondary"
                      className={priorityColors[task.priority]}
                    >
                      {task.priority}
                    </Badge>

                    {/* Category Badge */}
                    {category && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1.5"
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Timeline
                  </h3>
                  <div className="space-y-1 text-sm">
                    {task.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due:</span>
                        <span
                          className={`font-medium ${
                            isOverdue ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {formatDateTime(task.dueDate)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Updated:</span>
                      <span className="text-gray-900">
                        {formatDate(task.updatedAt)}
                      </span>
                    </div>
                    {task.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="text-green-600 font-medium">
                          {formatDateTime(task.completedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Tracking */}
                {(task.estimatedMinutes || task.actualMinutes) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Time Tracking
                    </h3>
                    <div className="space-y-2">
                      {task.estimatedMinutes && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Estimated:</span>
                          <span className="font-medium text-gray-900">
                            {formatMinutesToTime(task.estimatedMinutes)}
                          </span>
                        </div>
                      )}
                      {task.actualMinutes && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Actual:</span>
                          <span className="font-medium text-gray-900">
                            {formatMinutesToTime(task.actualMinutes)}
                          </span>
                        </div>
                      )}
                      {task.estimatedMinutes && task.actualMinutes && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>
                              {calculateTimeProgress(
                                task.estimatedMinutes,
                                task.actualMinutes,
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
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
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button
                    onClick={() => setMode("edit")}
                    variant="default"
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </Button>
                  <Button
                    onClick={handleToggleStatus}
                    variant="outline"
                    className="w-full"
                    disabled={toggleStatusMutation.isPending}
                  >
                    {task.status === "completed"
                      ? "Mark as Incomplete"
                      : "Mark as Complete"}
                  </Button>
                  <Button
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Task
                  </Button>
                </div>
              </div>
            </>
          )}

          {task && mode === "edit" && (
            <div className="py-4">
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
