import { expect, test } from '@playwright/test';
import { loginAdmin, loginFromRole, logout, promotedAdmin } from './helpers';

test.describe.serial('admin workflows', () => {
  test('exercises api docs, shops, user promotion, and admin access control', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /register new mobi agent/i }).click();
    await page.getByLabel('Name').fill(promotedAdmin.name);
    await page.getByLabel('Email').fill(promotedAdmin.email);
    await page.getByLabel('Password').fill(promotedAdmin.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await logout(page);

    await loginAdmin(page);

    await page.getByRole('button', { name: /api documentation/i }).click();
    await page.getByRole('button', { name: /add api/i }).click();
    await page.getByLabel('Name').fill('QA Admin API');
    await page.getByLabel('Endpoint').fill('/api/qa-admin');
    await page.getByLabel('Status').selectOption('ACTIVE');
    await page.getByLabel('Description').fill('Admin-created API connection');
    await page.getByRole('button', { name: /create api/i }).click();
    await expect(page.getByText('QA Admin API')).toBeVisible();

    await page.getByRole('button', { name: /mobi agent shop/i }).click();
    await page.getByRole('button', { name: /add agent shop/i }).click();
    await page.getByLabel('Business Name').fill('QA Shop');
    await page.getByLabel('Country').selectOption('Uganda');
    await page.getByLabel('Location').fill('Kampala');
    await page.getByLabel('Agent ID').fill('AGT-QA-SHOP');
    await page.getByLabel('Remarks').fill('Shop added by E2E');
    await page.getByRole('button', { name: /create shop/i }).click();
    await expect(page.getByText('QA Shop')).toBeVisible();

    await page.locator('tr', { hasText: 'QA Shop' }).locator('.actionRow .iconButton').nth(2).click();
    await page.getByLabel('User').selectOption({ label: 'Mobi Agent' });
    await page.getByLabel('Job Title').fill('Cashier');
    await page.getByLabel('Phone').fill('+256701111111');
    await page.getByRole('button', { name: /^Assign Worker$/i }).click();
    await expect(page.locator('.modalShade')).toHaveCount(0);

    await page.getByRole('button', { name: /user management/i }).click();
    await page.getByPlaceholder('Search users...').fill(promotedAdmin.email);
    await expect(page.getByText(promotedAdmin.email)).toBeVisible();
    await page.getByRole('button', { name: /edit user role/i }).click();
    await page.getByRole('button', { name: 'ADMIN' }).click();
    await page.getByRole('button', { name: /save role/i }).click();

    await logout(page);
    await loginFromRole(page, 'Admin', promotedAdmin.email, promotedAdmin.password);
    await expect(page.getByRole('button', { name: /user management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /api documentation/i })).toBeVisible();
  });

  test('agent cannot see admin-only navigation', async ({ page }) => {
    await loginFromRole(page, 'Mobi Agent', 'agent@mobi.local', 'agent123');
    await expect(page.getByRole('button', { name: /user management/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /api documentation/i })).toBeVisible();
  });
});

