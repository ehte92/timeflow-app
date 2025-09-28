import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { ReactElement, ReactNode } from "react";
import type { Task } from "@/lib/db/schema/tasks";

// Mock session data
export const mockSession = {
  user: {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
  },
  expires: "2025-12-31",
};

// Create a test query client with disabled retry and caching
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Test wrapper component
interface AllTheProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  session?: Session | null;
}

function AllTheProviders({
  children,
  queryClient = createTestQueryClient(),
  session = mockSession,
}: AllTheProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  session?: Session | null;
}

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { queryClient, session, ...renderOptions } = options;

  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders {...props} queryClient={queryClient} session={session} />
    ),
    ...renderOptions,
  });
};

// Task test data factories
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-123",
  title: "Test Task",
  description: "Test Description",
  priority: "medium",
  status: "todo",
  dueDate: null,
  completedAt: null,
  userId: "user-123",
  categoryId: null,
  estimatedMinutes: null,
  actualMinutes: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

export const createMockTasksResponse = (tasks = [createMockTask()]) => ({
  tasks,
  count: tasks.length,
});

// API response mocks
export const mockFetch = (response: unknown, ok = true, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(response),
  } as unknown as Response);
};

export const mockFetchError = (status = 500, message = "Server Error") => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ error: message }),
  } as unknown as Response);
};

// Wait for React Query to settle
export const waitForQueryToSettle = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Export custom render as default
export { customRender as render };

// Export the components for direct usage
export { AllTheProviders, createTestQueryClient };
