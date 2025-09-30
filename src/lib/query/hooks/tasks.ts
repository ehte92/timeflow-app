import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskPriority, TaskStatus } from "@/lib/db/schema/tasks";
import { queryKeys } from "@/lib/query/client";

// Types for API requests/responses
interface TasksResponse {
  tasks: Task[];
  count: number;
}

export type TaskSortBy =
  | "createdAt"
  | "updatedAt"
  | "dueDate"
  | "priority"
  | "status"
  | "title"
  | "completedAt";

export type TaskSortOrder = "asc" | "desc";

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
  dateRange?:
    | "overdue"
    | "today"
    | "tomorrow"
    | "this_week"
    | "next_week"
    | "this_month";
  dueDateFrom?: string; // ISO date string
  dueDateTo?: string; // ISO date string
  search?: string; // Text search across title and description
  sortBy?: TaskSortBy;
  sortOrder?: TaskSortOrder;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  categoryId?: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  categoryId?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
}

// API functions
const taskApi = {
  // Fetch all tasks with optional filters
  fetchTasks: async (filters?: TaskFilters): Promise<TasksResponse> => {
    const searchParams = new URLSearchParams();

    if (filters?.status) searchParams.set("status", filters.status);
    if (filters?.priority) searchParams.set("priority", filters.priority);
    if (filters?.categoryId) searchParams.set("categoryId", filters.categoryId);
    if (filters?.dateRange) searchParams.set("dateRange", filters.dateRange);
    if (filters?.dueDateFrom)
      searchParams.set("dueDateFrom", filters.dueDateFrom);
    if (filters?.dueDateTo) searchParams.set("dueDateTo", filters.dueDateTo);
    if (filters?.search) searchParams.set("search", filters.search);
    if (filters?.sortBy) searchParams.set("sortBy", filters.sortBy);
    if (filters?.sortOrder) searchParams.set("sortOrder", filters.sortOrder);
    if (filters?.limit) searchParams.set("limit", filters.limit.toString());
    if (filters?.offset) searchParams.set("offset", filters.offset.toString());

    const url = `/api/tasks${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }

    return response.json();
  },

  // Fetch a single task
  fetchTask: async (id: string): Promise<{ task: Task }> => {
    const response = await fetch(`/api/tasks/${id}`);

    if (!response.ok) {
      throw new Error("Failed to fetch task");
    }

    return response.json();
  },

  // Create a new task
  createTask: async (
    data: CreateTaskData,
  ): Promise<{ task: Task; message: string }> => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        dueDate: data.dueDate
          ? new Date(data.dueDate).toISOString()
          : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create task");
    }

    return response.json();
  },

  // Update an existing task
  updateTask: async (
    id: string,
    data: UpdateTaskData,
  ): Promise<{ task: Task; message: string }> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update task");
    }

    return response.json();
  },

  // Delete a task
  deleteTask: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete task");
    }

    return response.json();
  },
};

// Query Hooks

// Fetch all tasks with optional filters
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => taskApi.fetchTasks(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes - tasks change frequently
  });
}

// Fetch a single task
export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => taskApi.fetchTask(id),
    enabled: !!id, // Only run if id exists
  });
}

// Mutation Hooks

// Create a new task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.createTask,
    onSuccess: () => {
      // Invalidate and refetch all task lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to create task:", error);
    },
  });
}

// Update a task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      taskApi.updateTask(id, data),
    onSuccess: (result, variables) => {
      // Update the specific task in cache
      queryClient.setQueryData(queryKeys.tasks.detail(variables.id), {
        task: result.task,
      });

      // Invalidate task lists to reflect changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to update task:", error);
    },
  });
}

// Delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.deleteTask,
    onSuccess: (_, taskId) => {
      // Remove the task from all relevant queries
      queryClient.removeQueries({
        queryKey: queryKeys.tasks.detail(taskId),
      });

      // Invalidate task lists to reflect deletion
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to delete task:", error);
    },
  });
}

// Toggle task status (completed/todo) with optimistic update
export function useToggleTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Task) => {
      const newStatus: TaskStatus =
        task.status === "completed" ? "todo" : "completed";
      return taskApi.updateTask(task.id, { status: newStatus });
    },
    onMutate: async (task: Task) => {
      const newStatus: TaskStatus =
        task.status === "completed" ? "todo" : "completed";

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.lists(),
      });

      // Snapshot the previous values
      const previousTaskLists = queryClient.getQueriesData({
        queryKey: queryKeys.tasks.lists(),
      });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.tasks.lists() },
        (old: TasksResponse | undefined) => {
          if (!old) return old;

          return {
            ...old,
            tasks: old.tasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: newStatus,
                    completedAt: newStatus === "completed" ? new Date() : null,
                  }
                : t,
            ),
          };
        },
      );

      // Return a context object with the snapshotted value
      return { previousTaskLists, task, newStatus };
    },
    onError: (_err, _task, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTaskLists) {
        for (const [queryKey, data] of context.previousTaskLists) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.lists(),
      });
    },
  });
}
