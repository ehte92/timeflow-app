import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class TasksPageHelper {
  public page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/dashboard/tasks");
  }

  async waitForTasksToLoad() {
    // Wait for the tasks section to be visible
    await expect(
      this.page.getByRole("heading", { name: /your tasks/i }),
    ).toBeVisible();
  }

  async clickAddTaskButton() {
    await this.page.getByRole("button", { name: /add task/i }).click();
  }

  async clickCancelButton() {
    await this.page.getByRole("button", { name: /cancel/i }).click();
  }

  async expectFormToBeVisible() {
    await expect(
      this.page.getByRole("heading", { name: /create new task/i }),
    ).toBeVisible();
  }

  async expectFormToBeHidden() {
    await expect(
      this.page.getByRole("heading", { name: /create new task/i }),
    ).not.toBeVisible();
  }

  async fillTaskForm({
    title,
    description,
    priority = "medium",
    dueDate,
  }: {
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
  }) {
    await this.page.getByLabel(/task title/i).fill(title);

    if (description) {
      await this.page.getByLabel(/description/i).fill(description);
    }

    if (priority !== "medium") {
      await this.page.getByRole("combobox").click();
      await this.page.getByRole("option", { name: priority }).click();
    }

    if (dueDate) {
      await this.page.getByLabel(/due date/i).fill(dueDate);
    }
  }

  async submitTaskForm() {
    await this.page.getByRole("button", { name: /create task/i }).click();
  }

  async createTask(
    taskData: Parameters<typeof TasksPageHelper.prototype.fillTaskForm>[0],
  ) {
    await this.clickAddTaskButton();
    await this.expectFormToBeVisible();
    await this.fillTaskForm(taskData);
    await this.submitTaskForm();
    await this.expectFormToBeHidden();
  }

  async expectTaskInList(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }

  async toggleTaskStatus(taskTitle: string) {
    // Find the task row and click the status toggle button
    const taskRow = this.page
      .locator(`text=${taskTitle}`)
      .locator("..")
      .locator("..");
    await taskRow.locator('[data-testid="status-toggle"]').click();
  }

  async deleteTask(taskTitle: string) {
    // Find the task row and click the delete button
    const taskRow = this.page
      .locator(`text=${taskTitle}`)
      .locator("..")
      .locator("..");
    await taskRow.locator('[data-testid="delete-task"]').click();

    // Confirm deletion in modal/dialog
    await this.page.getByRole("button", { name: /delete/i }).click();
  }

  async expectTaskNotInList(taskTitle: string) {
    await expect(this.page.getByText(taskTitle)).not.toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.page.getByText(/no tasks found/i)).toBeVisible();
  }

  async expectErrorState() {
    await expect(this.page.getByText(/failed to fetch tasks/i)).toBeVisible();
  }

  async clickRetryButton() {
    await this.page.getByRole("button", { name: /retry/i }).click();
  }

  // Filtering methods
  async clickPriorityFilter(priority: "low" | "medium" | "high" | "urgent") {
    const priorityMap = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
    };
    await this.page
      .getByRole("button", { name: priorityMap[priority] })
      .click();
  }

  async clickStatusFilter(
    status: "all" | "todo" | "in_progress" | "completed",
  ) {
    const statusMap = {
      all: "All",
      todo: "To Do",
      in_progress: "In Progress",
      completed: "Completed",
    };
    await this.page.getByRole("button", { name: statusMap[status] }).click();
  }

  async clickDateRangeFilter(
    range:
      | "all"
      | "overdue"
      | "today"
      | "tomorrow"
      | "this_week"
      | "next_week"
      | "this_month",
  ) {
    const rangeMap = {
      all: "All",
      overdue: "Overdue",
      today: "Today",
      tomorrow: "Tomorrow",
      this_week: "This Week",
      next_week: "Next Week",
      this_month: "This Month",
    };
    await this.page.getByRole("button", { name: rangeMap[range] }).click();
  }

  async clickClearAllFilters() {
    await this.page.getByRole("button", { name: "Clear All" }).click();
  }

  async expectActiveFilterCount(count: number) {
    if (count === 0) {
      await expect(this.page.getByText(/active filter/)).not.toBeVisible();
      await expect(
        this.page.getByRole("button", { name: "Clear All" }),
      ).not.toBeVisible();
    } else if (count === 1) {
      await expect(this.page.getByText("1 active filter")).toBeVisible();
      await expect(
        this.page.getByRole("button", { name: "Clear All" }),
      ).toBeVisible();
    } else {
      await expect(
        this.page.getByText(`${count} active filters`),
      ).toBeVisible();
      await expect(
        this.page.getByRole("button", { name: "Clear All" }),
      ).toBeVisible();
    }
  }

  async expectFilterSectionVisible() {
    await expect(this.page.getByText("Status:")).toBeVisible();
    await expect(this.page.getByText("Priority:")).toBeVisible();
    await expect(this.page.getByText("Due:")).toBeVisible();
  }

  async expectTaskWithPriority(
    title: string,
    priority: "low" | "medium" | "high" | "urgent",
  ) {
    const taskRow = this.page
      .locator(`text=${title}`)
      .locator("..")
      .locator("..");
    const priorityText = priority.charAt(0).toUpperCase() + priority.slice(1);
    await expect(taskRow.getByText(priorityText)).toBeVisible();
  }

  async expectTaskWithStatus(
    title: string,
    status: "todo" | "in_progress" | "completed",
  ) {
    const taskRow = this.page
      .locator(`text=${title}`)
      .locator("..")
      .locator("..");

    if (status === "completed") {
      // Completed tasks should have strikethrough or completed styling
      await expect(taskRow).toHaveClass(/completed|line-through/);
    } else if (status === "in_progress") {
      // In progress tasks should have specific styling
      await expect(taskRow.getByText(/in progress|In Progress/i)).toBeVisible();
    } else {
      // Todo tasks are the default state
      await expect(taskRow).not.toHaveClass(/completed/);
    }
  }

  async expectNoTasksWithFilter() {
    // Should show "No tasks found" or similar when filter returns no results
    await expect(
      this.page.getByText(/no tasks found|no matching tasks/i),
    ).toBeVisible();
  }

  async waitForFilteredResults() {
    // Wait for the tasks list to update after applying filters
    await this.page.waitForTimeout(500); // Give time for API call and UI update
  }

  // Search functionality
  async searchTasks(searchTerm: string) {
    await this.page.getByPlaceholder("Search tasks...").fill(searchTerm);
    // Wait for debounced search to trigger
    await this.page.waitForTimeout(400);
  }

  async clearSearch() {
    const searchInput = this.page.getByPlaceholder("Search tasks...");
    await searchInput.fill("");
    // Wait for debounced search to trigger
    await this.page.waitForTimeout(400);
  }

  async expectSearchInputValue(value: string) {
    await expect(this.page.getByPlaceholder("Search tasks...")).toHaveValue(
      value,
    );
  }

  async expectTasksContaining(searchTerm: string) {
    // Check that visible tasks contain the search term
    const taskElements = this.page.locator('[data-testid="task-item"]');
    const count = await taskElements.count();

    for (let i = 0; i < count; i++) {
      const taskText = await taskElements.nth(i).textContent();
      expect(taskText?.toLowerCase()).toContain(searchTerm.toLowerCase());
    }
  }
}

export class AuthHelper {
  constructor(private page: Page) {}

  async login(email = "test@example.com", password = "password123") {
    await this.page.goto("/auth/signin");
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await this.page.waitForURL("/dashboard");
  }

  async logout() {
    await this.page.getByRole("button", { name: /sign out/i }).click();
    await this.page.waitForURL("/");
  }
}

// Test data factories
export const createTestTask = (overrides = {}) => ({
  title: "Test Task",
  description: "Test task description",
  priority: "medium" as const,
  dueDate: "2024-12-31",
  ...overrides,
});

export const createUrgentTask = () =>
  createTestTask({
    title: "Urgent Task",
    priority: "high",
    dueDate: "2024-01-15",
  });

export const createSimpleTask = () =>
  createTestTask({
    title: "Simple Task",
    description: undefined,
    dueDate: undefined,
  });

// Filter-specific test data factories
export const createLowPriorityTask = () =>
  createTestTask({
    title: "Low Priority Task",
    priority: "low",
    description: "This is a low priority task",
  });

export const createMediumPriorityTask = () =>
  createTestTask({
    title: "Medium Priority Task",
    priority: "medium",
    description: "This is a medium priority task",
  });

export const createHighPriorityTask = () =>
  createTestTask({
    title: "High Priority Task",
    priority: "high",
    description: "This is a high priority task",
  });

export const createUrgentPriorityTask = () =>
  createTestTask({
    title: "Urgent Priority Task",
    priority: "urgent",
    description: "This is an urgent priority task",
  });

// Date-specific tasks
export const createOverdueTask = () =>
  createTestTask({
    title: "Overdue Task",
    dueDate: "2023-01-01",
    description: "This task is overdue",
  });

export const createTodayTask = () => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  return createTestTask({
    title: "Today Task",
    dueDate: todayStr,
    description: "This task is due today",
  });
};

export const createTomorrowTask = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  return createTestTask({
    title: "Tomorrow Task",
    dueDate: tomorrowStr,
    description: "This task is due tomorrow",
  });
};

export const createThisWeekTask = () => {
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() + 3); // 3 days from now
  const thisWeekStr = thisWeek.toISOString().split("T")[0];
  return createTestTask({
    title: "This Week Task",
    dueDate: thisWeekStr,
    description: "This task is due this week",
  });
};

export const createNextWeekTask = () => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 10); // 10 days from now
  const nextWeekStr = nextWeek.toISOString().split("T")[0];
  return createTestTask({
    title: "Next Week Task",
    dueDate: nextWeekStr,
    description: "This task is due next week",
  });
};

export const createThisMonthTask = () => {
  const thisMonth = new Date();
  thisMonth.setDate(thisMonth.getDate() + 20); // 20 days from now
  const thisMonthStr = thisMonth.toISOString().split("T")[0];
  return createTestTask({
    title: "This Month Task",
    dueDate: thisMonthStr,
    description: "This task is due this month",
  });
};

// Task data for different statuses (will be updated via API in tests)
export const createCompletedTask = () =>
  createTestTask({
    title: "Completed Task",
    description: "This task is completed",
    status: "completed",
  });

export const createInProgressTask = () =>
  createTestTask({
    title: "In Progress Task",
    description: "This task is in progress",
    status: "in_progress",
  });

// Mock API response helpers for filtering tests
export const createMockTasksForPriorityFilter = (priority: string) => [
  {
    id: "1",
    title: `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Task`,
    description: `A ${priority} priority task`,
    status: "todo",
    priority: priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "user-123",
    dueDate: null,
    completedAt: null,
    categoryId: null,
    estimatedMinutes: null,
    actualMinutes: null,
  },
];

export const createMockTasksForDateFilter = (dateRange: string) => [
  {
    id: "1",
    title: `${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)} Task`,
    description: `A task for ${dateRange}`,
    status: "todo",
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "user-123",
    dueDate: getDateForRange(dateRange),
    completedAt: null,
    categoryId: null,
    estimatedMinutes: null,
    actualMinutes: null,
  },
];

function getDateForRange(range: string): string | null {
  const today = new Date();
  switch (range) {
    case "overdue":
      return "2023-01-01T12:00:00.000Z";
    case "today":
      return today.toISOString();
    case "tomorrow": {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    }
    case "this_week": {
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() + 3);
      return thisWeek.toISOString();
    }
    case "next_week": {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 10);
      return nextWeek.toISOString();
    }
    case "this_month": {
      const thisMonth = new Date(today);
      thisMonth.setDate(thisMonth.getDate() + 20);
      return thisMonth.toISOString();
    }
    default:
      return null;
  }
}
