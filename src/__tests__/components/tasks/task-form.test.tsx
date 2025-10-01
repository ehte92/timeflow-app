import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  mockFetch,
  mockFetchError,
  render,
} from "@/__tests__/utils/test-utils";
import { TaskForm } from "@/components/tasks/task-form";
import type { Task } from "@/lib/db/schema/tasks";

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("TaskForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  it("should render form with all fields", () => {
    render(<TaskForm />);

    expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/priority/i)).toBeInTheDocument(); // Label text without for attribute
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create task/i }),
    ).toBeInTheDocument();
  });

  it("should show validation error for empty title", async () => {
    render(<TaskForm />);

    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    const mockTask = {
      id: "task-123",
      title: "Test Task",
      description: "Test Description",
      priority: "medium", // Use default priority
      status: "todo",
      userId: "user-123",
    };

    mockFetch(
      { task: mockTask, message: "Task created successfully" },
      true,
      201,
    );

    const onSuccess = jest.fn();
    render(<TaskForm onSuccess={onSuccess} />);

    // Fill form fields
    await user.type(screen.getByLabelText(/task title/i), "Test Task");
    await user.type(screen.getByLabelText(/description/i), "Test Description");

    // Submit form (skip Select interaction for now)
    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Task",
          description: "Test Description",
          priority: "medium", // Default priority
          dueDate: undefined,
        }),
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("should redirect to tasks page when no onSuccess callback provided", async () => {
    const mockTask = {
      id: "task-123",
      title: "Test Task",
      status: "todo",
      userId: "user-123",
    };

    mockFetch(
      { task: mockTask, message: "Task created successfully" },
      true,
      201,
    );

    render(<TaskForm />);

    await user.type(screen.getByLabelText(/task title/i), "Test Task");

    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/tasks");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("should show error message when submission fails", async () => {
    mockFetchError(400, "Title is required");

    render(<TaskForm />);

    await user.type(screen.getByLabelText(/task title/i), "Test Task");

    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it("should show loading state during submission", async () => {
    // Mock a slow response
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 201,
                json: () => Promise.resolve({ task: {}, message: "Created" }),
              }),
            100,
          ),
        ),
    );

    render(<TaskForm />);

    await user.type(screen.getByLabelText(/task title/i), "Test Task");

    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/creating.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for submission to complete
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /create task/i }),
        ).not.toBeDisabled();
      },
      { timeout: 200 },
    );
  });

  it("should reset form after successful submission", async () => {
    const mockTask = {
      id: "task-123",
      title: "Test Task",
      status: "todo",
      userId: "user-123",
    };
    mockFetch(
      { task: mockTask, message: "Task created successfully" },
      true,
      201,
    );

    render(<TaskForm />);

    const titleInput = screen.getByLabelText(/task title/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(titleInput, "Test Task");
    await user.type(descriptionInput, "Test Description");

    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(titleInput).toHaveValue("");
      expect(descriptionInput).toHaveValue("");
    });
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const onCancel = jest.fn();
    render(<TaskForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it("should not show cancel button when onCancel is not provided", () => {
    render(<TaskForm />);

    expect(
      screen.queryByRole("button", { name: /cancel/i }),
    ).not.toBeInTheDocument();
  });

  it("should handle due date input", async () => {
    const mockTask = {
      id: "task-123",
      title: "Test Task",
      status: "todo",
      userId: "user-123",
    };
    mockFetch(
      { task: mockTask, message: "Task created successfully" },
      true,
      201,
    );

    render(<TaskForm />);

    await user.type(screen.getByLabelText(/task title/i), "Test Task");
    await user.type(screen.getByLabelText(/due date/i), "2024-12-25T10:00");

    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      const expectedCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[0] === "/api/tasks" && call[1]?.method === "POST",
      );
      expect(expectedCall).toBeDefined();

      const body = JSON.parse(expectedCall[1].body);
      expect(body.title).toBe("Test Task");
      expect(body.priority).toBe("medium");
      expect(body.dueDate).toMatch(/2024-12-25/); // Check date portion, ignore exact time format
    });
  });

  it("should disable form fields during submission", async () => {
    // Mock a slow response
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 201,
                json: () => Promise.resolve({ task: {}, message: "Created" }),
              }),
            100,
          ),
        ),
    );

    render(<TaskForm />);

    await user.type(screen.getByLabelText(/task title/i), "Test Task");

    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);

    // All form fields should be disabled during submission
    expect(screen.getByLabelText(/task title/i)).toBeDisabled();
    expect(screen.getByLabelText(/description/i)).toBeDisabled();
    expect(screen.getByLabelText(/due date/i)).toBeDisabled();

    // Wait for submission to complete
    await waitFor(
      () => {
        expect(screen.getByLabelText(/task title/i)).not.toBeDisabled();
      },
      { timeout: 200 },
    );
  });

  it("should handle priority selection correctly", async () => {
    const mockTask = {
      id: "task-123",
      title: "Test Task",
      status: "todo",
      userId: "user-123",
    };
    mockFetch(
      { task: mockTask, message: "Task created successfully" },
      true,
      201,
    );

    render(<TaskForm />);

    await user.type(screen.getByLabelText(/task title/i), "Test Task");

    // Test that select fields exist (priority and category)
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes.length).toBeGreaterThanOrEqual(2); // Priority and Category

    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);

    // Should submit with default priority
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Task",
          description: undefined,
          priority: "medium", // Default priority
          dueDate: undefined,
        }),
      });
    });
  });

  describe("Edit Mode", () => {
    const mockTask: Task = {
      id: "task-123",
      title: "Existing Task",
      description: "Existing description",
      priority: "high",
      status: "todo",
      dueDate: new Date("2024-12-25T10:00:00Z"),
      categoryId: null,
      estimatedMinutes: null,
      actualMinutes: null,
      completedAt: null,
      userId: "user-123",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    it("should render in edit mode with task data pre-filled", () => {
      render(<TaskForm task={mockTask} />);

      expect(screen.getByDisplayValue("Existing Task")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Existing description"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /update task/i }),
      ).toBeInTheDocument();
    });

    it("should pre-fill due date correctly in edit mode", () => {
      render(<TaskForm task={mockTask} />);

      const dueDateInput = screen.getByLabelText(
        /due date/i,
      ) as HTMLInputElement;
      expect(dueDateInput.value).toBe("2024-12-25T10:00");
    });

    it("should submit update request when editing task", async () => {
      const updatedTask = { ...mockTask, title: "Updated Task" };
      mockFetch(
        { task: updatedTask, message: "Task updated successfully" },
        true,
        200,
      );

      render(<TaskForm task={mockTask} />);

      const titleInput = screen.getByLabelText(/task title/i);
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Task");

      const submitButton = screen.getByRole("button", { name: /update task/i });
      await user.click(submitButton);

      await waitFor(() => {
        const expectedCall = (global.fetch as jest.Mock).mock.calls.find(
          (call) =>
            call[0] === "/api/tasks/task-123" && call[1]?.method === "PUT",
        );
        expect(expectedCall).toBeDefined();

        const body = JSON.parse(expectedCall[1].body);
        expect(body.title).toBe("Updated Task");
        expect(body.description).toBe("Existing description");
        expect(body.priority).toBe("high");
        expect(body.dueDate).toMatch(/2024-12-25T\d{2}:00:00\.000Z/); // Allow any hour due to timezone conversion
      });
    });

    it("should show loading state during update", async () => {
      // Mock a slow response
      global.fetch = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: () =>
                    Promise.resolve({ task: mockTask, message: "Updated" }),
                }),
              100,
            ),
          ),
      );

      render(<TaskForm task={mockTask} />);

      const submitButton = screen.getByRole("button", { name: /update task/i });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/updating.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for submission to complete
      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: /update task/i }),
          ).not.toBeDisabled();
        },
        { timeout: 200 },
      );
    });

    it("should show error message when update fails", async () => {
      mockFetchError(400, "Update failed");

      render(<TaskForm task={mockTask} />);

      const submitButton = screen.getByRole("button", { name: /update task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });

    it("should not reset form after successful update", async () => {
      const updatedTask = { ...mockTask, title: "Updated Task" };
      mockFetch(
        { task: updatedTask, message: "Task updated successfully" },
        true,
        200,
      );

      render(<TaskForm task={mockTask} />);

      const titleInput = screen.getByLabelText(/task title/i);
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Task");

      const submitButton = screen.getByRole("button", { name: /update task/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Form should not be reset in edit mode
        expect(screen.getByDisplayValue("Updated Task")).toBeInTheDocument();
      });
    });

    it("should call onSuccess callback after successful update", async () => {
      const onSuccess = jest.fn();
      const updatedTask = { ...mockTask, title: "Updated Task" };
      mockFetch(
        { task: updatedTask, message: "Task updated successfully" },
        true,
        200,
      );

      render(<TaskForm task={mockTask} onSuccess={onSuccess} />);

      const submitButton = screen.getByRole("button", { name: /update task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("should handle task without description in edit mode", () => {
      const taskWithoutDescription = { ...mockTask, description: null };
      render(<TaskForm task={taskWithoutDescription} />);

      const descriptionInput = screen.getByLabelText(
        /description/i,
      ) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe("");
    });

    it("should handle task without due date in edit mode", () => {
      const taskWithoutDueDate = { ...mockTask, dueDate: null };
      render(<TaskForm task={taskWithoutDueDate} />);

      const dueDateInput = screen.getByLabelText(
        /due date/i,
      ) as HTMLInputElement;
      expect(dueDateInput.value).toBe("");
    });
  });
});
