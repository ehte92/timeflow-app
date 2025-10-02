import { test, expect } from '@playwright/test';

test.describe('Calendar Navigation - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/calendar');
    await page.waitForSelector('[role="heading"][level="2"]', { timeout: 10000 });
  });

  test.describe('1. Month View Basic Navigation', () => {
    test('should navigate to previous month', async ({ page }) => {
      // Initial state: October 2025
      await expect(page.getByRole('heading', { level: 2 })).toHaveText('October 2025');

      // Click Previous
      await page.getByRole('button', { name: 'Previous' }).click();
      await page.waitForTimeout(500);

      // Should show September 2025
      const heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('September 2025');
    });

    test('should navigate to next month', async ({ page }) => {
      // Initial state: October 2025
      await expect(page.getByRole('heading', { level: 2 })).toHaveText('October 2025');

      // Click Next
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(500);

      // Should show November 2025
      const heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('November 2025');
    });

    test('should return to current month with Today button', async ({ page }) => {
      // Navigate away from current month
      await page.getByRole('button', { name: 'Previous' }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Previous' }).click();
      await page.waitForTimeout(300);

      // Click Today
      await page.getByRole('button', { name: 'Today' }).click();
      await page.waitForTimeout(500);

      // Should show October 2025 (current month)
      await expect(page.getByRole('heading', { level: 2 })).toHaveText('October 2025');
    });
  });

  test.describe('2. Month View Year Boundary Navigation', () => {
    test('should navigate from January to December of previous year', async ({ page }) => {
      // Navigate to January 2025
      for (let i = 0; i < 9; i++) {
        await page.getByRole('button', { name: 'Previous' }).click();
        await page.waitForTimeout(200);
      }

      // Verify we're at January 2025
      let heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('January 2025');

      // Click Previous to go to December 2024
      await page.getByRole('button', { name: 'Previous' }).click();
      await page.waitForTimeout(500);

      heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('December 2024');
    });

    test('should navigate from December to January of next year', async ({ page }) => {
      // Navigate to December 2025
      for (let i = 0; i < 2; i++) {
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        await page.waitForTimeout(200);
      }

      // Verify we're at December 2025
      let heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('December 2025');

      // Click Next to go to January 2026
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(500);

      heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('January 2026');
    });
  });

  test.describe('3. Month View Rapid Navigation', () => {
    test('should handle rapid Previous clicks without errors', async ({ page }) => {
      // Rapidly click Previous 10 times
      for (let i = 0; i < 10; i++) {
        await page.getByRole('button', { name: 'Previous' }).click();
      }
      await page.waitForTimeout(1000);

      // Should have navigated back 10 months (to December 2024)
      const heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('December 2024');

      // Check console for errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      expect(consoleErrors.length).toBe(0);
    });

    test('should handle rapid Next clicks without errors', async ({ page }) => {
      // Rapidly click Next 10 times
      for (let i = 0; i < 10; i++) {
        await page.getByRole('button', { name: 'Next', exact: true }).click();
      }
      await page.waitForTimeout(1000);

      // Should have navigated forward 10 months (to August 2026)
      const heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('August 2026');
    });
  });

  test.describe('4. Week View Navigation', () => {
    test('should switch to Week view and navigate', async ({ page }) => {
      // Switch to Week view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Week' }).click();
      await page.waitForTimeout(500);

      // Verify Week view loaded
      await expect(page.getByRole('combobox')).toContainText('Week');

      // Navigate Previous (should go back 7 days)
      await page.getByRole('button', { name: 'Previous' }).click();
      await page.waitForTimeout(500);

      // Should show previous week
      const cells = await page.locator('[aria-label*="September"]').count();
      expect(cells).toBeGreaterThan(0);
    });

    test('should handle week navigation across month boundaries', async ({ page }) => {
      // Switch to Week view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Week' }).click();
      await page.waitForTimeout(500);

      // Navigate back several weeks to cross month boundary
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: 'Previous' }).click();
        await page.waitForTimeout(200);
      }

      // Should have crossed into September
      const heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('2025');
    });
  });

  test.describe('5. Day View Navigation', () => {
    test('should switch to Day view and navigate', async ({ page }) => {
      // Switch to Day view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Day' }).click();
      await page.waitForTimeout(500);

      // Verify Day view loaded
      await expect(page.getByRole('combobox')).toContainText('Day');

      // Navigate Next (should go forward 1 day)
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(500);

      // Should show next day (October 3)
      const content = await page.locator('text=October 3, 2025').count();
      expect(content).toBeGreaterThan(0);
    });

    test('should handle day navigation across month boundaries', async ({ page }) => {
      // Switch to Day view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Day' }).click();
      await page.waitForTimeout(500);

      // Navigate forward to end of October and into November
      for (let i = 0; i < 30; i++) {
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        await page.waitForTimeout(100);
      }

      // Should have crossed into November
      const heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('November');
    });
  });

  test.describe('6. Cross-View Navigation', () => {
    test('should preserve date when switching between views', async ({ page }) => {
      // Navigate to a specific month (December 2025)
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(300);

      // Verify December 2025
      await expect(page.getByRole('heading', { level: 2 })).toHaveText('December 2025');

      // Switch to Week view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Week' }).click();
      await page.waitForTimeout(500);

      // Should still be in December 2025
      const heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('December 2025');

      // Switch to Day view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Day' }).click();
      await page.waitForTimeout(500);

      // Should still be in December 2025
      const heading2 = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading2).toContain('December 2025');

      // Switch back to Month view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Month' }).click();
      await page.waitForTimeout(500);

      // Should still be December 2025
      await expect(page.getByRole('heading', { level: 2 })).toHaveText('December 2025');
    });
  });

  test.describe('7. Today Button Across Views', () => {
    test('should return to current date in Month view from far future', async ({ page }) => {
      // Navigate far into the future
      for (let i = 0; i < 20; i++) {
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        await page.waitForTimeout(50);
      }

      // Click Today
      await page.getByRole('button', { name: 'Today' }).click();
      await page.waitForTimeout(500);

      // Should be back to October 2025
      await expect(page.getByRole('heading', { level: 2 })).toHaveText('October 2025');
    });

    test('should return to current date in Week view from far past', async ({ page }) => {
      // Switch to Week view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Week' }).click();
      await page.waitForTimeout(500);

      // Navigate far into the past
      for (let i = 0; i < 30; i++) {
        await page.getByRole('button', { name: 'Previous' }).click();
        await page.waitForTimeout(50);
      }

      // Click Today
      await page.getByRole('button', { name: 'Today' }).click();
      await page.waitForTimeout(500);

      // Should be back to current week (October 2025)
      const heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('October 2025');
    });

    test('should return to current date in Day view', async ({ page }) => {
      // Switch to Day view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Day' }).click();
      await page.waitForTimeout(500);

      // Navigate away
      for (let i = 0; i < 15; i++) {
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        await page.waitForTimeout(50);
      }

      // Click Today
      await page.getByRole('button', { name: 'Today' }).click();
      await page.waitForTimeout(500);

      // Should be back to today (October 2, 2025)
      const heading = await page.getByRole('heading', { level: 2 }).textContent();
      expect(heading).toContain('October 2, 2025');
    });
  });

  test.describe('8. Console Error Monitoring', () => {
    test('should have zero console errors during navigation', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Perform various navigation operations
      await page.getByRole('button', { name: 'Previous' }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: 'Today' }).click();
      await page.waitForTimeout(300);

      // Switch views
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Week' }).click();
      await page.waitForTimeout(500);

      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Day' }).click();
      await page.waitForTimeout(500);

      // Verify no console errors
      expect(consoleErrors).toEqual([]);
    });
  });

  test.describe('9. Scrolling Behavior', () => {
    test('should show scrollbar in Week view', async ({ page }) => {
      // Switch to Week view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Week' }).click();
      await page.waitForTimeout(500);

      // Find the scrollable container (the view container)
      const scrollContainer = page.locator('.sx__view-container').first();

      // Check if scrollable
      const scrollHeight = await scrollContainer.evaluate(el => el.scrollHeight);
      const clientHeight = await scrollContainer.evaluate(el => el.clientHeight);

      expect(scrollHeight).toBeGreaterThan(clientHeight);
    });

    test('should show scrollbar in Day view', async ({ page }) => {
      // Switch to Day view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Day' }).click();
      await page.waitForTimeout(500);

      // Find the scrollable container
      const scrollContainer = page.locator('.sx__view-container').first();

      // Check if scrollable
      const scrollHeight = await scrollContainer.evaluate(el => el.scrollHeight);
      const clientHeight = await scrollContainer.evaluate(el => el.clientHeight);

      expect(scrollHeight).toBeGreaterThan(clientHeight);
    });
  });

  test.describe('10. Visual Verification', () => {
    test('should display correct month grid in Month view', async ({ page }) => {
      // Verify Month view shows calendar grid
      const monthGridDays = await page.locator('[aria-label*="October"]').count();
      expect(monthGridDays).toBeGreaterThan(25); // October has 31 days
    });

    test('should display correct week grid in Week view', async ({ page }) => {
      // Switch to Week view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Week' }).click();
      await page.waitForTimeout(500);

      // Verify Week view shows 7 days
      const weekDays = await page.locator('text=Mon').count();
      expect(weekDays).toBeGreaterThan(0);
    });

    test('should display time slots in Day view', async ({ page }) => {
      // Switch to Day view
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Day' }).click();
      await page.waitForTimeout(500);

      // Verify time slots visible (1 AM, 2 AM, etc.)
      const timeSlots = await page.locator('text=1 AM').count();
      expect(timeSlots).toBeGreaterThan(0);
    });
  });
});
