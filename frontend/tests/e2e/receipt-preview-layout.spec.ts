import { expect, test } from '@playwright/test';
import { loginAgent, openNav } from './helpers';

test.describe.serial('receipt preview layout', () => {
  test('shows ordered form-style rows and inline balance toggle on both receipt flows', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const channelTypeName = `Receipt Type ${suffix}`;
    const serviceChannelName = `Receipt Service ${suffix}`;
    const accountName = `Receipt Account ${suffix}`;
    const deskPhone = `+256711${suffix}`;
    const walletPhone = `+256712${suffix}`;
    const deskTransactionId = `TXN-RECEIPT-${suffix}`;

    await loginAgent(page);

    await openNav(page, 'Channel Management');
    await page.getByRole('button', { name: /add channel type/i }).click();
    await page.getByLabel('Type Name').fill(channelTypeName);
    await page.getByLabel('Description').fill('Receipt preview layout test type');
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
    await page.getByLabel('Remarks').fill('Receipt preview layout test account');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(accountName).first()).toBeVisible();

    await openNav(page, 'Transactions Desk');
    await page.getByLabel('Account').selectOption((await page.getByLabel('Account').locator('option').allTextContents()).find((text) => text.includes(accountName)) ?? { index: 0 });
    await page.getByLabel('Phone Number').fill(deskPhone);
    await page.getByLabel('Transaction Type').selectOption('FLOAT_TOP_UP');
    await page.getByLabel(/Amount/i).fill('50000');
    await page.getByLabel('Transaction ID').fill(deskTransactionId);
    await page.getByLabel('Client ID').fill(`Desk Client ${suffix}`);
    await page.getByRole('button', { name: /^confirm$/i }).click();

    const deskReceipt = page.locator('.modalShade .receiptCard');
    await expect(deskReceipt).toBeVisible();
    await expect(page.getByRole('button', { name: /view balances/i })).toHaveCount(0);
    await expect(deskReceipt.locator('.receiptRowLabel')).toHaveText([
      'Phone Number',
      'Account',
      'Transaction Type',
      'Transaction ID',
      'Amount',
      'Client ID',
      'E-cash After',
      'Cash at Hand After',
    ]);
    await expect(deskReceipt.locator('.receiptSectionHeader')).toContainText('Balance Information');
    await deskReceipt.getByRole('button', { name: /^hide$/i }).click();
    await expect(deskReceipt.locator('.receiptBalanceRows')).toHaveCount(0);
    await deskReceipt.getByRole('button', { name: /^show$/i }).click();
    await expect(deskReceipt.locator('.receiptBalanceRows')).toHaveCount(1);
    await expect(deskReceipt).toContainText(deskPhone);
    await expect(deskReceipt).toContainText(deskTransactionId);
    await page.locator('.modalShade').getByRole('button', { name: /^cancel$/i }).first().click();
    await expect(page.locator('.modalShade')).toHaveCount(0);

    await openNav(page, 'Mobi Transactions');
    await page.getByRole('button', { name: /record transaction/i }).click();
    await page.getByLabel('Account').selectOption((await page.getByLabel('Account').locator('option').allTextContents()).find((text) => text.includes(accountName)) ?? { index: 0 });
    await page.getByLabel('Phone Number').fill(walletPhone);
    await page.getByLabel('Transaction Type').selectOption('DEPOSIT');
    await page.getByLabel(/Amount/i).fill('12000');
    await page.getByLabel('Client ID').fill(`History Client ${suffix}`);
    await page.getByRole('button', { name: /^confirm$/i }).click();

    const walletReceipt = page.locator('.modalShade .receiptCard');
    await expect(walletReceipt).toBeVisible();
    await expect(page.getByRole('button', { name: /view balances/i })).toHaveCount(0);
    await expect(walletReceipt.locator('.receiptRowLabel')).toHaveText([
      'Phone Number',
      'Account',
      'Transaction Type',
      'Transaction ID',
      'Amount',
      'Client ID',
      'E-cash After',
      'Cash at Hand After',
    ]);
    await walletReceipt.getByRole('button', { name: /^hide$/i }).click();
    await expect(walletReceipt.locator('.receiptBalanceRows')).toHaveCount(0);
    await walletReceipt.getByRole('button', { name: /^show$/i }).click();
    await expect(walletReceipt.locator('.receiptBalanceRows')).toHaveCount(1);
    await expect(walletReceipt).toContainText(walletPhone);
    await expect(walletReceipt).toContainText(/balance information/i);
  });
});
