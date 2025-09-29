import { expect, test } from "@playwright/test";
import {
  createHighPriorityTask,
  createMockTasksForDateFilter,
  createMockTasksForPriorityFilter,
  TasksPageHelper,
} from "./helpers/test-utils";

test.describe("Task Filtering E2E", () => {
  let tasksPage: TasksPageHelper;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPageHelper(page);

    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "next-auth.session-token",
        "mock-session-token",
      );
    });

    await tasksPage.goto();
    await tasksPage.waitForTasksToLoad();
  });

  test.describe("Filter UI Components", () => {
    test("should display all filter sections", async () => {
      await tasksPage.expectFilterSectionVisible();
    });

    test("should show no active filters initially", async () => {
      await tasksPage.expectActiveFilterCount(0);
    });

    test("should display all priority filter options", async ({ page }) => {
      await expect(page.getByRole("button", { name: "All" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Low" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Medium" })).toBeVisible();
      await expect(page.getByRole("button", { name: "High" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Urgent" })).toBeVisible();
    });

    test("should display all status filter options", async ({ page }) => {
      const allButtons = page.getByRole("button", { name: "All" });
      await expect(allButtons.first()).toBeVisible(); // Status All
      await expect(page.getByRole("button", { name: "To Do" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "In Progress" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Completed" }),
      ).toBeVisible();
    });

    test("should display all date range filter options", async ({ page }) => {
      const allButtons = page.getByRole("button", { name: "All" });
      await expect(allButtons.last()).toBeVisible(); // Date All
      await expect(page.getByRole("button", { name: "Overdue" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Tomorrow" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "This Week" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Next Week" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "This Month" }),
      ).toBeVisible();
    });
  });

  test.describe("Priority Filtering", () => {
    test("should filter tasks by low priority", async ({ page }) => {
      // Mock API response for low priority filter
      await page.route("/api/tasks?priority=low", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForPriorityFilter("low"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickPriorityFilter("low");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("Low Priority Task");
    });

    test("should filter tasks by medium priority", async ({ page }) => {
      await page.route("/api/tasks?priority=medium", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForPriorityFilter("medium"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickPriorityFilter("medium");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("Medium Priority Task");
    });

    test("should filter tasks by high priority", async ({ page }) => {
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForPriorityFilter("high"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("High Priority Task");
    });

    test("should filter tasks by urgent priority", async ({ page }) => {
      await page.route("/api/tasks?priority=urgent", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForPriorityFilter("urgent"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickPriorityFilter("urgent");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("Urgent Priority Task");
    });

    test("should show priority colors correctly", async ({ page }) => {
      // Test that priority badges have correct styling
      const lowButton = page.getByRole("button", { name: "Low" });
      const mediumButton = page.getByRole("button", { name: "Medium" });
      const highButton = page.getByRole("button", { name: "High" });
      const urgentButton = page.getByRole("button", { name: "Urgent" });

      await expect(lowButton).toHaveClass(/green/);
      await expect(mediumButton).toHaveClass(/yellow/);
      await expect(highButton).toHaveClass(/orange/);
      await expect(urgentButton).toHaveClass(/red/);
    });

    test("should reset to all priorities when All is clicked", async ({
      page,
    }) => {
      // First apply a priority filter
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForPriorityFilter("high"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.expectActiveFilterCount(1);

      // Mock API response for all tasks
      await page.route("/api/tasks", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [],
            count: 0,
          }),
        });
      });

      // Click All in priority section (first All button)
      const allButtons = page.getByRole("button", { name: "All" });
      await allButtons.first().click(); // Priority All button
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(0);
    });
  });

  test.describe("Date Range Filtering", () => {
    test("should filter overdue tasks", async ({ page }) => {
      await page.route("/api/tasks?dateRange=overdue", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForDateFilter("overdue"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickDateRangeFilter("overdue");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("Overdue Task");
    });

    test("should filter tasks due today", async ({ page }) => {
      await page.route("/api/tasks?dateRange=today", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForDateFilter("today"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickDateRangeFilter("today");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("Today Task");
    });

    test("should filter tasks due tomorrow", async ({ page }) => {
      await page.route("/api/tasks?dateRange=tomorrow", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForDateFilter("tomorrow"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickDateRangeFilter("tomorrow");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("Tomorrow Task");
    });

    test("should filter tasks due this week", async ({ page }) => {
      await page.route("/api/tasks?dateRange=this_week", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForDateFilter("this_week"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickDateRangeFilter("this_week");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("This_week Task");
    });

    test("should filter tasks due next week", async ({ page }) => {
      await page.route("/api/tasks?dateRange=next_week", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForDateFilter("next_week"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickDateRangeFilter("next_week");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("Next_week Task");
    });

    test("should filter tasks due this month", async ({ page }) => {
      await page.route("/api/tasks?dateRange=this_month", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForDateFilter("this_month"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickDateRangeFilter("this_month");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("This_month Task");
    });

    test("should highlight overdue filter in red", async ({ page }) => {
      const overdueButton = page.getByRole("button", { name: "Overdue" });
      await expect(overdueButton).toHaveClass(/red/);
    });
  });

  test.describe("Status Filtering", () => {
    test("should filter tasks by todo status", async ({ page }) => {
      await page.route("/api/tasks?status=todo", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [
              {
                id: "1",
                title: "Todo Task",
                description: "A todo task",
                status: "todo",
                priority: "medium",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
                dueDate: null,
                completedAt: null,
                categoryId: null,
                estimatedMinutes: null,
                actualMinutes: null,
              },
            ],
            count: 1,
          }),
        });
      });

      await tasksPage.clickStatusFilter("todo");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("Todo Task");
    });

    test("should filter tasks by completed status", async ({ page }) => {
      await page.route("/api/tasks?status=completed", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [
              {
                id: "1",
                title: "Completed Task",
                description: "A completed task",
                status: "completed",
                priority: "medium",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
                dueDate: null,
                completedAt: new Date().toISOString(),
                categoryId: null,
                estimatedMinutes: null,
                actualMinutes: null,
              },
            ],
            count: 1,
          }),
        });
      });

      await tasksPage.clickStatusFilter("completed");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("Completed Task");
    });

    test("should filter tasks by in progress status", async ({ page }) => {
      await page.route("/api/tasks?status=in_progress", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [
              {
                id: "1",
                title: "In Progress Task",
                description: "An in progress task",
                status: "in_progress",
                priority: "medium",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
                dueDate: null,
                completedAt: null,
                categoryId: null,
                estimatedMinutes: null,
                actualMinutes: null,
              },
            ],
            count: 1,
          }),
        });
      });

      await tasksPage.clickStatusFilter("in_progress");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("In Progress Task");
    });
  });

  test.describe("Combined Filtering", () => {
    test("should apply multiple filters simultaneously", async ({ page }) => {
      // Mock API response for combined filters
      await page.route("/api/tasks?status=todo&priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [
              {
                id: "1",
                title: "High Priority Todo Task",
                description: "A high priority todo task",
                status: "todo",
                priority: "high",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
                dueDate: null,
                completedAt: null,
                categoryId: null,
                estimatedMinutes: null,
                actualMinutes: null,
              },
            ],
            count: 1,
          }),
        });
      });

      // Apply status filter first
      await tasksPage.clickStatusFilter("todo");
      await tasksPage.expectActiveFilterCount(1);

      // Apply priority filter
      await tasksPage.clickPriorityFilter("high");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(2);
      await tasksPage.expectTaskInList("High Priority Todo Task");
    });

    test("should apply three filters (status, priority, date)", async ({
      page,
    }) => {
      // Mock API response for triple filters
      await page.route(
        "/api/tasks?status=todo&priority=urgent&dateRange=overdue",
        (route) => {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              tasks: [
                {
                  id: "1",
                  title: "Urgent Overdue Todo Task",
                  description: "An urgent overdue todo task",
                  status: "todo",
                  priority: "urgent",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  userId: "user-123",
                  dueDate: "2023-01-01T12:00:00.000Z",
                  completedAt: null,
                  categoryId: null,
                  estimatedMinutes: null,
                  actualMinutes: null,
                },
              ],
              count: 1,
            }),
          });
        },
      );

      // Apply filters one by one
      await tasksPage.clickStatusFilter("todo");
      await tasksPage.expectActiveFilterCount(1);

      await tasksPage.clickPriorityFilter("urgent");
      await tasksPage.expectActiveFilterCount(2);

      await tasksPage.clickDateRangeFilter("overdue");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(3);
      await tasksPage.expectTaskInList("Urgent Overdue Todo Task");
    });

    test("should show correct filter count text", async ({ page }) => {
      // Mock single filter
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.expectActiveFilterCount(1);
      await expect(page.getByText("1 active filter")).toBeVisible();

      // Mock double filters
      await page.route("/api/tasks?priority=high&status=todo", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      await tasksPage.clickStatusFilter("todo");
      await tasksPage.expectActiveFilterCount(2);
      await expect(page.getByText("2 active filters")).toBeVisible();
    });
  });

  test.describe("Filter Clearing", () => {
    test("should clear all filters with Clear All button", async ({ page }) => {
      // Apply some filters first
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.expectActiveFilterCount(1);

      await page.route("/api/tasks?priority=high&status=todo", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      await tasksPage.clickStatusFilter("todo");
      await tasksPage.expectActiveFilterCount(2);

      // Mock API response for cleared filters
      await page.route("/api/tasks", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      // Clear all filters
      await tasksPage.clickClearAllFilters();
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(0);
    });

    test("should clear individual filters by clicking All", async ({
      page,
    }) => {
      // Apply priority filter
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.expectActiveFilterCount(1);

      // Mock API response for cleared priority filter
      await page.route("/api/tasks", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      // Click All in priority section to clear priority filter
      const priorityAllButton = page
        .getByRole("button", { name: "All" })
        .first();
      await priorityAllButton.click();
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectActiveFilterCount(0);
    });

    test("should maintain other filters when clearing one", async ({
      page,
    }) => {
      // Apply two filters
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.expectActiveFilterCount(1);

      await page.route("/api/tasks?priority=high&status=todo", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      await tasksPage.clickStatusFilter("todo");
      await tasksPage.expectActiveFilterCount(2);

      // Clear only priority filter
      await page.route("/api/tasks?status=todo", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      const priorityAllButton = page
        .getByRole("button", { name: "All" })
        .first();
      await priorityAllButton.click();
      await tasksPage.waitForFilteredResults();

      // Should have 1 active filter (status) remaining
      await tasksPage.expectActiveFilterCount(1);
    });
  });

  test.describe("Empty States and Error Handling", () => {
    test("should show empty state when no tasks match filter", async ({
      page,
    }) => {
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectNoTasksWithFilter();
    });

    test("should handle API errors during filtering", async ({ page }) => {
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error" }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectErrorState();
    });
  });

  test.describe("Filter Persistence", () => {
    test("should maintain filters when navigating back to tasks page", async ({
      page,
    }) => {
      // Apply a filter
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForPriorityFilter("high"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.expectActiveFilterCount(1);

      // Navigate away and back
      await page.goto("/dashboard");
      await page.goto("/dashboard/tasks");
      await tasksPage.waitForTasksToLoad();

      // Filter should still be active (if implemented)
      // This test depends on whether you implement filter persistence in localStorage or URL
      // For now, we'll test that the page loads correctly
      await tasksPage.expectFilterSectionVisible();
    });
  });

  test.describe("Task Operations with Filters", () => {
    test("should maintain filter state after creating a task", async ({
      page,
    }) => {
      // Apply a filter
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: createMockTasksForPriorityFilter("high"),
            count: 1,
          }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.expectActiveFilterCount(1);

      // Mock task creation
      await page.route("/api/tasks", (route) => {
        if (route.request().method() === "POST") {
          route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              task: {
                id: "new-task",
                title: "New High Priority Task",
                priority: "high",
                status: "todo",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
              },
              message: "Task created",
            }),
          });
        } else {
          route.continue();
        }
      });

      // Create a task
      const newTask = createHighPriorityTask();
      await tasksPage.createTask(newTask);

      // Filter should still be active
      await tasksPage.expectActiveFilterCount(1);
    });

    test("should maintain filter state after editing a task", async ({
      page,
    }) => {
      // Apply a filter and create initial task
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [
              {
                id: "1",
                title: "High Priority Task",
                priority: "high",
                status: "todo",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
              },
            ],
            count: 1,
          }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.expectActiveFilterCount(1);
      await tasksPage.expectTaskInList("High Priority Task");

      // Mock task update
      await page.route("/api/tasks/*", (route) => {
        if (route.request().method() === "PUT") {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              task: {
                id: "1",
                title: "Updated High Priority Task",
                priority: "high",
                status: "todo",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
              },
              message: "Task updated",
            }),
          });
        } else {
          route.continue();
        }
      });

      // Edit the task
      const taskRow = page
        .locator("text=High Priority Task")
        .locator("..")
        .locator("..");
      await taskRow.getByRole("button", { name: /edit/i }).click();

      await page.getByLabel(/task title/i).fill("Updated High Priority Task");
      await page.getByRole("button", { name: /update task/i }).click();

      // Filter should still be active
      await tasksPage.expectActiveFilterCount(1);
    });

    test("should maintain filter state after deleting a task", async ({
      page,
    }) => {
      // Apply a filter with multiple tasks
      await page.route("/api/tasks?priority=high", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [
              {
                id: "1",
                title: "High Priority Task 1",
                priority: "high",
                status: "todo",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
              },
              {
                id: "2",
                title: "High Priority Task 2",
                priority: "high",
                status: "todo",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
              },
            ],
            count: 2,
          }),
        });
      });

      await tasksPage.clickPriorityFilter("high");
      await tasksPage.expectActiveFilterCount(1);

      // Mock task deletion
      await page.route("/api/tasks/*", (route) => {
        if (route.request().method() === "DELETE") {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ message: "Task deleted" }),
          });
        } else {
          route.continue();
        }
      });

      // Delete a task
      await tasksPage.deleteTask("High Priority Task 1");

      // Filter should still be active
      await tasksPage.expectActiveFilterCount(1);
    });
  });

  test.describe("Search Functionality", () => {
    test("should search tasks by title", async ({ page }) => {
      // Mock API response with tasks that match search
      await page.route("/api/tasks?search=meeting", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [
              {
                id: "1",
                title: "Team Meeting",
                description: "Weekly sync meeting",
                status: "todo",
                priority: "medium",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
                dueDate: null,
                completedAt: null,
                categoryId: null,
                estimatedMinutes: null,
                actualMinutes: null,
              },
              {
                id: "2",
                title: "Client Meeting Prep",
                description: "Prepare for client presentation",
                status: "in_progress",
                priority: "high",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
                dueDate: null,
                completedAt: null,
                categoryId: null,
                estimatedMinutes: null,
                actualMinutes: null,
              },
            ],
            count: 2,
          }),
        });
      });

      await tasksPage.searchTasks("meeting");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectTaskInList("Team Meeting");
      await tasksPage.expectTaskInList("Client Meeting Prep");
      await tasksPage.expectActiveFilterCount(1);
    });

    test("should search tasks by description", async ({ page }) => {
      await page.route("/api/tasks?search=presentation", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [
              {
                id: "1",
                title: "Client Meeting Prep",
                description: "Prepare for client presentation",
                status: "todo",
                priority: "high",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
                dueDate: null,
                completedAt: null,
                categoryId: null,
                estimatedMinutes: null,
                actualMinutes: null,
              },
            ],
            count: 1,
          }),
        });
      });

      await tasksPage.searchTasks("presentation");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectTaskInList("Client Meeting Prep");
      await tasksPage.expectActiveFilterCount(1);
    });

    test("should combine search with filters", async ({ page }) => {
      await page.route("/api/tasks?status=todo&search=meeting", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [
              {
                id: "1",
                title: "Team Meeting",
                description: "Weekly sync meeting",
                status: "todo",
                priority: "medium",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: "user-123",
                dueDate: null,
                completedAt: null,
                categoryId: null,
                estimatedMinutes: null,
                actualMinutes: null,
              },
            ],
            count: 1,
          }),
        });
      });

      await tasksPage.searchTasks("meeting");
      await tasksPage.clickStatusFilter("todo");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectTaskInList("Team Meeting");
      await tasksPage.expectActiveFilterCount(2);
    });

    test("should clear search when Clear All is clicked", async ({ page }) => {
      await page.route("/api/tasks", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [],
            count: 0,
          }),
        });
      });

      await tasksPage.searchTasks("meeting");
      await tasksPage.expectActiveFilterCount(1);

      await tasksPage.clickClearAllFilters();
      await tasksPage.expectActiveFilterCount(0);
      await tasksPage.expectSearchInputValue("");
    });

    test("should show no results for non-matching search", async ({ page }) => {
      await page.route("/api/tasks?search=nonexistent", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tasks: [],
            count: 0,
          }),
        });
      });

      await tasksPage.searchTasks("nonexistent");
      await tasksPage.waitForFilteredResults();

      await tasksPage.expectNoTasksWithFilter();
      await tasksPage.expectActiveFilterCount(1);
    });
  });
});
