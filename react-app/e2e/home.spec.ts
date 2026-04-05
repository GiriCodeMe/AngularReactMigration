import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('renders the conduit banner', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.banner h1')).toContainText('conduit');
  });

  test('shows the Global Feed tab', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Global Feed')).toBeVisible();
  });

  test('shows the popular tags sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar .tag-list')).toBeVisible();
  });

  test('loads and displays articles', async ({ page }) => {
    await page.goto('/');
    // Wait for article previews to appear (API call completes)
    await expect(page.locator('.article-preview').first()).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to article on click', async ({ page }) => {
    await page.goto('/');
    await page.locator('.article-preview').first().waitFor({ timeout: 10_000 });
    const firstLink = page.locator('.article-preview .preview-link').first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/article\//);
  });
});
