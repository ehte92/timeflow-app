"use client";

import {
  IconCircle,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/tasks/delete-confirmation-dialog";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Task, TaskPriority, TaskStatus } from "@/lib/db/schema/tasks";
import { useCategories } from "@/lib/query/hooks/categories";
import {
  type TaskFilters,
  useDeleteTask,
  useTasks,
  useToggleTaskStatus,
} from "@/lib/query/hooks/tasks";

interface TaskListProps {
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  refreshTrigger?: number; // Keep for compatibility, but won't be used
  filters?: TaskFilters;
  onCreateTask?: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const priorityBorderColors: Record<TaskPriority, string> = {
  low: "border-l-green-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  urgent: "border-l-red-500",
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

export function TaskList({
  onEditTask,
  onDeleteTask,
  filters,
  onCreateTask,
}: TaskListProps) {
  // Use React Query hooks
  const { data, isLoading, error, refetch } = useTasks(filters);
  const { data: categoriesData } = useCategories();
  const deleteTaskMutation = useDeleteTask();
  const toggleStatusMutation = useToggleTaskStatus();

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Detail panel state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const tasks = data?.tasks || [];
  const categories = categoriesData?.categories || [];

  // Helper to get category by ID
  const getCategoryById = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((cat) => cat.id === categoryId);
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      await toggleStatusMutation.mutateAsync(task);
    } catch (err) {
      console.error("Error updating task status:", err);
    }
  };

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTaskMutation.mutateAsync(taskToDelete);
      onDeleteTask?.(taskToDelete);
    } catch (err) {
      console.error("Error deleting task:", err);
    } finally {
      setTaskToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  if (isLoading) {
    return (
      <>
        {/* Desktop Table Skeleton */}
        <div className="hidden lg:block rounded-lg border bg-card shadow-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12">Status</TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="w-28">Priority</TableHead>
                <TableHead className="w-32">Category</TableHead>
                <TableHead className="w-40">Due Date</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell>
                    <div className="h-5 w-5 bg-muted rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 bg-muted rounded w-16" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 bg-muted rounded w-20" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded w-12" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card Skeleton */}
        <div className="block lg:hidden space-y-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-l-4 border-l-muted animate-pulse">
              <CardHeader className="p-6 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-0.5 size-8 rounded-md bg-muted"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-8 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-5 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">
          {error.message || "Failed to load tasks"}
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
    );
  }

  if (tasks.length === 0) {
    const hasActiveFilters =
      filters?.status ||
      filters?.priority ||
      filters?.categoryId ||
      filters?.dateRange ||
      filters?.search;

    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 size-16 text-muted-foreground">
          <IconCircleCheck className="size-full" />
        </div>
        {hasActiveFilters ? (
          <>
            <p className="text-lg font-medium text-foreground mb-2">
              No tasks found
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters to see more results
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium text-foreground mb-2">
              No tasks yet
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first task to get started with your productivity
              journey
            </p>
            {onCreateTask && (
              <Button onClick={onCreateTask} className="gap-2">
                <IconPlus className="size-4" />
                Create Your First Task
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-lg border bg-card shadow-md overflow-hidden">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="w-28">Priority</TableHead>
              <TableHead className="w-32">Category</TableHead>
              <TableHead className="w-40">Due Date</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const StatusIcon = statusIcons[task.status];
              const isCompleted = task.status === "completed";
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                !isCompleted;
              const category = getCategoryById(task.categoryId);

              return (
                <TableRow
                  key={task.id}
                  className={`group cursor-pointer transition-colors border-l-2 ${
                    isCompleted ? "opacity-60" : ""
                  } ${priorityBorderColors[task.priority]}`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  {/* Status Column */}
                  <TableCell
                    onClick={(e) => e.stopPropagation()}
                    className="py-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task)}
                      className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all duration-200"
                      disabled={toggleStatusMutation.isPending}
                      title={
                        isCompleted ? "Mark as incomplete" : "Mark as complete"
                      }
                    >
                      <StatusIcon
                        className={`size-5 ${
                          isCompleted
                            ? "text-green-600"
                            : task.status === "in_progress"
                              ? "text-primary"
                              : "text-muted-foreground"
                        } ${
                          toggleStatusMutation.isPending ? "animate-pulse" : ""
                        }`}
                      />
                    </button>
                  </TableCell>

                  {/* Task Title Column */}
                  <TableCell className="font-medium py-3">
                    <span
                      className={`${
                        isCompleted
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </span>
                  </TableCell>

                  {/* Priority Column */}
                  <TableCell className="py-3">
                    <Badge
                      className={`${priorityColors[task.priority]} capitalize`}
                      variant="secondary"
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>

                  {/* Category Column */}
                  <TableCell className="py-3">
                    {category && (
                      <Badge
                        className="text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Due Date Column */}
                  <TableCell className="py-3">
                    {task.dueDate ? (
                      <span
                        className={`text-sm ${
                          isOverdue
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell
                    onClick={(e) => e.stopPropagation()}
                    className="text-right py-3"
                  >
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTask(task)}
                          className="h-8 w-8 p-0"
                        >
                          <IconEdit className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(task.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        disabled={deleteTaskMutation.isPending}
                      >
                        <IconTrash
                          className={`size-4 ${
                            deleteTaskMutation.isPending ? "animate-pulse" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-5">
        {tasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          const isCompleted = task.status === "completed";
          const isOverdue =
            task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

          return (
            <Card
              key={task.id}
              className={`group transition-all duration-200 ease-in-out hover:shadow-md cursor-pointer border-l-4 ${
                isCompleted ? "opacity-75" : ""
              } ${priorityBorderColors[task.priority]}`}
            >
              <CardHeader
                className="p-6 pb-3"
                onClick={() => setSelectedTaskId(task.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(task);
                      }}
                      className="mt-0.5 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all duration-200"
                      disabled={toggleStatusMutation.isPending}
                      title={
                        isCompleted ? "Mark as incomplete" : "Mark as complete"
                      }
                    >
                      <StatusIcon
                        className={`size-6 ${
                          isCompleted
                            ? "text-green-600"
                            : task.status === "in_progress"
                              ? "text-primary"
                              : "text-muted-foreground"
                        } ${
                          toggleStatusMutation.isPending ? "animate-pulse" : ""
                        }`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-2xl font-semibold ${
                            isCompleted
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </h3>
                        {/* Category Badge */}
                        {(() => {
                          const category = getCategoryById(task.categoryId);
                          return category ? (
                            <Badge
                              className="text-white"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.name}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {onEditTask && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(task);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconEdit className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(task.id);
                      }}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={deleteTaskMutation.isPending}
                    >
                      <IconTrash
                        className={`size-4 ${
                          deleteTaskMutation.isPending ? "animate-pulse" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0">
                <div className="flex items-center justify-between">
                  {task.dueDate && (
                    <span
                      className={`text-sm font-medium ${
                        isOverdue ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      Due: {formatDateTime(task.dueDate)}
                    </span>
                  )}
                  {task.completedAt && (
                    <span className="text-sm font-medium text-green-600">
                      Completed: {formatDateTime(task.completedAt)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteTaskMutation.isPending}
      />

      <TaskDetailPanel
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />
    </>
  );
}
