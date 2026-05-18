import { expect, test } from '@playwright/test';
import { openNav } from './helpers';

const liveAgent = {
  name: process.env.LIVE_AGENT_NAME ?? 'Live Smoke Agent',
  email: process.env.LIVE_AGENT_EMAIL ?? '',
  password: process.env.LIVE_AGENT_PASSWORD ?? '',
};

test.describe.serial('live release smoke', () => {
  test('registers a live agent and verifies the stabilized UI paths', async ({ page }) => {
    test.skip(!liveAgent.email || !liveAgent.password, 'Live agent credentials were not provided.');

    const suffix = Date.now().toString().slice(-6);
    const channelTypeName = `Live Type ${suffix}`;
    const serviceChannelName = `Live Service ${suffix}`;
    const accountName = `Live Account ${suffix}`;

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /login with email and password/i })).toBeVisible();
    await page.getByRole('button', { name: /register new mobi agent/i }).click();
    await expect(page.getByRole('heading', { name: /create mobi agent account/i })).toBeVisible();
    await page.getByLabel('Name').fill(liveAgent.name);
    await page.getByLabel('Email').fill(liveAgent.email);
    await page.getByLabel('Password').fill(liveAgent.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: 'Mobi Dashboard' })).toBeVisible();

    await expect(page.getByRole('button', { name: /wallets/i })).toHaveCount(0);
    await expect(page.getByText(/legacy linked records/i)).toHaveCount(0);
    await expect(page.getByText(/compatibility mirror/i)).toHaveCount(0);

    await openNav(page, 'Channel Management');
    await page.getByRole('button', { name: /add channel type/i }).click();
    await page.getByLabel('Type Name').fill(channelTypeName);
    await page.getByLabel('Description').fill('Live smoke channel type');
    await page.getByRole('button', { name: /create type/i }).click();
    await expect(page.getByText(channelTypeName).first()).toBeVisible();

    await page.getByRole('button', { name: /service channels/i }).click();
    await page.getByRole('button', { name: /add service channel/i }).click();
    await page.getByLabel('Channel Type').selectOption({ label: channelTypeName });
    await page.getByLabel('Channel Name').fill(serviceChannelName);
    await page.locator('.modalShade form').getByLabel('Country').fill('Uganda');
    await page.getByRole('button', { name: /create channel/i }).click();
    await expect(page.getByText(serviceChannelName).first()).toBeVisible();

    await openNav(page, 'Mobi Account Setting');
    await page.getByRole('button', { name: /add account/i }).click();
    await page.getByLabel('Service Channel').selectOption({ label: `${serviceChannelName} (${channelTypeName})` });
    await page.getByLabel('Account Name').fill(accountName);
    await page.getByLabel('Agent ID').fill(`LIVE-${suffix}`);
    await page.getByLabel('Account Number').fill(`+256710${suffix}`);
    await page.getByLabel('Currency').selectOption('UGX');
    await page.getByLabel('Balance').fill('250000');
    await page.getByLabel('Remarks').fill('Live smoke test account');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(accountName).first()).toBeVisible();

    await openNav(page, 'Transactions Desk');
    await expect(page.getByText(/transaction preview/i)).toHaveCount(0);
    const deskAccountSelect = page.getByLabel('Account');
    const accountOption = (await deskAccountSelect.locator('option').allTextContents()).find((text) => text.includes(accountName));
    if (accountOption) {
      await deskAccountSelect.selectOption({ label: accountOption });
    }
    await page.getByLabel('Transaction Type').selectOption('FLOAT_TOP_UP');
    await page.getByLabel(/Amount/i).fill('50000');
    await page.getByLabel('Transaction ID').fill(`TXN-LIVE-${suffix}`);
    await page.getByLabel('Client ID').fill(`Live Client ${suffix}`);
    await page.getByLabel('Phone Number').fill(`+256701${suffix}`);
    await page.getByRole('button', { name: /^confirm$/i }).click();
    await expect(page.locator('.modalShade')).toHaveCount(1);
    await expect(page.getByText(/confirm transaction entry/i)).toBeVisible();
    await expect(page.getByText(`TXN-LIVE-${suffix}`)).toBeVisible();
    await page.locator('.modalShade').getByRole('button', { name: /^cancel$/i }).first().click();
    await expect(page.locator('.modalShade')).toHaveCount(0);

    await openNav(page, 'Mobi Transactions');
    await page.getByRole('button', { name: /record transaction/i }).click();
    await expect(page.locator('.modalShade')).toHaveCount(1);
    const generatedTransactionId = await page.getByLabel('Transaction ID').inputValue();
    await expect(generatedTransactionId).toMatch(/^TXN-\d{8}-\d{6}-\d{3}-[A-Z0-9]{2}$/);
    const modalAccountSelect = page.getByLabel('Account');
    const modalAccountOption = (await modalAccountSelect.locator('option').allTextContents()).find((text) => text.includes(accountName));
    if (modalAccountOption) {
      await modalAccountSelect.selectOption({ label: modalAccountOption });
    }
    await page.getByLabel('Phone Number').fill(`+256702${suffix}`);
    await page.getByLabel('Transaction Type').selectOption('FLOAT_TOP_UP');
    await page.getByLabel(/Amount/i).fill('12000');
    await page.getByLabel('Client ID').fill(`History Client ${suffix}`);
    await page.getByRole('button', { name: /^confirm$/i }).click();
    await expect(page.locator('.modalShade')).toHaveCount(1);
    await expect(page.getByText(/confirm transaction entry/i)).toBeVisible();
    await expect(page.getByLabel('Phone Number')).toHaveCount(0);
    await expect(page.getByText(generatedTransactionId)).toBeVisible();
    await page.locator('.modalShade').getByRole('button', { name: /^cancel$/i }).first().click();
    await expect(page.locator('.modalShade')).toHaveCount(1);
    await expect(page.getByLabel('Phone Number')).toHaveValue(`+256702${suffix}`);
    await expect(page.getByLabel('Transaction ID')).toHaveValue(generatedTransactionId);
  });
});
