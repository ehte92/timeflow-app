import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Category } from "@/lib/db/schema/categories";
import { queryKeys } from "@/lib/query/client";

// Types for API requests/responses
interface CategoriesResponse {
  categories: Category[];
  count: number;
}

interface CreateCategoryData {
  name: string;
  color?: string;
}

interface UpdateCategoryData {
  name?: string;
  color?: string;
}

interface CategoryResponse {
  message: string;
  category: Category;
}

// Hook to fetch all categories
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: async (): Promise<CategoriesResponse> => {
      const response = await fetch("/api/categories");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch categories");
      }

      return response.json();
    },
  });
}

// Hook to create a new category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryData): Promise<CategoryResponse> => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
    onError: (error: Error) => {
      console.error("Error creating category:", error);
    },
  });
}

// Hook to update a category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCategoryData;
    }): Promise<CategoryResponse> => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
    onError: (error: Error) => {
      console.error("Error updating category:", error);
    },
  });
}

// Hook to delete a category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch both categories and tasks
      // (tasks need to be refreshed since they may have been uncategorized)
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
    onError: (error: Error) => {
      console.error("Error deleting category:", error);
    },
  });
}
