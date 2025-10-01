"use client";

import { Filter, Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SortSelect } from "@/components/ui/sort-select";
import type { Task, TaskPriority, TaskStatus } from "@/lib/db/schema/tasks";
import { useCategories } from "@/lib/query/hooks/categories";
import type {
  TaskFilters,
  TaskSortBy,
  TaskSortOrder,
} from "@/lib/query/hooks/tasks";

export function TasksPageContent() {
  const searchParams = useSearchParams();
  const { data: categoriesData } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    TaskFilters["dateRange"] | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<TaskSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>("desc");

  const categories = categoriesData?.categories || [];

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
    if (categoryFilter !== "all") {
      filters.categoryId = categoryFilter;
    }
    if (dateRangeFilter !== "all") {
      filters.dateRange = dateRangeFilter;
    }
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    filters.sortBy = sortBy;
    filters.sortOrder = sortOrder;
    return filters;
  };

  const handleSortChange = (
    newSortBy: TaskSortBy,
    newSortOrder: TaskSortOrder,
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setDateRangeFilter("all");
    setSearchQuery("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  // Helper function to get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (categoryFilter !== "all") count++;
    if (dateRangeFilter !== "all") count++;
    if (searchQuery.trim()) count++;
    return count;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Mobile-only header */}
      <header className="flex lg:hidden h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Tasks</h1>
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
          size="sm"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </header>

      {/* Desktop header section */}
      <div className="hidden lg:flex items-center justify-between px-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-600">Manage your tasks and stay organized</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                <div className="space-y-4">
                  {/* Header, Sort, and Search */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Your Tasks
                    </h2>
                    <div className="flex items-center gap-3">
                      <SortSelect
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSortChange={handleSortChange}
                      />
                      <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search tasks..."
                        className="w-64"
                      />
                    </div>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-wrap">
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
                              statusFilter === "completed"
                                ? "default"
                                : "outline"
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
                              priorityFilter === "medium"
                                ? "default"
                                : "outline"
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
                              priorityFilter === "urgent"
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer bg-red-100 text-red-800 hover:bg-red-200"
                            onClick={() => setPriorityFilter("urgent")}
                          >
                            Urgent
                          </Badge>
                        </div>
                      </div>

                      {/* Category Filters */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          Category:
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          <Badge
                            variant={
                              categoryFilter === "all" ? "default" : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => setCategoryFilter("all")}
                          >
                            All
                          </Badge>
                          <Badge
                            variant={
                              categoryFilter === "" ? "default" : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => setCategoryFilter("")}
                          >
                            No Category
                          </Badge>
                          {categories.map((category) => (
                            <Badge
                              key={category.id}
                              variant={
                                categoryFilter === category.id
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer flex items-center gap-1.5"
                              onClick={() => setCategoryFilter(category.id)}
                            >
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </Badge>
                          ))}
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
                              dateRangeFilter === "today"
                                ? "default"
                                : "outline"
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
