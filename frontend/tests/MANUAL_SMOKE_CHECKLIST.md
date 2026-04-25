# Manual Smoke Checklist

Run after `npm run test:e2e` in `frontend/`.

## Shell and navigation
- Sidebar remains visible for every nav item.
- Theme toggle and logout remain reachable without clipping.
- Topbar title matches the selected page.

## Modal and table behavior
- Modal overlay closes cleanly with Cancel and Close actions.
- Dense tables keep action icons aligned after pagination and refresh.
- Delete-confirmation modals render warning text and inputs correctly.

## Theme and readability
- Dark mode and light mode both preserve readable contrast.
- Cards, forms, tables, and modals update theme consistently.
- Theme persists after refresh and relogin.

## Operational math
- Transaction balance preview matches the persisted result after save.
- Wallet/account balances visibly change after transaction creation.
- Dashboard KPI values reflect newly recorded transactions.

## Page-specific checks
- Currency profile and denomination modals keep spacing and labels intact.
- Profile and Account Settings do not get stuck in loading state.
- API Documentation and Shop pages persist changes after refresh.
