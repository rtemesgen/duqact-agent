import { expect, Page } from '@playwright/test';

export const seededAdmin = { email: 'admin@mobi.local', password: 'admin123' };
export const seededAgent = { email: 'agent@mobi.local', password: 'agent123' };
export const promotedAdmin = { name: 'Boss Check Admin', email: 'bosscheck.admin@example.com', password: 'BossCheck123' };

export async function loginFromRole(page: Page, role: 'Admin' | 'Mobi Agent', email?: string, password?: string) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /login with email and password/i })).toBeVisible();
  const fallbackEmail = role === 'Admin' ? seededAdmin.email : seededAgent.email;
  const fallbackPassword = role === 'Admin' ? seededAdmin.password : seededAgent.password;
  await page.getByLabel('Email').fill(email ?? fallbackEmail);
  await page.getByLabel('Password').fill(password ?? fallbackPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
}

async function loginSucceeded(page: Page, timeout = 5000) {
  try {
    await expect(page.getByRole('heading', { name: 'Mobi Dashboard' })).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

export async function loginAgent(page: Page) {
  await loginFromRole(page, 'Mobi Agent', seededAgent.email, seededAgent.password);
  if (!await loginSucceeded(page, 5000)) {
    await loginFromRole(page, 'Mobi Agent', seededAgent.email, 'agent1234');
  }
  await expect(page.getByRole('heading', { name: 'Mobi Dashboard' })).toBeVisible();
}

export async function loginAdmin(page: Page) {
  await loginFromRole(page, 'Admin', seededAdmin.email, seededAdmin.password);
  await expect(page.getByRole('heading', { name: 'Mobi Dashboard' })).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page.getByRole('heading', { name: /login with email and password/i })).toBeVisible();
}

export async function openNav(page: Page, label: string) {
  await page.getByRole('button', { name: new RegExp(label, 'i') }).click();
  await expect(page.getByRole('heading', { name: new RegExp(label.replace(/\s+/g, '\\s+'), 'i') })).toBeVisible();
}

export async function expectNotice(page: Page, text: RegExp | string) {
  await expect(page.locator('.noticeBanner')).toContainText(text);
}

export async function ensureNoLoadingError(page: Page) {
  await expect(page.locator('.errorBanner')).toHaveCount(0);
}
