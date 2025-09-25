import { Page, expect } from '@playwright/test';

export class TasksPageHelper {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/tasks');
  }

  async waitForTasksToLoad() {
    // Wait for the tasks section to be visible
    await expect(this.page.getByRole('heading', { name: /your tasks/i })).toBeVisible();
  }

  async clickAddTaskButton() {
    await this.page.getByRole('button', { name: /add task/i }).click();
  }

  async clickCancelButton() {
    await this.page.getByRole('button', { name: /cancel/i }).click();
  }

  async expectFormToBeVisible() {
    await expect(this.page.getByRole('heading', { name: /create new task/i })).toBeVisible();
  }

  async expectFormToBeHidden() {
    await expect(this.page.getByRole('heading', { name: /create new task/i })).not.toBeVisible();
  }

  async fillTaskForm({
    title,
    description,
    priority = 'medium',
    dueDate,
  }: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  }) {
    await this.page.getByLabel(/task title/i).fill(title);

    if (description) {
      await this.page.getByLabel(/description/i).fill(description);
    }

    if (priority !== 'medium') {
      await this.page.getByRole('combobox').click();
      await this.page.getByRole('option', { name: priority }).click();
    }

    if (dueDate) {
      await this.page.getByLabel(/due date/i).fill(dueDate);
    }
  }

  async submitTaskForm() {
    await this.page.getByRole('button', { name: /create task/i }).click();
  }

  async createTask(taskData: Parameters<typeof TasksPageHelper.prototype.fillTaskForm>[0]) {
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
    const taskRow = this.page.locator(`text=${taskTitle}`).locator('..').locator('..');
    await taskRow.locator('[data-testid="status-toggle"]').click();
  }

  async deleteTask(taskTitle: string) {
    // Find the task row and click the delete button
    const taskRow = this.page.locator(`text=${taskTitle}`).locator('..').locator('..');
    await taskRow.locator('[data-testid="delete-task"]').click();

    // Confirm deletion in modal/dialog
    await this.page.getByRole('button', { name: /delete/i }).click();
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
    await this.page.getByRole('button', { name: /retry/i }).click();
  }
}

export class AuthHelper {
  constructor(private page: Page) {}

  async login(email = 'test@example.com', password = 'password123') {
    await this.page.goto('/auth/signin');
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard');
  }

  async logout() {
    await this.page.getByRole('button', { name: /sign out/i }).click();
    await this.page.waitForURL('/');
  }
}

// Test data factories
export const createTestTask = (overrides = {}) => ({
  title: 'Test Task',
  description: 'Test task description',
  priority: 'medium' as const,
  dueDate: '2024-12-31',
  ...overrides,
});

export const createUrgentTask = () => createTestTask({
  title: 'Urgent Task',
  priority: 'high',
  dueDate: '2024-01-15',
});

export const createSimpleTask = () => createTestTask({
  title: 'Simple Task',
  description: undefined,
  dueDate: undefined,
});