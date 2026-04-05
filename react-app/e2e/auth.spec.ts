import { test, expect } from '@playwright/test';

test.describe('Auth pages', () => {
  test('login page renders sign in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Sign in');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
  });

  test('register page renders sign up form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Sign up');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign up');
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Need an account?' })).toBeVisible();
  });

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('link', { name: 'Have an account?' })).toBeVisible();
  });

  test('protected editor route redirects to login', async ({ page }) => {
    await page.goto('/editor');
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected settings route redirects to login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});
