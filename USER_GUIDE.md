# Mobi Agent User Guide

Mobi Agent is a web application for mobile money agent operations. It combines operational workflows and admin controls in one system.

## Main Areas

The app currently supports:
- Mobi Dashboard
- Transactions Desk
- Mobi Transactions
- Channel Management
- Mobi Account Setting
- Wallets
- Exchange Rate
- API Documentation
- Mobi Agent Shop
- User Management for admins
- My profile
- Account settings

## Who Can Use The App

### Admin

An Admin can:
- sign in with email and password
- manage user roles
- manage API connection records
- manage shops and worker assignments
- access all normal operational modules

### Mobi Agent

A Mobi Agent can:
- sign in with email and password
- register through the public registration form
- manage accounts, wallets, transactions, exchange-rate data, profile, and settings
- view API Documentation and assigned shops

## Demo Login Details

When the backend starts with an empty database, it creates two demo users:

```text
Admin
Email: admin@mobi.local
Password: admin123

Mobi Agent
Email: agent@mobi.local
Password: agent123
```

The login page also includes quick buttons:
- `Seed Agent`
- `Seed Admin`

## Login and Registration

The login page opens directly on the email/password form.

Available actions:
1. enter email and password and sign in
2. register a new Mobi Agent account
3. use seeded quick-login buttons

New registrations are created as `MOBI_AGENT` users by default.

## How To Run Locally

Start the backend:

```powershell
$env:SPRING_PROFILES_ACTIVE="dev"
gradle :backend:bootRun
```

Then start the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Core Workflows

### Accounts and Wallets
- create MNO accounts
- record opening balance, e-money, cash at hand, agent ID, and remarks
- create wallets linked to accounts

### Transactions
- record transactions from the Transactions Desk or Mobi Transactions page
- review previous and new balances
- inspect transaction details

Current transaction types:
- `FLOAT_TOP_UP`
- `FLOAT_WITHDRAWAL`
- `DEPOSIT`
- `FLOAT_TRANSFER`

### Exchange Rate
- manage exchange rates
- manage currency profiles
- manage rounding rules
- manage denominations

### Admin Controls
- promote users in `User Management`
- manage API connection records
- manage shops and workers

### Profile and Settings
- update profile data
- update notification and shop settings
- switch theme between dark and light
- change password

## Notes

- Local `dev` mode uses H2 in-memory data.
- This is the preferred mode for demos and repeatable testing.
- PostgreSQL is intended for persistent environments.
- External MNO integration remains a backend placeholder for future work.
