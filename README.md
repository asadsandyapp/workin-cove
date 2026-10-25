# Workin Cove

Single-company business management application: generic workspace CRM plus property inventory, tenants/leases/rent, expenses/maintenance, sales/purchases, and integer-money accounting.

## Quick start

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev -- --hostname 127.0.0.1 --port 43127
```

- App: [http://127.0.0.1:43127](http://127.0.0.1:43127)
- Admin: `admin@workincove.local` / `1122`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit / reconciliation tests |
| `npm run db:seed` | Seed demo CRM + ops + ledger |

## Docs

- `docs/PROJECT_BLUEPRINT.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/DEPLOYMENT.md`

## Architecture note

CRM workspaces are operational contexts. Properties are a separate inventory module. Tenants link to shared CRM contacts; accounting posts use integer minor units only.
