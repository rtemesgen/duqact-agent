import { expect, test } from '@playwright/test';
import { loginAdmin, loginAgent, logout, seededAgent } from './helpers';

const registeredAgent = {
  name: 'Auth Flow Agent',
  email: 'authflow.agent@example.com',
  password: 'AuthFlow123',
};

test.describe('auth and theme', () => {
  test('supports login, registration, logout, invalid login, and theme persistence', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Select access type' })).toBeVisible();

    await page.getByRole('button', { name: /register new mobi agent/i }).click();
    await expect(page.getByRole('heading', { name: /create mobi agent account/i })).toBeVisible();
    await page.getByLabel('Name').fill(registeredAgent.name);
    await page.getByLabel('Email').fill(registeredAgent.email);
    await page.getByLabel('Password').fill(registeredAgent.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: 'Mobi Dashboard' })).toBeVisible();

    await logout(page);

    await page.locator('.authRoleCard').filter({ hasText: 'Mobi Agent' }).first().click();
    await page.getByLabel('Email').fill(seededAgent.email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/login failed/i)).toBeVisible();

    await page.getByLabel('Password').fill(seededAgent.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: 'Mobi Dashboard' })).toBeVisible();

    const themeButton = page.getByRole('button', { name: /toggle theme/i });
    const beforeTheme = await page.locator('html').getAttribute('data-theme');
    await themeButton.click();
    await page.waitForTimeout(500);
    const afterTheme = await page.locator('html').getAttribute('data-theme');
    expect(afterTheme).not.toBe(beforeTheme);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', afterTheme!);
  });

  test('seeded admin can still login after registration flow', async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByText(/Admin/i).first()).toBeVisible();
  });

  test('seeded agent can still login after registration flow', async ({ page }) => {
    await loginAgent(page);
    await expect(page.getByText(/Shop Owner|Mobi Agent/i).first()).toBeVisible();
  });
});
