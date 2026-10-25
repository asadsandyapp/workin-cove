# Deprecations & support notes

Status after local install on Node `v20.18.2` / Next `16.4.3` / Prisma `6.19.0`.

| Warning | Severity | Action |
|---------|----------|--------|
| App starts (`Ready`) | — | **App works.** Open http://127.0.0.1:43127 |
| `EBADENGINE` for `eslint-visitor-keys` | Low | Upgrade Node to **≥ 20.19** (or 22 LTS). Not a runtime break. |
| `eslint@9.39.5` deprecated | Low | Dev-only; update ESLint when convenient. Does not affect the running app. |
| `package.json#prisma` deprecated | Low | Migrated seed config to `prisma.config.ts`. Stay on Prisma **6.x** for now. |
| Prisma “update to 8.0.0-rc” | Skip | Do **not** jump to Prisma 8 RC yet. |
| Next middleware → proxy | Fixed | Renamed `src/middleware.ts` → `src/proxy.ts`. |
| Turbopack ignored `~/package-lock.json` | Low | Fixed via `turbopack.root` in `next.config.ts`. Also delete stray `/home/lenovo/package-lock.json` if you don’t need it. |
| `npm audit` (xlsx, effect/prisma, tailwind/postcss) | Medium | `xlsx` has **no fix** yet (CSV import still works). Others need major upgrades (`prisma@7`, `tailwind@4`) — defer until planned. |

## Recommended on your Lenovo

```bash
# Optional but good: Node 20.19+ or 22
# Then refresh the app:
cd ~/workin-cove
git pull origin main
rm -f ~/package-lock.json   # if it exists outside the project
npm install
npm run dev
```
