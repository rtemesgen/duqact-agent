# Mobi Agent Web App

This project implements the Mobi Agent feature set from `Mobi_Agent_UML_Documentation.docx`, but on a stronger full-stack architecture.

Current stack:
- Spring Boot backend API
- React + TypeScript frontend
- JWT authentication and registration
- PostgreSQL for intended persistent environments
- H2 in-memory database for local development and repeatable testing
- Backend-backed admin, profile, settings, shop, API connection, exchange-rate, account, wallet, and transaction workflows

## Project Structure

```text
backend/      Spring Boot REST API
frontend/     React + TypeScript Vite app
mobile-apk/   Android wrapper project for the deployed web app
```

## Current Feature Set

The current app includes:
- direct email/password login
- self-registration for new Mobi Agent users
- seeded demo login buttons for admin and agent
- dashboard KPIs and operational summaries
- transactions desk
- Mobi transactions history and recording
- channel management
- Mobi account settings
- wallet management
- exchange rates, currency profiles, rounding rules, and denominations
- API connection management
- Mobi Agent shop management
- profile and account settings pages
- admin user role assignment
- dark/light theme persistence

## Fresh Clone Setup

After cloning the repository, run backend and frontend separately.

```powershell
git clone https://github.com/rtemesgen/mobile_agent.git
cd mobile_agent
```

Start backend with local H2 data:

```powershell
$env:SPRING_PROFILES_ACTIVE="dev"
gradle :backend:bootRun
```

Keep that terminal open. In a second terminal, start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

If port `8080` is already in use, stop the old Java backend process or run the backend on another port:

```powershell
$env:PORT="8081"
$env:SPRING_PROFILES_ACTIVE="dev"
gradle :backend:bootRun
```

Then point the frontend at the new backend URL:

```text
VITE_API_URL=http://localhost:8081/api
```

## Login and Registration

The login page is now direct email/password first.

Available flows:
- sign in with email and password
- register a new Mobi Agent user
- quick sign in with seeded demo users

Seed users created when the database is empty:

```text
Admin
Email: admin@mobi.local
Password: admin123

Mobi Agent
Email: agent@mobi.local
Password: agent123
```

Important auth behavior:
- `/api/auth/register` creates `MOBI_AGENT` users only
- new admins are created by an existing admin through `User Management`

## Local Development Profiles

### H2 development mode

Use this for demos, testing, and resettable local runs:

```powershell
$env:SPRING_PROFILES_ACTIVE="dev"
gradle :backend:bootRun
```

This profile uses in-memory H2 and recreates demo data each time the backend restarts.

### PostgreSQL mode

Default backend config expects PostgreSQL:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/mobi_agent"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="postgres"
$env:JWT_SECRET="replace-with-a-long-secret-value"
$env:CORS_ALLOWED_ORIGIN="http://localhost:5173"
gradle :backend:bootRun
```

## Main API Areas

Auth and roles:
```text
POST   /api/auth/login
POST   /api/auth/register
GET    /api/users
PATCH  /api/users/{id}/role
```

Operational modules:
```text
GET/POST/PUT/DELETE /api/mno-accounts
GET/POST/PUT/DELETE /api/mno-wallets
GET/POST             /api/mno-transactions
GET/POST/PUT/DELETE /api/channels/types
GET/POST/PUT/DELETE /api/channels/service-channels
GET/POST/PUT/DELETE /api/exchange-rates
GET/POST/PUT/DELETE /api/exchange-rates/profiles
GET                  /api/dashboard/mobi-agent
```

Reference-aligned backend-backed pages:
```text
GET/POST/PUT/DELETE /api/api-connections
GET/POST/PUT/DELETE /api/shops
GET/POST/DELETE     /api/shops/{id}/workers
GET/PUT             /api/profile/me
GET/PUT             /api/settings/me
POST                /api/settings/change-password
```

## Transaction Types

The current backend transaction taxonomy is:

```text
FLOAT_TOP_UP
FLOAT_WITHDRAWAL
DEPOSIT
FLOAT_TRANSFER
```

## Validation and Testing

Frontend build:

```powershell
cd frontend
npm run build
```

Backend compile:

```powershell
gradle :backend:compileJava
```

Backend tests:

```powershell
gradle :backend:test
```

E2E validation suite:

```powershell
cd frontend
npm run test:e2e
```

Manual smoke checklist:

```text
frontend/tests/MANUAL_SMOKE_CHECKLIST.md
```

## Deployment

For Google Cloud deployment, use:

```text
GOOGLE_CLOUD_DEPLOYMENT.md
```

## Notes

- `MnoProviderAdapter` is still a stub integration point.
- The custom workspace app now includes backend-backed replacements for previously frontend-local reference pages.
- The frontend still prints the existing non-blocking `/env.js` Vite warning during production build.
