import { expect, test } from '@playwright/test';
import { loginAgent, openNav } from './helpers';

test.describe.serial('release stabilization', () => {
  test('verifies stabilized transaction flows and retired wallet UI', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const channelTypeName = `QA Type ${suffix}`;
    const serviceChannelName = `QA Service ${suffix}`;
    const accountName = `QA Account ${suffix}`;

    await loginAgent(page);

    await expect(page.getByRole('button', { name: /wallets/i })).toHaveCount(0);
    await expect(page.getByText(/legacy linked records/i)).toHaveCount(0);
    await expect(page.getByText(/compatibility mirror/i)).toHaveCount(0);

    await openNav(page, 'Channel Management');
    await page.getByRole('button', { name: /add channel type/i }).click();
    await page.getByLabel('Type Name').fill(channelTypeName);
    await page.getByLabel('Description').fill('Release stabilization test type');
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
    await page.getByLabel('Agent ID').fill(`AGT-${suffix}`);
    await page.getByLabel('Account Number').fill(`+256700${suffix}`);
    await page.getByLabel('Currency').selectOption('UGX');
    await page.getByLabel('Balance').fill('250000');
    await page.getByLabel('Remarks').fill('Release stabilization test account');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(accountName).first()).toBeVisible();

    await openNav(page, 'Transactions Desk');
    await expect(page.getByText(/transaction preview/i)).toHaveCount(0);
    await page.getByLabel('Account').selectOption((await page.getByLabel('Account').locator('option').allTextContents()).find((text) => text.includes(accountName)) ?? { index: 0 });
    await page.getByLabel('Transaction Type').selectOption('FLOAT_TOP_UP');
    await page.getByLabel(/Amount/i).fill('50000');
    await page.getByLabel('Transaction ID').fill(`TXN-MANUAL-${suffix}`);
    await page.getByLabel('Client ID').fill(`Desk Client ${suffix}`);
    await page.getByLabel('Phone Number').fill(`+256701${suffix}`);
    await page.getByRole('button', { name: /^confirm$/i }).click();
    await expect(page.locator('.modalShade')).toHaveCount(1);
    await expect(page.getByText(/confirm transaction entry/i)).toBeVisible();
    await expect(page.getByText(`TXN-MANUAL-${suffix}`)).toBeVisible();
    await page.locator('.modalShade').getByRole('button', { name: /^cancel$/i }).first().click();
    await expect(page.locator('.modalShade')).toHaveCount(0);

    await openNav(page, 'Mobi Transactions');
    await page.getByRole('button', { name: /record transaction/i }).click();
    await expect(page.locator('.modalShade')).toHaveCount(1);
    const generatedTransactionId = await page.getByLabel('Transaction ID').inputValue();
    await expect(generatedTransactionId).toMatch(/^TXN-\d{8}-\d{6}-\d{3}-[A-Z0-9]{2}$/);
    await page.getByLabel('Phone Number').fill(`+256702${suffix}`);
    await page.getByLabel('Transaction Type').selectOption('DEPOSIT');
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
