import { expect, test } from '@playwright/test';
import { loginAgent, openNav, expectNotice, ensureNoLoadingError } from './helpers';

test.describe.serial('agent workflows', () => {
  test('creates accounts, wallets, transactions, profiles, settings, and exchange-rate data', async ({ page }) => {
    await loginAgent(page);

    await openNav(page, 'Mobi Account Setting');
    await page.getByRole('button', { name: /add account/i }).click();
    await page.getByLabel('Account Name').fill('QA Account 1');
    await page.locator('.modalShade form').getByLabel('Country').fill('Uganda');
    await page.getByLabel('Agent ID').fill('AGT-QA-001');
    await page.getByLabel('Channel Name').fill('MTN Mobile Money');
    await page.getByLabel('Account Number').fill('+256700100001');
    await page.getByLabel('Channel Type').fill('MNO');
    await page.getByLabel('Currency').selectOption('UGX');
    await page.getByLabel('Opening Balance').fill('250000');
    await page.getByLabel('Remarks').fill('Created by E2E');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('QA Account 1')).toBeVisible();
    await page.reload();
    await openNav(page, 'Mobi Account Setting');
    await expect(page.getByText('QA Account 1')).toBeVisible();

    await openNav(page, 'Wallets');
    await page.getByRole('button', { name: /new wallet/i }).click();
    await page.getByLabel('Wallet Name').fill('QA Wallet 1');
    await page.getByLabel('Network').fill('MTN');
    await page.getByLabel('Balance').fill('400000');
    await page.getByRole('button', { name: /create wallet/i }).click();
    await expect(page.getByText('QA Wallet 1')).toBeVisible();
    await page.reload();
    await openNav(page, 'Wallets');
    await expect(page.getByText('QA Wallet 1')).toBeVisible();

    await openNav(page, 'Transactions Desk');
    await page.getByRole('button', { name: /qa account 1/i }).click();
    await page.getByLabel(/transaction type/i).selectOption('FLOAT_TOP_UP');
    await page.getByLabel(/amount/i).fill('50000');
    await page.getByLabel('Client Name').fill('Desk Client');
    await page.getByLabel('Client Phone').fill('+256700123123');
    await page.getByRole('button', { name: /record transaction/i }).click();
    await expectNotice(page, /transaction recorded/i);

    await openNav(page, 'Mobi Transactions');
    await expect(page.getByText('+256700123123')).toBeVisible();
    await page.getByRole('button', { name: /record transaction/i }).click();
    await page.getByLabel('Phone Number').fill('+256700200200');
    await page.getByLabel('Transaction Type').selectOption('DEPOSIT');
    await page.getByLabel('Amount').fill('12000');
    await page.getByLabel('Client Name').fill('History Client');
    await page.locator('.modalShade form').getByRole('button', { name: /^Record Transaction$/i }).click();
    await expect(page.getByText('+256700200200')).toBeVisible();
    await page.getByRole('button', { name: /view transaction/i }).first().click();
    await expect(page.getByText(/Transaction Details/i)).toBeVisible();
    await page.getByRole('button', { name: /close/i }).click();

    await openNav(page, 'Channel Management');
    await page.getByRole('button', { name: /add channel type/i }).click();
    await page.getByLabel('Type Name').fill('QA Channel Type');
    await page.getByLabel('Description').fill('Created by E2E');
    await page.getByRole('button', { name: /create type/i }).click();
    await expect(page.getByText('QA Channel Type')).toBeVisible();
    await page.getByRole('button', { name: /service channels/i }).click();
    await page.getByRole('button', { name: /add service channel/i }).click();
    await page.getByLabel('Channel Name').fill('QA Service Channel');
    await page.locator('.modalShade form').getByLabel('Country').fill('Uganda');
    await page.getByRole('button', { name: /create channel/i }).click();
    await expect(page.getByText('QA Service Channel')).toBeVisible();

    await openNav(page, 'Exchange Rate');
    await page.getByRole('button', { name: /add profile/i }).click();
    await page.getByLabel('Country Name').fill('QA Land');
    await page.getByLabel('Country Code').fill('QL');
    await page.getByLabel('Currency Name').fill('QA Shilling');
    await page.getByLabel('Currency Code').fill('QAS');
    await page.getByLabel('Currency Symbol').fill('QS');
    await page.getByLabel('Decimal Places').fill('2');
    await page.getByRole('button', { name: /create profile/i }).click();
    await expect(page.getByText(/QA Land/i)).toBeVisible();
    await page.getByRole('button', { name: /denominations/i }).click();
    await page.getByRole('button').filter({ has: page.locator('svg') }).nth(0).click();
    await page.getByLabel('Value').fill('500');
    await page.getByLabel('Label').fill('500');
    await page.getByRole('button', { name: /add denomination/i }).click();
    await page.getByRole('button', { name: /save denominations/i }).click();
    await page.getByRole('button', { name: /exchange rates/i }).click();
    await page.getByRole('button', { name: /new rate/i }).click();
    await page.getByLabel('From Currency').fill('UGX');
    await page.getByLabel('To Currency').fill('USD');
    await page.getByLabel('Rate').fill('0.00027');
    await page.getByRole('button', { name: /create rate/i }).click();
    await expect(page.getByText(/UGX \/ USD/i)).toBeVisible();

    await openNav(page, 'My profile');
    await ensureNoLoadingError(page);
    await page.getByRole('button', { name: /edit profile/i }).click();
    await page.getByLabel('Primary Phone').fill('+256700555555');
    await page.getByLabel('WhatsApp').fill('+256700555555');
    await page.getByLabel('Full Name').fill('Mobi Agent QA');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Mobi Agent QA')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Mobi Agent QA')).toBeVisible();

    await openNav(page, 'Account settings');
    await ensureNoLoadingError(page);
    const initialTheme = await page.locator('html').getAttribute('data-theme');
    await page.getByText('Email Notifications').locator('..').getByRole('button').click();
    await page.getByLabel('Theme').selectOption(initialTheme === 'light' ? 'DARK' : 'LIGHT');
    await page.getByRole('button', { name: /save settings/i }).click();
    await expectNotice(page, /settings saved/i);
    await page.reload();
    await expect(page.locator('.noticeBanner')).toHaveCount(0);
    await page.getByLabel('Current Password').fill('agent123');
    await page.getByLabel('New Password').fill('agent1234');
    await page.getByLabel('Confirm New Password').fill('agent1234');
    await page.getByRole('button', { name: /update password/i }).click();
    await expectNotice(page, /password updated/i);
  });
});







