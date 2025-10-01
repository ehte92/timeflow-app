"use client";

import {
  IconCalendar,
  IconCategory,
  IconCircle,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconFlag,
  IconPlus,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";
import {
  FilterDropdown,
  type FilterOption,
} from "@/components/ui/filter-dropdown";
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
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
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

  // Auto-open create sheet if new=true query parameter is present
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsCreating(true);
    }
  }, [searchParams]);

  const handleTaskDeleted = () => {
    // React Query will automatically refetch, no manual trigger needed
  };

  const handleEditTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsEditMode(true);
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
    return count;
  };

  // Filter options
  const statusOptions: FilterOption[] = useMemo(
    () => [
      {
        value: "all",
        label: "All Status",
        icon: <IconCircle className="size-4" />,
      },
      { value: "todo", label: "Todo", icon: <IconCircle className="size-4" /> },
      {
        value: "in_progress",
        label: "In Progress",
        icon: <IconClock className="size-4" />,
      },
      {
        value: "completed",
        label: "Completed",
        icon: <IconCircleCheck className="size-4" />,
      },
      {
        value: "cancelled",
        label: "Cancelled",
        icon: <IconCircleX className="size-4" />,
      },
    ],
    [],
  );

  const priorityOptions: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All Priority" },
      { value: "low", label: "Low", color: "#22c55e" },
      { value: "medium", label: "Medium", color: "#eab308" },
      { value: "high", label: "High", color: "#f97316" },
      { value: "urgent", label: "Urgent", color: "#ef4444" },
    ],
    [],
  );

  const categoryOptions: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      ...categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
        color: cat.color,
      })),
    ],
    [categories],
  );

  const dateRangeOptions: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All Dates" },
      { value: "today", label: "Today" },
      { value: "week", label: "This Week" },
      { value: "month", label: "This Month" },
      { value: "overdue", label: "Overdue" },
    ],
    [],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-muted">
      {/* Mobile-only header */}
      <header className="flex lg:hidden h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Tasks</h1>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm">
          <IconPlus className="size-4" />
        </Button>
      </header>

      {/* Desktop header section */}
      <div className="hidden lg:flex items-center justify-between px-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks and stay organized
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <IconPlus className="size-4" />
          Add Task
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div>
          {/* Task List */}
          <div>
            <div className="bg-card rounded-lg shadow">
              <div className="p-8">
                <div className="space-y-4">
                  {/* Toolbar - Compact Single Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1.5">
                    {/* Search Bar */}
                    <SearchInput
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search tasks..."
                      className="w-full sm:w-56"
                    />

                    {/* Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <SortSelect
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSortChange={handleSortChange}
                      />
                      <FilterDropdown
                        label="Status"
                        icon={<IconCircle className="size-4" />}
                        value={statusFilter}
                        options={statusOptions}
                        onChange={(value) =>
                          setStatusFilter(value as TaskStatus | "all")
                        }
                      />
                      <FilterDropdown
                        label="Priority"
                        icon={<IconFlag className="size-4" />}
                        value={priorityFilter}
                        options={priorityOptions}
                        onChange={(value) =>
                          setPriorityFilter(value as TaskPriority | "all")
                        }
                      />
                      <FilterDropdown
                        label="Category"
                        icon={<IconCategory className="size-4" />}
                        value={categoryFilter}
                        options={categoryOptions}
                        onChange={setCategoryFilter}
                      />
                      <FilterDropdown
                        label="Due Date"
                        icon={<IconCalendar className="size-4" />}
                        value={dateRangeFilter || "all"}
                        options={dateRangeOptions}
                        onChange={(value) =>
                          setDateRangeFilter(
                            value === "all"
                              ? "all"
                              : (value as TaskFilters["dateRange"]),
                          )
                        }
                      />
                      {getActiveFilterCount() > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-8 px-3 text-xs whitespace-nowrap"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="mt-6">
                  <TaskList
                    onEditTask={handleEditTask}
                    onDeleteTask={handleTaskDeleted}
                    onCreateTask={() => setIsCreating(true)}
                    filters={getTaskFilters()}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail/Create Panel */}
      <TaskDetailPanel
        taskId={selectedTaskId}
        createMode={isCreating}
        editMode={isEditMode}
        open={!!selectedTaskId || isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTaskId(null);
            setIsCreating(false);
            setIsEditMode(false);
          }
        }}
        onSuccess={() => {
          setIsCreating(false);
          setSelectedTaskId(null);
          setIsEditMode(false);
        }}
      />
    </div>
  );
}
