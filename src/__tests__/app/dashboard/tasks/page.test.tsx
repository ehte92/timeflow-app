/**
 * Simple smoke test for TasksPageContent component
 *
 * For comprehensive UI and integration testing, see E2E tests at:
 * /tests/e2e/tasks.spec.ts
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { TasksPageContent } from "@/components/tasks/tasks-page-content";
import { SidebarProvider } from "@/components/ui/sidebar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
  usePathname: () => "/dashboard/tasks",
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { id: "user-123", name: "Test User", email: "test@example.com" },
    },
    status: "authenticated",
  }),
}));

// Mock global fetch for basic functionality
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({ tasks: [], count: 0 }),
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </SidebarProvider>,
  );
}

describe("Tasks Page Smoke Test", () => {
  it("should render basic page structure without crashing", async () => {
    renderWithProviders(<TasksPageContent />);

    // Both mobile and desktop headers exist (two "Tasks" headings)
    expect(
      screen.getAllByRole("heading", { level: 1, name: /^tasks$/i }),
    ).toHaveLength(2);
    expect(
      screen.getByText(/manage your tasks and stay organized/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add task/i }),
    ).toBeInTheDocument();
  });
});
