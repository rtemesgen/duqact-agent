# Mobi Agent Reference Mapping

This file maps the useful Mobi Agent workflow and UI logic from `E:\satesoft\mobi-agent` onto `E:\satesoft\mobile-agent-custom`.

Rule used throughout:
- Backend and data source of truth: `mobile-agent-custom`
- UI and workflow source of truth: relevant Mobi Agent screens in `mobi-agent`
- Excluded: unrelated non-Mobi modules, Firebase write logic, and frontend-only mock persistence

Current parity status:
- Main shell and all sidebar targets are implemented in the custom app
- Remaining work is mostly parity polish and targeted bug-fixing
- Validation coverage now includes an automated Playwright harness plus a manual smoke checklist

## Dashboard

- Reference entrypoints:
  - `components/Dashboard.tsx`
  - Mobi shell/sidebar patterns around the dashboard area
- Main app entrypoint:
  - `frontend/src/pages/DashboardPage.tsx`
- Adopted:
  - workshop shell composition
  - KPI-first landing screen
  - dense summary panel patterns
- Adapted:
  - all values come from `/api/dashboard/mobi-agent`
- Excluded:
  - unrelated dashboard modules outside Mobi scope

## Transactions Desk

- Reference entrypoints:
  - transaction-desk workflow within the Mobi shell
- Main app entrypoint:
  - `frontend/src/pages/TransactionsDeskPage.tsx`
- Adopted:
  - fast operational desk layout
  - direct transaction entry workflow
  - receipt and recent-history style flow
- Adapted:
  - current app uses the existing transaction backend instead of frontend-local state
- Backend extension required:
  - none currently

## Mobi Transactions

- Reference entrypoints:
  - `components/MNOWalletTransactionsPage.tsx`
  - `components/MNOWalletTransactionModal.tsx`
  - `components/MNOWalletTransactionConfirmationModal.tsx`
- Main app entrypoint:
  - `frontend/src/pages/MNOWalletTransactionsPage.tsx`
- Adopted:
  - KPI row
  - search row
  - dense table
  - record-transaction modal
  - details modal
  - pagination footer
  - stronger amount semantics
- Adapted:
  - current backend transaction types are now aligned more closely with the reference:
    - `FLOAT_TOP_UP`
    - `FLOAT_WITHDRAWAL`
    - `DEPOSIT`
    - `FLOAT_TRANSFER`
  - balance updates are still backend-authoritative
- Backend extension required:
  - none currently

## Channel Management

- Reference entrypoint:
  - `components/ChannelManagementPage.tsx`
- Main app entrypoint:
  - `frontend/src/pages/ChannelManagementPage.tsx`
- Adopted:
  - tabbed `Channel Types` and `Service Channels`
  - filter row
  - add/edit/view/delete modal flow
  - delete confirmation with password and remarks
  - status pill treatment
- Adapted:
  - current app persists real channel records through backend APIs
- Backend extension required:
  - none currently

## Mobi Account Setting

- Reference entrypoints:
  - `components/MobiAgentSettingsPage.tsx`
  - `components/MobiAccountModal.tsx`
  - `components/DeleteMobiAccountModal.tsx`
- Main app entrypoint:
  - `frontend/src/pages/MobiAgentSettingsPage.tsx`
- Adopted:
  - search
  - pagination
  - view/edit/delete action order
  - confirmation modal for delete
  - denser table structure
- Adapted:
  - account fields are now persisted with reference-oriented metadata where useful, including:
    - agent ID
    - currency
    - opening balance
    - remarks
- Backend extension required:
  - none currently

## Wallets

- Reference entrypoints:
  - `components/WalletSettingsPage.tsx`
  - `components/ViewWalletModal.tsx`
  - `components/EditWalletModal.tsx`
- Main app entrypoint:
  - `frontend/src/pages/MNOWalletSettingsPage.tsx`
- Adopted:
  - search/filter behavior
  - view/edit/delete workflow
  - pagination footer
  - detail modal and destructive confirmation flow
- Adapted:
  - current wallet data model is operational-wallet based, not shop-settings based
- Backend extension required:
  - none currently

## Exchange Rate

- Reference entrypoints:
  - `components/ExchangeRatePage.tsx`
  - `components/ExchangeRateModal.tsx`
  - `components/SecurityDeleteModal.tsx`
- Main app entrypoint:
  - `frontend/src/pages/ExchangeRatePage.tsx`
- Adopted:
  - reference-style three-part workflow:
    - `Currency Profiles`
    - `Denominations`
    - `Exchange Rates`
  - denser management tables
  - search
  - view/edit/delete modal flow
  - destructive confirmation pattern
- Adapted:
  - current app now persists currency profiles, rounding rules, and denominations through the backend instead of mock state
- Backend extension required:
  - none currently
- Known validation gap:
  - the Playwright suite still has one failing case in the currency-profile create flow, so this area needs one more bug-fix pass

## API Documentation

- Reference entrypoints:
  - `components/ApiSettingsPage.tsx`
  - `components/AddApiModal.tsx`
  - `components/EditApiModal.tsx`
  - `components/ViewApiModal.tsx`
  - `components/DeleteApiModal.tsx`
- Main app entrypoint:
  - `frontend/src/pages/ApiDocumentationPage.tsx`
- Adopted:
  - search
  - add/view/edit/delete modal flow
  - status handling
- Adapted:
  - current app persists API connections through `/api/api-connections`
  - this is backend-backed, not frontend-local
- Backend extension required:
  - none currently

## Mobi Agent Shop

- Reference entrypoint:
  - `components/MobiAgentInfoPage.tsx`
- Main app entrypoint:
  - `frontend/src/pages/MobiAgentShopPage.tsx`
- Adopted:
  - shop table
  - admin add/edit flow
  - view details
  - worker assignment workflow
- Adapted:
  - current app persists shops and workers through `/api/shops` and `/api/shops/{id}/workers`
  - admin and agent visibility is role-scoped by backend behavior
- Backend extension required:
  - none currently

## User Management

- Reference entrypoints:
  - `components/UsersPage.tsx`
  - `components/ViewUserModal.tsx`
  - `components/EditUserModal.tsx`
- Main app entrypoint:
  - `frontend/src/pages/AdminUsersPage.tsx`
- Adopted:
  - dense table
  - search
  - view/edit modal flow
  - explicit role-edit interaction
- Adapted:
  - current app manages roles and basic user fields through the backend
  - public registration still creates `MOBI_AGENT`; admin promotion remains an admin action
- Backend extension required:
  - none currently

## My Profile

- Reference entrypoint:
  - `components/ProfilePage.tsx`
- Main app entrypoint:
  - `frontend/src/pages/ProfilePage.tsx`
- Adopted:
  - banner/header layout
  - about/contact/details/identity sections
  - edit/save flow
- Adapted:
  - current app persists user profile through `/api/profile/me`
  - this is backend-backed, not frontend-local
- Backend extension required:
  - none currently

## Account Settings

- Reference entrypoint:
  - `components/SettingsPage.tsx`
- Main app entrypoint:
  - `frontend/src/pages/AccountSettingsPage.tsx`
- Adopted:
  - toggle cards
  - permission summary
  - password change form
- Adapted:
  - current app persists user settings through `/api/settings/me`
  - password updates go through `/api/settings/change-password`
  - theme preference is also persisted through the same settings model
- Backend extension required:
  - none currently

## Login / Register

- Reference entrypoint:
  - `components/SignIn.tsx`
- Main app entrypoint:
  - `frontend/src/pages/LoginPage.tsx`
- Adopted:
  - quick access emphasis
  - single-screen login and registration flow
  - seeded-entry shortcuts for seeded users
- Adapted:
  - current app now opens directly to email and password login
  - registration remains available from the same page
  - auth uses backend login and register endpoints and JWT session handling
- Excluded:
  - social sign-in
  - non-Mobi roles

## Global Shell

- Reference entrypoints:
  - `components/Sidebar.tsx`
  - shell/topbar patterns used around the Mobi area
- Main app entrypoint:
  - `frontend/src/main.tsx`
  - `frontend/src/styles.css`
  - `frontend/src/theme-overrides.css`
- Adopted:
  - dark shell hierarchy
  - left nav grouping
  - top utility bar
  - account section
  - theme toggle behavior
- Adapted:
  - only Mobi-relevant nav items are kept
  - admin-only user management remains role-gated
- Implemented:
  - sidebar has its own scroll region
  - lower nav items and logout stay reachable
  - dark and light mode are functional and persisted, not visual-only

## Validation Harness

- Main app entrypoints:
  - `frontend/playwright.config.ts`
  - `frontend/tests/e2e/auth-theme.spec.ts`
  - `frontend/tests/e2e/admin-workflows.spec.ts`
  - `frontend/tests/e2e/agent-workflows.spec.ts`
  - `frontend/tests/MANUAL_SMOKE_CHECKLIST.md`
- Implemented:
  - Playwright E2E coverage for auth, theme, admin workflows, and major agent workflows
  - manual smoke checklist for UI-heavy parity checks
- Current state:
  - most coverage is passing under the local harness
  - one remaining failing E2E case exists in the Exchange Rate currency-profile create flow
- Excluded:
  - this section documents validation only; it does not change product behavior
