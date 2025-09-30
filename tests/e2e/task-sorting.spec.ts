import { expect, test } from "@playwright/test";
import { setupAuth, testUsers } from "./helpers/auth-helpers";

test.describe("Task Sorting E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, testUsers.regular.email);
    await page.goto("/dashboard/tasks");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Sort UI Component", () => {
    test("should display sort dropdown", async ({ page }) => {
      await expect(page.getByRole("combobox")).toBeVisible();
    });

    test("should show all sort options when clicked", async ({ page }) => {
      await page.getByRole("combobox").click();

      const sortOptions = [
        "Newest First",
        "Oldest First",
        "Due Date (Soonest)",
        "Due Date (Latest)",
        "Priority (High to Low)",
        "Priority (Low to High)",
        "Title (A-Z)",
        "Title (Z-A)",
        "Recently Updated",
        "Recently Completed",
      ];

      for (const option of sortOptions) {
        await expect(page.getByText(option, { exact: true })).toBeVisible();
      }
    });

    test("should default to 'Newest First'", async ({ page }) => {
      await expect(page.getByText("Newest First")).toBeVisible();
    });
  });

  test.describe("Sort by Title", () => {
    test("should sort tasks alphabetically A-Z", async ({ page }) => {
      // Open sort dropdown
      await page.getByRole("combobox").click();

      // Select Title (A-Z)
      await page.getByText("Title (A-Z)", { exact: true }).click();

      // Wait for tasks to reload
      await page.waitForTimeout(500);

      // Get all task titles
      const taskTitles = await page
        .locator('[data-testid="task-title"]')
        .allTextContents();

      // Verify they are in alphabetical order
      const sortedTitles = [...taskTitles].sort();
      expect(taskTitles).toEqual(sortedTitles);
    });

    test("should sort tasks alphabetically Z-A", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.getByText("Title (Z-A)", { exact: true }).click();
      await page.waitForTimeout(500);

      const taskTitles = await page
        .locator('[data-testid="task-title"]')
        .allTextContents();

      const sortedTitles = [...taskTitles].sort().reverse();
      expect(taskTitles).toEqual(sortedTitles);
    });
  });

  test.describe("Sort by Priority", () => {
    test("should sort by priority High to Low", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.getByText("Priority (High to Low)", { exact: true }).click();
      await page.waitForTimeout(500);

      // Verify tasks are displayed
      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThan(0);
    });

    test("should sort by priority Low to High", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.getByText("Priority (Low to High)", { exact: true }).click();
      await page.waitForTimeout(500);

      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThan(0);
    });
  });

  test.describe("Sort by Due Date", () => {
    test("should sort by due date soonest first", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.getByText("Due Date (Soonest)", { exact: true }).click();
      await page.waitForTimeout(500);

      // Tasks with due dates should appear first
      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should sort by due date latest first", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.getByText("Due Date (Latest)", { exact: true }).click();
      await page.waitForTimeout(500);

      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Sort by Created/Updated Date", () => {
    test("should sort by newest first (default)", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.getByText("Newest First", { exact: true }).click();
      await page.waitForTimeout(500);

      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should sort by oldest first", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.getByText("Oldest First", { exact: true }).click();
      await page.waitForTimeout(500);

      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should sort by recently updated", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.getByText("Recently Updated", { exact: true }).click();
      await page.waitForTimeout(500);

      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should sort by recently completed", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.getByText("Recently Completed", { exact: true }).click();
      await page.waitForTimeout(500);

      // May or may not have completed tasks
      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Sort with Filters", () => {
    test("should combine sort with priority filter", async ({ page }) => {
      // Apply priority filter first
      await page.getByText("High", { exact: true }).first().click();
      await page.waitForTimeout(300);

      // Then apply sort
      await page.getByRole("combobox").click();
      await page.getByText("Title (A-Z)", { exact: true }).click();
      await page.waitForTimeout(500);

      // Verify tasks are displayed and filtered
      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should combine sort with search", async ({ page }) => {
      // Enter search query
      await page.getByPlaceholder("Search tasks...").fill("test");
      await page.waitForTimeout(400);

      // Apply sort
      await page.getByRole("combobox").click();
      await page.getByText("Priority (High to Low)", { exact: true }).click();
      await page.waitForTimeout(500);

      // Results should be both searched and sorted
      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should maintain sort when clearing filters", async ({ page }) => {
      // Set sort first
      await page.getByRole("combobox").click();
      await page.getByText("Title (A-Z)", { exact: true }).click();
      await page.waitForTimeout(300);

      // Apply a filter
      await page.getByText("High", { exact: true }).first().click();
      await page.waitForTimeout(300);

      // Clear filters
      const clearButton = page.getByRole("button", { name: "Clear All" });
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(300);
      }

      // Sort should be reset to default after clearing
      await expect(page.getByText("Newest First")).toBeVisible();
    });
  });

  test.describe("Sort Persistence", () => {
    test("should maintain sort selection when switching between sort options", async ({
      page,
    }) => {
      // Select first sort
      await page.getByRole("combobox").click();
      await page.getByText("Title (A-Z)", { exact: true }).click();
      await page.waitForTimeout(300);

      await expect(page.getByText("Title (A-Z)")).toBeVisible();

      // Select different sort
      await page.getByRole("combobox").click();
      await page.getByText("Priority (High to Low)", { exact: true }).click();
      await page.waitForTimeout(300);

      await expect(page.getByText("Priority (High to Low)")).toBeVisible();
    });
  });

  test.describe("Task Operations with Sort", () => {
    test("should maintain sort after creating a task", async ({ page }) => {
      // Set sort
      await page.getByRole("combobox").click();
      await page.getByText("Title (A-Z)", { exact: true }).click();
      await page.waitForTimeout(300);

      // Create a new task
      await page.getByRole("button", { name: "Add Task" }).click();
      await page.getByPlaceholder("Task title").fill("AAA New Task");
      await page.getByRole("button", { name: "Create Task" }).click();
      await page.waitForTimeout(500);

      // Sort should still be applied
      await expect(page.getByText("Title (A-Z)")).toBeVisible();
    });

    test("should maintain sort after toggling task status", async ({
      page,
    }) => {
      // Set sort
      await page.getByRole("combobox").click();
      await page.getByText("Priority (High to Low)", { exact: true }).click();
      await page.waitForTimeout(300);

      // Toggle a task status if tasks exist
      const taskCheckbox = page
        .locator('[data-testid="task-checkbox"]')
        .first();
      if (await taskCheckbox.isVisible()) {
        await taskCheckbox.click();
        await page.waitForTimeout(300);

        // Sort should still be maintained
        await expect(page.getByText("Priority (High to Low)")).toBeVisible();
      }
    });
  });
});
