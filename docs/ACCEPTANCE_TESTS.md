# Acceptance Tests

## Auth
1. Unauthenticated visit to `/` redirects to `/login`.
2. Valid Admin credentials create session and open dashboard.
3. Logout clears session cookie.

## CRM
1. Create lead manually → appears in list/dashboard new-lead count.
2. Convert lead → contact created; optional deal in default pipeline; lead status CONVERTED.
3. Move deal stage on Kanban → stage history row; lost requires reason.
4. Task views Overdue/Today/Tomorrow/Next7/Next30/Open/Completed/Unscheduled reconcile with seeded + created tasks under `Asia/Karachi`.
5. Disable Meta/Google webhooks → POST returns 503; manual lead create and import still succeed.

## Import
1. Upload sample CSV → mapping suggested → preview shows validation/duplicates → commit creates leads and import job summary.

## Property / rent
1. Create property with acquisition cost → journal posts asset/bank.
2. Create tenant from CRM contact; create active lease; property status OCCUPIED.
3. Generate invoice → receivable/revenue journal; balance = amount.
4. Partial payment → status PARTIAL; balance reduced; never PAID while balance > 0.
5. Full payment → status PAID; balance 0.
6. Escalation writes history and updates lease rent.

## Expenses / transactions / accounting
1. Record expense → expense journal; appears once in expense list and trial balance.
2. Complete SALE transaction → property SOLD; balanced journal.
3. Trial balance debit total equals credit total after seed + operations.

## Module boundary
1. CRM workspace is not required to represent a property.
2. Tenant uses shared `Contact`; `ModuleLink` connects modules without duplicating CRM people.
