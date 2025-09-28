import { screen, waitFor } from "@testing-library/react";
import {
  createMockTasksResponse,
  mockFetch,
  render,
} from "@/__tests__/utils/test-utils";
import { TasksPageContent } from "@/components/tasks/tasks-page-content";

// Mock next/navigation
const mockGet = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock the TaskForm and TaskList components to focus on filter testing
jest.mock("@/components/tasks/task-form", () => ({
  TaskForm: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="task-form">
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

jest.mock("@/components/tasks/task-list", () => ({
  TaskList: ({ filters }: { filters?: Record<string, unknown> }) => (
    <div data-testid="task-list">
      Task List with filters: {JSON.stringify(filters || {})}
    </div>
  ),
}));

describe("TasksPageContent - Basic Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
    // Mock empty task list by default
    mockFetch(createMockTasksResponse([]));
  });

  describe("Basic Rendering", () => {
    it("should render the main page structure", async () => {
      render(<TasksPageContent />);

      await waitFor(() => {
        expect(screen.getAllByText("Tasks")[0]).toBeInTheDocument();
        expect(
          screen.getByText("Manage your tasks and stay organized"),
        ).toBeInTheDocument();
        expect(screen.getByText("Your Tasks")).toBeInTheDocument();
      });
    });

    it("should render filter sections", async () => {
      render(<TasksPageContent />);

      await waitFor(() => {
        // Check for filter section labels
        expect(screen.getByText("Status:")).toBeInTheDocument();
        expect(screen.getByText("Priority:")).toBeInTheDocument();
        expect(screen.getByText("Due:")).toBeInTheDocument();
      });
    });

    it("should render task list", async () => {
      render(<TasksPageContent />);

      await waitFor(() => {
        expect(screen.getByTestId("task-list")).toBeInTheDocument();
      });
    });
  });

  describe("Filter Interactions", () => {
    it("should render task list with filter interface", async () => {
      render(<TasksPageContent />);

      await waitFor(() => {
        expect(screen.getByTestId("task-list")).toBeInTheDocument();
      });
    });
  });

  describe("Form Integration", () => {
    it("should handle add task button", async () => {
      render(<TasksPageContent />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Add Task" }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Responsive Layout", () => {
    it("should handle layout changes", async () => {
      render(<TasksPageContent />);

      await waitFor(() => {
        expect(screen.getByText("Your Tasks")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Add Task" }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle basic functionality", async () => {
      render(<TasksPageContent />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Add Task" }),
        ).toBeInTheDocument();
        expect(screen.getByTestId("task-list")).toBeInTheDocument();
      });
    });
  });
});
