"use client";

import { Filter, Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task, TaskPriority, TaskStatus } from "@/lib/db/schema/tasks";
import type { TaskFilters } from "@/lib/query/hooks/tasks";

export function TasksPageContent() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [dateRangeFilter, setDateRangeFilter] = useState<
    TaskFilters["dateRange"] | "all"
  >("all");

  // Auto-open form if new=true query parameter is present
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowForm(true);
    }
  }, [searchParams]);

  const handleTaskCreated = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleTaskDeleted = () => {
    // React Query will automatically refetch, no manual trigger needed
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const getTaskFilters = (): TaskFilters => {
    const filters: TaskFilters = {};
    if (statusFilter !== "all") {
      filters.status = statusFilter;
    }
    if (priorityFilter !== "all") {
      filters.priority = priorityFilter;
    }
    if (dateRangeFilter !== "all") {
      filters.dateRange = dateRangeFilter;
    }
    return filters;
  };

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateRangeFilter("all");
  };

  // Helper function to get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (dateRangeFilter !== "all") count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="text-gray-600 mt-1">
                Manage your tasks and stay organized
              </p>
            </div>

            <Button
              onClick={() => {
                if (showForm) {
                  handleCancelEdit();
                } else {
                  setEditingTask(null);
                  setShowForm(true);
                }
              }}
              className="flex items-center gap-2"
            >
              {showForm ? (
                <>
                  <X className="h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Task
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Task Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <TaskForm
                  task={editingTask || undefined}
                  onSuccess={handleTaskCreated}
                  onCancel={handleCancelEdit}
                />
              </div>
            </div>
          )}

          {/* Task List */}
          <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Tasks
                  </h2>

                  {/* Filter Controls */}
                  <div className="flex items-center gap-4">
                    {/* Status Filters */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Status:
                      </span>
                      <div className="flex gap-1">
                        <Badge
                          variant={
                            statusFilter === "all" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setStatusFilter("all")}
                        >
                          All
                        </Badge>
                        <Badge
                          variant={
                            statusFilter === "todo" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setStatusFilter("todo")}
                        >
                          To Do
                        </Badge>
                        <Badge
                          variant={
                            statusFilter === "in_progress"
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setStatusFilter("in_progress")}
                        >
                          In Progress
                        </Badge>
                        <Badge
                          variant={
                            statusFilter === "completed" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setStatusFilter("completed")}
                        >
                          Completed
                        </Badge>
                      </div>
                    </div>

                    {/* Priority Filters */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Priority:
                      </span>
                      <div className="flex gap-1">
                        <Badge
                          variant={
                            priorityFilter === "all" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setPriorityFilter("all")}
                        >
                          All
                        </Badge>
                        <Badge
                          variant={
                            priorityFilter === "low" ? "default" : "outline"
                          }
                          className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
                          onClick={() => setPriorityFilter("low")}
                        >
                          Low
                        </Badge>
                        <Badge
                          variant={
                            priorityFilter === "medium" ? "default" : "outline"
                          }
                          className="cursor-pointer bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          onClick={() => setPriorityFilter("medium")}
                        >
                          Medium
                        </Badge>
                        <Badge
                          variant={
                            priorityFilter === "high" ? "default" : "outline"
                          }
                          className="cursor-pointer bg-orange-100 text-orange-800 hover:bg-orange-200"
                          onClick={() => setPriorityFilter("high")}
                        >
                          High
                        </Badge>
                        <Badge
                          variant={
                            priorityFilter === "urgent" ? "default" : "outline"
                          }
                          className="cursor-pointer bg-red-100 text-red-800 hover:bg-red-200"
                          onClick={() => setPriorityFilter("urgent")}
                        >
                          Urgent
                        </Badge>
                      </div>
                    </div>

                    {/* Date Range Filters */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Due:
                      </span>
                      <div className="flex gap-1">
                        <Badge
                          variant={
                            dateRangeFilter === "all" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setDateRangeFilter("all")}
                        >
                          All
                        </Badge>
                        <Badge
                          variant={
                            dateRangeFilter === "overdue"
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer bg-red-100 text-red-800 hover:bg-red-200"
                          onClick={() => setDateRangeFilter("overdue")}
                        >
                          Overdue
                        </Badge>
                        <Badge
                          variant={
                            dateRangeFilter === "today" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setDateRangeFilter("today")}
                        >
                          Today
                        </Badge>
                        <Badge
                          variant={
                            dateRangeFilter === "tomorrow"
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setDateRangeFilter("tomorrow")}
                        >
                          Tomorrow
                        </Badge>
                        <Badge
                          variant={
                            dateRangeFilter === "this_week"
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setDateRangeFilter("this_week")}
                        >
                          This Week
                        </Badge>
                        <Badge
                          variant={
                            dateRangeFilter === "next_week"
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setDateRangeFilter("next_week")}
                        >
                          Next Week
                        </Badge>
                        <Badge
                          variant={
                            dateRangeFilter === "this_month"
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setDateRangeFilter("this_month")}
                        >
                          This Month
                        </Badge>
                      </div>
                    </div>

                    {/* Active Filter Count and Clear Button */}
                    {getActiveFilterCount() > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {getActiveFilterCount()} active filter
                          {getActiveFilterCount() > 1 ? "s" : ""}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Clear All
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <TaskList
                  onEditTask={handleEditTask}
                  onDeleteTask={handleTaskDeleted}
                  filters={getTaskFilters()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
