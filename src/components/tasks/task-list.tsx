"use client";

import { CheckCircle, Circle, Clock, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/tasks/delete-confirmation-dialog";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export function TaskList({ onEditTask, onDeleteTask, filters }: TaskListProps) {
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
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600">Loading tasks...</span>
        </div>
      </div>
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
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
          <CheckCircle className="h-full w-full" />
        </div>
        <p className="text-gray-600 mb-2">No tasks yet</p>
        <p className="text-sm text-gray-500">
          Create your first task to get started with your productivity journey.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const StatusIcon = statusIcons[task.status];
        const isCompleted = task.status === "completed";
        const isOverdue =
          task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

        return (
          <Card
            key={task.id}
            className={`transition-all hover:shadow-md cursor-pointer ${
              isCompleted ? "opacity-75" : ""
            }`}
          >
            <CardHeader
              className="pb-3"
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
                    className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                    disabled={toggleStatusMutation.isPending}
                  >
                    <StatusIcon
                      className={`h-5 w-5 ${
                        isCompleted
                          ? "text-green-600"
                          : task.status === "in_progress"
                            ? "text-blue-600"
                            : "text-gray-400"
                      } ${
                        toggleStatusMutation.isPending ? "animate-pulse" : ""
                      }`}
                    />
                  </button>
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        isCompleted
                          ? "line-through text-gray-500"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p
                        className={`mt-1 text-sm ${
                          isCompleted ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {/* Category Badge */}
                  {(() => {
                    const category = getCategoryById(task.categoryId);
                    return category ? (
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
                    ) : null;
                  })()}
                  {/* Priority Badge */}
                  <Badge
                    className={priorityColors[task.priority]}
                    variant="secondary"
                  >
                    {task.priority}
                  </Badge>
                  {onEditTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(task.id);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deleteTaskMutation.isPending}
                  >
                    <Trash2
                      className={`h-4 w-4 ${
                        deleteTaskMutation.isPending ? "animate-pulse" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="capitalize">
                    {task.status.replace("_", " ")}
                  </span>
                  {task.dueDate && (
                    <span
                      className={`${
                        isOverdue ? "text-red-600 font-medium" : ""
                      }`}
                    >
                      Due: {formatDateTime(task.dueDate)}
                    </span>
                  )}
                </div>
                <div className="text-xs">
                  Created: {formatDate(task.createdAt)}
                </div>
              </div>

              {task.completedAt && (
                <div className="mt-2 text-xs text-green-600">
                  Completed: {formatDateTime(task.completedAt)}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

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
    </div>
  );
}
