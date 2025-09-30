import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/lib/query/hooks/categories";

// Mock category data
const createMockCategory = (overrides = {}) => ({
  id: "cat-123",
  name: "Work",
  color: "#3B82F6",
  userId: "user-123",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

const createMockCategoriesResponse = (
  categories: ReturnType<typeof createMockCategory>[],
) => ({
  categories,
  count: categories.length,
});

const mockFetch = (data: unknown, isSuccess = true, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: isSuccess,
    status,
    json: async () => data,
  });
};

const mockFetchError = (status: number, errorMessage: string) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: errorMessage }),
  });
};

// Create wrapper for hooks
function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("Category Query Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("useCategories", () => {
    it("should fetch categories successfully", async () => {
      const mockCategories = [
        createMockCategory({ id: "1", name: "Work" }),
        createMockCategory({ id: "2", name: "Personal" }),
      ];
      const mockResponse = createMockCategoriesResponse(mockCategories);

      mockFetch(mockResponse);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith("/api/categories");
    });

    it("should return empty array when no categories", async () => {
      const mockResponse = createMockCategoriesResponse([]);
      mockFetch(mockResponse);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.categories).toEqual([]);
      expect(result.current.data?.count).toBe(0);
    });

    it("should handle fetch error", async () => {
      mockFetchError(500, "Server Error");

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Server Error");
    });

    it("should handle unauthorized error", async () => {
      mockFetchError(401, "Unauthorized");

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Unauthorized");
    });
  });

  describe("useCreateCategory", () => {
    it("should create category successfully", async () => {
      const newCategory = createMockCategory({ name: "New Category" });
      const mockResponse = {
        category: newCategory,
        message: "Category created successfully",
      };

      mockFetch(mockResponse, true, 201);

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      const categoryData = {
        name: "New Category",
        color: "#3B82F6",
      };

      await act(async () => {
        const response = await result.current.mutateAsync(categoryData);
        expect(response).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });
    });

    it("should create category with default color", async () => {
      const newCategory = createMockCategory({ color: "#3B82F6" });
      const mockResponse = {
        category: newCategory,
        message: "Category created successfully",
      };

      mockFetch(mockResponse, true, 201);

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      const categoryData = {
        name: "New Category",
      };

      await act(async () => {
        await result.current.mutateAsync(categoryData);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });
    });

    it("should handle duplicate name error", async () => {
      mockFetchError(409, "A category with this name already exists");

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      const categoryData = { name: "Existing Category", color: "#3B82F6" };

      await act(async () => {
        try {
          await result.current.mutateAsync(categoryData);
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect((error as Error).message).toBe(
            "A category with this name already exists",
          );
        }
      });
    });

    it("should handle validation error", async () => {
      mockFetchError(400, "Validation failed");

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      const categoryData = { name: "", color: "#3B82F6" };

      await act(async () => {
        try {
          await result.current.mutateAsync(categoryData);
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect((error as Error).message).toBe("Validation failed");
        }
      });
    });

    it("should invalidate categories queries on success", async () => {
      const newCategory = createMockCategory();
      mockFetch(
        { category: newCategory, message: "Category created" },
        true,
        201,
      );

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          name: "Test Category",
          color: "#3B82F6",
        });
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["categories", "list"],
        });
      });
    });
  });

  describe("useUpdateCategory", () => {
    const categoryId = "cat-123";

    it("should update category successfully", async () => {
      const updatedCategory = createMockCategory({
        id: categoryId,
        name: "Updated Work",
      });
      const mockResponse = {
        category: updatedCategory,
        message: "Category updated successfully",
      };

      mockFetch(mockResponse);

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData = { name: "Updated Work" };

      await act(async () => {
        const response = await result.current.mutateAsync({
          id: categoryId,
          data: updateData,
        });
        expect(response).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/categories/${categoryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        },
      );
    });

    it("should update only color", async () => {
      const updatedCategory = createMockCategory({
        id: categoryId,
        color: "#EF4444",
      });
      const mockResponse = {
        category: updatedCategory,
        message: "Category updated successfully",
      };

      mockFetch(mockResponse);

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData = { color: "#EF4444" };

      await act(async () => {
        await result.current.mutateAsync({
          id: categoryId,
          data: updateData,
        });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/categories/${categoryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        },
      );
    });

    it("should update both name and color", async () => {
      const updatedCategory = createMockCategory({
        id: categoryId,
        name: "Updated Work",
        color: "#10B981",
      });
      const mockResponse = {
        category: updatedCategory,
        message: "Category updated successfully",
      };

      mockFetch(mockResponse);

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData = { name: "Updated Work", color: "#10B981" };

      await act(async () => {
        await result.current.mutateAsync({
          id: categoryId,
          data: updateData,
        });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/categories/${categoryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        },
      );
    });

    it("should handle not found error", async () => {
      mockFetchError(404, "Category not found");

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: "nonexistent-id",
            data: { name: "Updated" },
          });
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect((error as Error).message).toBe("Category not found");
        }
      });
    });

    it("should handle duplicate name error", async () => {
      mockFetchError(409, "A category with this name already exists");

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: categoryId,
            data: { name: "Existing Name" },
          });
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect((error as Error).message).toBe(
            "A category with this name already exists",
          );
        }
      });
    });

    it("should invalidate categories queries on success", async () => {
      const updatedCategory = createMockCategory();
      mockFetch({ category: updatedCategory, message: "Updated" });

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: categoryId,
          data: { name: "Updated Category" },
        });
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["categories", "list"],
        });
      });
    });
  });

  describe("useDeleteCategory", () => {
    const categoryId = "cat-123";

    it("should delete category successfully", async () => {
      const mockResponse = { message: "Category deleted successfully" };
      mockFetch(mockResponse);

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        const response = await result.current.mutateAsync(categoryId);
        expect(response).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/categories/${categoryId}`,
        {
          method: "DELETE",
        },
      );
    });

    it("should handle not found error", async () => {
      mockFetchError(404, "Category not found");

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync("nonexistent-id");
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect((error as Error).message).toBe("Category not found");
        }
      });
    });

    it("should invalidate both categories and tasks queries on success", async () => {
      mockFetch({ message: "Category deleted" });

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(categoryId);
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["categories", "list"],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["tasks", "list"],
        });
      });
    });

    it("should handle unauthorized error", async () => {
      mockFetchError(401, "Unauthorized");

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(categoryId);
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect((error as Error).message).toBe("Unauthorized");
        }
      });
    });

    it("should handle invalid UUID error", async () => {
      mockFetchError(400, "Invalid category ID format");

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync("invalid-uuid");
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect((error as Error).message).toBe("Invalid category ID format");
        }
      });
    });
  });
});
