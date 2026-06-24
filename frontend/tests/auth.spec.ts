import { test, expect } from '@playwright/test';

test('has title and login form', async ({ page }) => {
  await page.goto('/login');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/JustChillin/i);

  // Expect login button to be visible
  const loginButton = page.getByRole('button', { name: /Login/i });
  await expect(loginButton).toBeVisible();
});
