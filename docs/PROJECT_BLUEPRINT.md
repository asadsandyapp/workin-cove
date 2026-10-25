# Workin Cove — Project Blueprint

## Product

Single-company business management app with one Admin role. Generic workspace CRM plus specialized property/rental/accounting modules that share CRM contacts, tasks, activities, and `ModuleLink` records.

## Stack decisions

| Area | Choice | Reason |
|------|--------|--------|
| App | Next.js App Router + TypeScript | Greenfield default; server actions + route handlers |
| UI | Tailwind + shadcn-style primitives | Fast, consistent admin UI |
| DB | SQLite via Prisma | Local persistence without external credentials |
| Auth | Cookie session + bcrypt password | Simple Admin-only local demo security |
| Money | Integer minor units (`*Minor`) | Exact accounting; no float balances |
| Files | Local `uploads/` directory | Works offline for documents |
| Timezone | Configurable (`Asia/Karachi` default) | Task date-boundary correctness |

Empty repo was scaffolded with Next.js + Prisma + SQLite (documented here; not re-scaffolded later).

## Module boundaries

1. **Generic CRM** — workspaces, leads, contacts, companies, deals/pipelines, tasks, activities, tags, custom fields, documents, dashboard, import, Meta/Google Ads webhooks.
2. **Property inventory** — company-owned assets (not CRM workspaces).
3. **Tenants / leases / rent** — tenants → CRM contacts; leases; invoices; partial payments; escalations.
4. **Expenses / maintenance** — categories, vendors, work orders, property links.
5. **Sales / purchases** — property transactions with CRM counterparties; status-gated completion.
6. **Accounting** — chart of accounts, balanced journals, trial balance, P&L snapshot.

## Key entities

- CRM: `Workspace`, `Lead`, `Contact`, `Company`, `Deal`, `Pipeline`/`Stage`, `Task`, `Activity`, `Tag`, `CustomFieldDefinition`, `Document`, `ImportJob`
- Ops: `Property`, `Tenant`, `Lease`, `RentInvoice`, `RentPayment`, `RentEscalation`, `Expense`, `WorkOrder`, `PropertyTransaction`
- Finance: `Account`, `JournalEntry`, `JournalLine`
- Cross-cutting: `ModuleLink`, `AuditEvent`, `AppSettings`, `User`/`Session`

## Integrations

- `GET/POST /api/webhooks/meta` — Meta lead form verify + ingest (disable in settings).
- `POST /api/webhooks/google-ads` — shared-secret lead ingest (disable in settings).
- Manual + CSV/Excel import always work when integrations are off.
