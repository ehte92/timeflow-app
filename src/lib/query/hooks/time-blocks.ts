import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TimeBlock, TimeBlockType } from "@/lib/db/schema/time-blocks";
import { queryKeys } from "@/lib/query/client";

// Types for API requests/responses
interface TimeBlocksResponse {
  timeBlocks: TimeBlock[];
  count: number;
}

export type TimeBlockSortBy = "startTime" | "endTime" | "createdAt";
export type TimeBlockSortOrder = "asc" | "desc";

export interface TimeBlockFilters {
  type?: TimeBlockType;
  taskId?: string;
  startDate?: string; // ISO datetime string
  endDate?: string; // ISO datetime string
  sortBy?: TimeBlockSortBy;
  sortOrder?: TimeBlockSortOrder;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface CreateTimeBlockData {
  title?: string;
  type?: TimeBlockType;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  description?: string;
  taskId?: string;
}

interface UpdateTimeBlockData {
  title?: string;
  type?: TimeBlockType;
  startTime?: string; // ISO datetime string
  endTime?: string; // ISO datetime string
  description?: string | null;
  taskId?: string | null;
}

// API functions
const timeBlockApi = {
  // Fetch all time blocks with optional filters
  fetchTimeBlocks: async (
    filters?: TimeBlockFilters,
  ): Promise<TimeBlocksResponse> => {
    const searchParams = new URLSearchParams();

    if (filters?.type) searchParams.set("type", filters.type);
    if (filters?.taskId) searchParams.set("taskId", filters.taskId);
    if (filters?.startDate) searchParams.set("startDate", filters.startDate);
    if (filters?.endDate) searchParams.set("endDate", filters.endDate);
    if (filters?.sortBy) searchParams.set("sortBy", filters.sortBy);
    if (filters?.sortOrder) searchParams.set("sortOrder", filters.sortOrder);
    if (filters?.limit) searchParams.set("limit", filters.limit.toString());
    if (filters?.offset) searchParams.set("offset", filters.offset.toString());

    const url = `/api/time-blocks${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch time blocks");
    }

    return response.json();
  },

  // Fetch a single time block
  fetchTimeBlock: async (id: string): Promise<{ timeBlock: TimeBlock }> => {
    const response = await fetch(`/api/time-blocks/${id}`);

    if (!response.ok) {
      throw new Error("Failed to fetch time block");
    }

    return response.json();
  },

  // Create a new time block
  createTimeBlock: async (
    data: CreateTimeBlockData,
  ): Promise<{ timeBlock: TimeBlock; message: string }> => {
    const response = await fetch("/api/time-blocks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create time block");
    }

    return response.json();
  },

  // Update an existing time block
  updateTimeBlock: async (
    id: string,
    data: UpdateTimeBlockData,
  ): Promise<{ timeBlock: TimeBlock; message: string }> => {
    const response = await fetch(`/api/time-blocks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update time block");
    }

    return response.json();
  },

  // Delete a time block
  deleteTimeBlock: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/time-blocks/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete time block");
    }

    return response.json();
  },
};

// Query Hooks

// Fetch all time blocks with optional filters
export function useTimeBlocks(filters?: TimeBlockFilters) {
  return useQuery({
    queryKey: queryKeys.timeBlocks.list(filters),
    queryFn: () => timeBlockApi.fetchTimeBlocks(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes - time blocks change frequently
  });
}

// Fetch a single time block
export function useTimeBlock(id: string) {
  return useQuery({
    queryKey: queryKeys.timeBlocks.detail(id),
    queryFn: () => timeBlockApi.fetchTimeBlock(id),
    enabled: !!id, // Only run if id exists
  });
}

// Mutation Hooks

// Create a new time block
export function useCreateTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: timeBlockApi.createTimeBlock,
    onSuccess: () => {
      // Invalidate and refetch all time block lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.timeBlocks.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to create time block:", error);
    },
  });
}

// Update a time block
export function useUpdateTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeBlockData }) =>
      timeBlockApi.updateTimeBlock(id, data),
    onSuccess: (result, variables) => {
      // Update the specific time block in cache
      queryClient.setQueryData(queryKeys.timeBlocks.detail(variables.id), {
        timeBlock: result.timeBlock,
      });

      // Invalidate time block lists to reflect changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.timeBlocks.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to update time block:", error);
    },
  });
}

// Delete a time block
export function useDeleteTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: timeBlockApi.deleteTimeBlock,
    onSuccess: (_, timeBlockId) => {
      // Remove the time block from all relevant queries
      queryClient.removeQueries({
        queryKey: queryKeys.timeBlocks.detail(timeBlockId),
      });

      // Invalidate time block lists to reflect deletion
      queryClient.invalidateQueries({
        queryKey: queryKeys.timeBlocks.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to delete time block:", error);
    },
  });
}
