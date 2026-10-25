# Implementation Plan

## Phase 1 — Foundation
- [x] Repo audit / greenfield scaffold (Next.js, Prisma, SQLite)
- [x] Auth (Admin login/logout, protected routes)
- [x] App shell, settings, seed
- [x] Blueprint + plan + status docs

## Phase 2 — Generic CRM
- [x] Workspaces, leads, contacts, companies
- [x] Deals, pipelines, Kanban + table, stage history
- [x] Activities, notes, documents, tags, custom fields

## Phase 3 — Task engine
- [x] Eight date views with business timezone bounds
- [x] Quick complete, reschedule history, record links
- [x] `automationKey` uniqueness for dedupe

## Phase 4 — Lead acquisition
- [x] CSV/Excel import preview/mapping/validation/dupes/summary
- [x] Meta + Google Ads webhook adapters (disable-safe)

## Phase 5 — CRM dashboard
- [x] Real metrics with drill-down links

## Phase 6 — Property & rental
- [x] Property inventory CRUD
- [x] Tenants linked to contacts
- [x] Leases, invoices, collection, escalation

## Phase 7 — Expenses, maintenance, sales/purchases
- [x] Expenses with ledger postings
- [x] Work orders
- [x] Property sale/purchase with status gating

## Phase 8 — Accounting
- [x] Chart of accounts, journals, trial balance
- [x] Integer money + reconciliation tests

## Phase 9 — Hardening
- [x] README / DEPLOYMENT / ACCEPTANCE_TESTS
- [ ] Broader E2E browser suite (optional follow-up)
- [x] Lint / typecheck / build / unit tests
