# Deployment

## Local development

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev -- --port 43127
```

Open http://127.0.0.1:43127  
Login: `admin@workincove.local` / `1122`

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma SQLite URL (`file:./dev.db`) |
| `SESSION_SECRET` | Reserved for future signed cookies; sessions currently hash tokens at rest |
| `UPLOAD_DIR` | Local document storage path |

## Migrations & backups

- Schema changes: `npx prisma migrate dev --name <name>`
- Backup SQLite: copy `prisma/dev.db` (and `uploads/`)
- Reset demo: `npx prisma migrate reset`

## Integrations

- Meta: point lead form webhook to `/api/webhooks/meta`; set verify token in Settings.
- Google Ads adapter: POST JSON to `/api/webhooks/google-ads` with header `x-google-ads-secret`.
- Disable either integration in Settings without affecting manual/import CRM flows.

## Production notes

- Prefer Postgres for multi-user production; swap Prisma datasource and re-migrate.
- Serve behind HTTPS; set `NODE_ENV=production`.
- Put `UPLOAD_DIR` on persistent volume.
- Change Admin password after first login (update seed or add reset flow).
- Do not treat accounting reports as authoritative until reconciliation tests pass in your environment.
