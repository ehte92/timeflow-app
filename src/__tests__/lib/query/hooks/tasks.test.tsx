import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  createMockTask,
  createMockTasksResponse,
  mockFetch,
  mockFetchError,
} from "@/__tests__/utils/test-utils";
import {
  useCreateTask,
  useDeleteTask,
  useTask,
  useTasks,
  useToggleTaskStatus,
  useUpdateTask,
} from "@/lib/query/hooks/tasks";

// Create wrapper for hooks
function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("Task Query Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("useTasks", () => {
    it("should fetch tasks successfully", async () => {
      const mockTasks = [
        createMockTask({ id: "1", title: "Task 1" }),
        createMockTask({ id: "2", title: "Task 2" }),
      ];
      const mockResponse = createMockTasksResponse(mockTasks);

      mockFetch(mockResponse);

      const { result } = renderHook(() => useTasks(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks");
    });

    it("should fetch tasks with filters", async () => {
      const mockResponse = createMockTasksResponse([]);
      mockFetch(mockResponse);

      const filters = {
        status: "completed" as const,
        priority: "high" as const,
        limit: 10,
      };

      const { result } = renderHook(() => useTasks(filters), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tasks?status=completed&priority=high&limit=10",
      );
    });

    it("should handle fetch error", async () => {
      mockFetchError(500, "Server Error");

      const { result } = renderHook(() => useTasks(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Failed to fetch tasks");
    });
  });

  describe("useTask", () => {
    const taskId = "task-123";

    it("should fetch single task successfully", async () => {
      const mockTask = createMockTask({ id: taskId });
      const mockResponse = { task: mockTask };

      mockFetch(mockResponse);

      const { result } = renderHook(() => useTask(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(`/api/tasks/${taskId}`);
    });

    it("should not fetch when id is empty", () => {
      const { result } = renderHook(() => useTask(""), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle fetch error", async () => {
      mockFetchError(404, "Task not found");

      const { result } = renderHook(() => useTask(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Failed to fetch task");
    });
  });

  describe("useCreateTask", () => {
    it("should create task successfully", async () => {
      const newTask = createMockTask({ title: "New Task" });
      const mockResponse = {
        task: newTask,
        message: "Task created successfully",
      };

      mockFetch(mockResponse, true, 201);

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createWrapper(queryClient),
      });

      const taskData = {
        title: "New Task",
        description: "New Description",
        priority: "medium" as const,
      };

      await act(async () => {
        const response = await result.current.mutateAsync(taskData);
        expect(response).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          dueDate: undefined,
        }),
      });
    });

    it("should handle creation error", async () => {
      mockFetchError(400, "Title is required");

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createWrapper(queryClient),
      });

      const taskData = { title: "" };

      await act(async () => {
        try {
          await result.current.mutateAsync(taskData);
        } catch (error) {
          expect((error as Error).message).toBe("Title is required");
        }
      });

      expect(result.current.isError).toBe(true);
    });

    it("should invalidate task queries on success", async () => {
      const newTask = createMockTask();
      mockFetch({ task: newTask, message: "Task created" }, true, 201);

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ title: "Test Task" });
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["tasks", "list"],
        });
      });
    });
  });

  describe("useUpdateTask", () => {
    const taskId = "task-123";

    it("should update task successfully", async () => {
      const updatedTask = createMockTask({ id: taskId, title: "Updated Task" });
      const mockResponse = {
        task: updatedTask,
        message: "Task updated successfully",
      };

      mockFetch(mockResponse);

      const { result } = renderHook(() => useUpdateTask(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData = { title: "Updated Task" };

      await act(async () => {
        const response = await result.current.mutateAsync({
          id: taskId,
          data: updateData,
        });
        expect(response).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
    });

    it("should update cache on success", async () => {
      const updatedTask = createMockTask({ id: taskId, title: "Updated Task" });
      mockFetch({ task: updatedTask, message: "Updated" });

      const setQueryDataSpy = jest.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useUpdateTask(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: taskId,
          data: { title: "Updated Task" },
        });
      });

      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalledWith(
          ["tasks", "detail", taskId],
          { task: updatedTask },
        );
      });
    });
  });

  describe("useDeleteTask", () => {
    const taskId = "task-123";

    it("should delete task successfully", async () => {
      const mockResponse = { message: "Task deleted successfully" };
      mockFetch(mockResponse);

      const { result } = renderHook(() => useDeleteTask(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        const response = await result.current.mutateAsync(taskId);
        expect(response).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
    });

    it("should remove queries on success", async () => {
      mockFetch({ message: "Task deleted" });

      const removeQueriesSpy = jest.spyOn(queryClient, "removeQueries");

      const { result } = renderHook(() => useDeleteTask(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(taskId);
      });

      await waitFor(() => {
        expect(removeQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["tasks", "detail", taskId],
        });
      });
    });
  });

  describe("useToggleTaskStatus", () => {
    it("should toggle task status from todo to completed", async () => {
      const task = createMockTask({ status: "todo" });
      const updatedTask = {
        ...task,
        status: "completed",
        completedAt: new Date(),
      };
      mockFetch({ task: updatedTask, message: "Task updated" });

      // Pre-populate cache with task list
      queryClient.setQueryData(["tasks", "list", undefined], {
        tasks: [task],
        count: 1,
      });

      const { result } = renderHook(() => useToggleTaskStatus(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(task);
      });

      expect(global.fetch).toHaveBeenCalledWith(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    });

    it("should toggle task status from completed to todo", async () => {
      const task = createMockTask({
        status: "completed",
        completedAt: new Date(),
      });
      const updatedTask = { ...task, status: "todo", completedAt: null };
      mockFetch({ task: updatedTask, message: "Task updated" });

      const { result } = renderHook(() => useToggleTaskStatus(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(task);
      });

      expect(global.fetch).toHaveBeenCalledWith(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "todo" }),
      });
    });

    it("should perform optimistic update", async () => {
      const task = createMockTask({ status: "todo" });
      const updatedTask = {
        ...task,
        status: "completed",
        completedAt: new Date(),
      };
      mockFetch({ task: updatedTask, message: "Updated" });

      // Pre-populate cache with task list
      queryClient.setQueryData(["tasks", "list", undefined], {
        tasks: [task],
        count: 1,
      });

      const { result } = renderHook(() => useToggleTaskStatus(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(task);
      });

      // Check that the mutation was called correctly
      expect(global.fetch).toHaveBeenCalledWith(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    });

    it("should rollback on error", async () => {
      const task = createMockTask({ status: "todo" });
      mockFetchError(500, "Server error");

      const { result } = renderHook(() => useToggleTaskStatus(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(task);
        } catch (error) {
          // Expected error
          expect((error as Error).message).toBe("Server error");
        }
      });

      // Verify the mutation was attempted
      expect(global.fetch).toHaveBeenCalledWith(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    });
  });
});
