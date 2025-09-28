import { expect, test } from "@playwright/test";
import {
  createSimpleTask,
  createTestTask,
  createUrgentTask,
  TasksPageHelper,
} from "./helpers/test-utils";

test.describe("Task Management", () => {
  let tasksPage: TasksPageHelper;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPageHelper(page);

    // Mock authentication for now - in real E2E we'd actually sign in
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "next-auth.session-token",
        "mock-session-token",
      );
    });

    await tasksPage.goto();
    await tasksPage.waitForTasksToLoad();
  });

  test.describe("Task Form", () => {
    test("should show and hide task form", async () => {
      // Form should be hidden initially
      await tasksPage.expectFormToBeHidden();

      // Click Add Task button to show form
      await tasksPage.clickAddTaskButton();
      await tasksPage.expectFormToBeVisible();

      // Click Cancel to hide form
      await tasksPage.clickCancelButton();
      await tasksPage.expectFormToBeHidden();
    });

    test("should auto-open form with new=true query parameter", async ({
      page,
    }) => {
      await page.goto("/dashboard/tasks?new=true");
      await tasksPage.waitForTasksToLoad();
      await tasksPage.expectFormToBeVisible();
    });

    test("should create a simple task", async () => {
      const task = createSimpleTask();
      await tasksPage.createTask(task);
      await tasksPage.expectTaskInList(task.title);
    });

    test("should create a task with full details", async () => {
      const task = createTestTask({
        title: "Complete Project",
        description: "Finish the task management feature",
        priority: "high",
        dueDate: "2024-12-25",
      });

      await tasksPage.createTask(task);
      await tasksPage.expectTaskInList(task.title);
    });

    test("should require task title", async ({ page }) => {
      await tasksPage.clickAddTaskButton();
      await tasksPage.expectFormToBeVisible();

      // Try to submit without title
      await tasksPage.submitTaskForm();

      // Form should show validation error and stay open
      await expect(page.getByText(/title is required/i)).toBeVisible();
      await tasksPage.expectFormToBeVisible();
    });

    test("should hide form after successful task creation", async () => {
      const task = createSimpleTask();
      await tasksPage.createTask(task);

      // Form should be hidden after creation
      await tasksPage.expectFormToBeHidden();
      await expect(
        tasksPage.page.getByRole("button", { name: /add task/i }),
      ).toBeVisible();
    });
  });

  test.describe("Task List", () => {
    test("should display empty state when no tasks", async ({ page }) => {
      // Mock empty tasks response
      await page.route("/api/tasks", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tasks: [], count: 0 }),
        });
      });

      await page.reload();
      await tasksPage.expectEmptyState();
    });

    test("should display error state on API failure", async ({ page }) => {
      // Mock API failure
      await page.route("/api/tasks", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error" }),
        });
      });

      await page.reload();
      await tasksPage.expectErrorState();
    });

    test("should retry fetching tasks", async ({ page }) => {
      let callCount = 0;

      // Mock API to fail first time, succeed second time
      await page.route("/api/tasks", (route) => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Server error" }),
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              tasks: [
                {
                  id: "1",
                  title: "Test Task",
                  status: "todo",
                  priority: "medium",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  userId: "user-123",
                },
              ],
              count: 1,
            }),
          });
        }
      });

      await page.reload();
      await tasksPage.expectErrorState();

      // Click retry button
      await tasksPage.clickRetryButton();

      // Should now show the task
      await tasksPage.expectTaskInList("Test Task");
    });

    test("should toggle task status", async ({ page }) => {
      // Create a task first
      const task = createSimpleTask();
      await tasksPage.createTask(task);

      // Mock the update API
      await page.route("/api/tasks/*", (route) => {
        if (route.request().method() === "PUT") {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              task: {
                id: "1",
                title: task.title,
                status: "completed",
                priority: "medium",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                userId: "user-123",
              },
              message: "Task updated",
            }),
          });
        } else {
          route.continue();
        }
      });

      // Toggle task status
      await tasksPage.toggleTaskStatus(task.title);

      // Task should now show as completed (this depends on your UI implementation)
      // You might need to adjust this based on how completed tasks are styled
      await expect(
        page.locator(`text=${task.title}`).locator("..").locator(".."),
      ).toHaveClass(/completed/);
    });

    test("should delete task with confirmation", async ({ page }) => {
      // Create a task first
      const task = createSimpleTask();
      await tasksPage.createTask(task);

      // Mock the delete API
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

      // Delete the task
      await tasksPage.deleteTask(task.title);

      // Task should be removed from the list
      await tasksPage.expectTaskNotInList(task.title);
    });

    test("should cancel task deletion", async ({ page }) => {
      // Create a task first
      const task = createSimpleTask();
      await tasksPage.createTask(task);

      // Find the task row and click the delete button
      const taskRow = page
        .locator(`text=${task.title}`)
        .locator("..")
        .locator("..");
      await taskRow.locator('[data-testid="delete-task"]').click();

      // Cancel deletion in modal/dialog
      await page.getByRole("button", { name: /cancel/i }).click();

      // Task should still be in the list
      await tasksPage.expectTaskInList(task.title);
    });
  });

  test.describe("Task Priority and Due Dates", () => {
    test("should display priority badges correctly", async () => {
      const highPriorityTask = createUrgentTask();
      await tasksPage.createTask(highPriorityTask);

      // Check if high priority badge is visible
      const taskRow = tasksPage.page
        .locator(`text=${highPriorityTask.title}`)
        .locator("..")
        .locator("..");
      await expect(taskRow.locator("text=High")).toBeVisible();
    });

    test("should highlight overdue tasks", async ({ page }) => {
      const overdueTask = createTestTask({
        title: "Overdue Task",
        dueDate: "2023-01-01", // Past date
      });

      await tasksPage.createTask(overdueTask);

      // Check if task is highlighted as overdue
      const taskRow = page
        .locator(`text=${overdueTask.title}`)
        .locator("..")
        .locator("..");
      await expect(taskRow).toHaveClass(/overdue|text-red/);
    });
  });

  test.describe("Responsive Design", () => {
    test("should work on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

      // Form and list should still be functional
      await tasksPage.clickAddTaskButton();
      await tasksPage.expectFormToBeVisible();

      const task = createSimpleTask();
      await tasksPage.fillTaskForm(task);
      await tasksPage.submitTaskForm();

      await tasksPage.expectTaskInList(task.title);
    });

    test("should work on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

      // Test form and list layout
      await tasksPage.clickAddTaskButton();
      await tasksPage.expectFormToBeVisible();

      // Both form and list should be visible side by side
      await expect(
        page.getByRole("heading", { name: /create new task/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /your tasks/i }),
      ).toBeVisible();
    });
  });

  test.describe("Task Editing", () => {
    test("should edit task details", async ({ page }) => {
      // Create a task first
      const task = createTestTask();
      await tasksPage.createTask(task);

      // Mock the update API
      await page.route("/api/tasks/*", (route) => {
        if (route.request().method() === "PUT") {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              task: {
                id: "1",
                title: "Updated Task Title",
                description: "Updated description",
                priority: "high",
                status: "todo",
                dueDate: "2024-12-31T23:59:00.000Z",
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

      // Click edit button for the task
      const taskRow = page
        .locator(`text=${task.title}`)
        .locator("..")
        .locator("..");
      await taskRow.getByRole("button", { name: /edit/i }).click();

      // Form should be visible with pre-filled data
      await tasksPage.expectFormToBeVisible();
      await expect(page.getByDisplayValue(task.title)).toBeVisible();

      // Update task details
      await page.getByLabel(/task title/i).fill("Updated Task Title");
      await page.getByLabel(/description/i).fill("Updated description");

      // Change priority to high
      await page.getByRole("combobox").click();
      await page.getByRole("option", { name: "high" }).click();

      // Update due date
      await page.getByLabel(/due date/i).fill("2024-12-31T23:59");

      // Submit the form
      await page.getByRole("button", { name: /update task/i }).click();

      // Form should be hidden after update
      await tasksPage.expectFormToBeHidden();

      // Updated task should be visible in the list
      await expect(page.getByText("Updated Task Title")).toBeVisible();
    });

    test("should cancel edit without saving changes", async ({ page }) => {
      // Create a task first
      const task = createSimpleTask();
      await tasksPage.createTask(task);

      // Click edit button for the task
      const taskRow = page
        .locator(`text=${task.title}`)
        .locator("..")
        .locator("..");
      await taskRow.getByRole("button", { name: /edit/i }).click();

      // Form should be visible with pre-filled data
      await tasksPage.expectFormToBeVisible();
      await expect(page.getByDisplayValue(task.title)).toBeVisible();

      // Make some changes
      await page.getByLabel(/task title/i).fill("Changed Title");

      // Cancel the edit
      await page.getByRole("button", { name: /cancel/i }).click();

      // Form should be hidden
      await tasksPage.expectFormToBeHidden();

      // Original task should still be visible (unchanged)
      await expect(page.getByText(task.title)).toBeVisible();
      await expect(page.getByText("Changed Title")).not.toBeVisible();
    });

    test("should validate required fields when editing", async ({ page }) => {
      // Create a task first
      const task = createTestTask();
      await tasksPage.createTask(task);

      // Click edit button for the task
      const taskRow = page
        .locator(`text=${task.title}`)
        .locator("..")
        .locator("..");
      await taskRow.getByRole("button", { name: /edit/i }).click();

      // Clear the title field
      await page.getByLabel(/task title/i).fill("");

      // Try to submit
      await page.getByRole("button", { name: /update task/i }).click();

      // Should show validation error
      await expect(page.getByText(/title is required/i)).toBeVisible();

      // Form should still be visible
      await tasksPage.expectFormToBeVisible();
    });

    test("should show loading state during update", async ({ page }) => {
      // Create a task first
      const task = createSimpleTask();
      await tasksPage.createTask(task);

      // Mock a slow update API
      await page.route("/api/tasks/*", (route) => {
        if (route.request().method() === "PUT") {
          // Delay the response
          setTimeout(() => {
            route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                task: {
                  id: "1",
                  title: "Updated Task",
                  status: "todo",
                  priority: "medium",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  userId: "user-123",
                },
                message: "Task updated",
              }),
            });
          }, 1000);
        } else {
          route.continue();
        }
      });

      // Click edit button
      const taskRow = page
        .locator(`text=${task.title}`)
        .locator("..")
        .locator("..");
      await taskRow.getByRole("button", { name: /edit/i }).click();

      // Make a change and submit
      await page.getByLabel(/task title/i).fill("Updated Task");
      await page.getByRole("button", { name: /update task/i }).click();

      // Should show loading state
      await expect(page.getByText(/updating.../i)).toBeVisible();

      // Wait for update to complete
      await expect(page.getByText(/updating.../i)).not.toBeVisible({
        timeout: 2000,
      });
    });

    test("should handle edit error gracefully", async ({ page }) => {
      // Create a task first
      const task = createSimpleTask();
      await tasksPage.createTask(task);

      // Mock API failure for update
      await page.route("/api/tasks/*", (route) => {
        if (route.request().method() === "PUT") {
          route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Server error" }),
          });
        } else {
          route.continue();
        }
      });

      // Click edit button
      const taskRow = page
        .locator(`text=${task.title}`)
        .locator("..")
        .locator("..");
      await taskRow.getByRole("button", { name: /edit/i }).click();

      // Make a change and submit
      await page.getByLabel(/task title/i).fill("Updated Task");
      await page.getByRole("button", { name: /update task/i }).click();

      // Should show error message
      await expect(page.getByText(/failed to update task/i)).toBeVisible();

      // Form should remain visible
      await tasksPage.expectFormToBeVisible();
    });

    test("should switch between create and edit modes", async ({ page }) => {
      // Create a task first
      const task = createSimpleTask();
      await tasksPage.createTask(task);

      // Click Add Task button to open create form
      await tasksPage.clickAddTaskButton();
      await tasksPage.expectFormToBeVisible();
      await expect(page.getByText(/create new task/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /create task/i }),
      ).toBeVisible();

      // Click edit button for existing task
      const taskRow = page
        .locator(`text=${task.title}`)
        .locator("..")
        .locator("..");
      await taskRow.getByRole("button", { name: /edit/i }).click();

      // Should switch to edit mode
      await expect(page.getByText(/edit task/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /update task/i }),
      ).toBeVisible();
      await expect(page.getByDisplayValue(task.title)).toBeVisible();

      // Cancel edit and click Add Task again
      await page.getByRole("button", { name: /cancel/i }).click();
      await tasksPage.clickAddTaskButton();

      // Should be back in create mode
      await expect(page.getByText(/create new task/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /create task/i }),
      ).toBeVisible();
    });
  });
});
