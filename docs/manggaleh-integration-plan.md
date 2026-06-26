# manggaleh.com Backend Integration Plan

Branch: `db-integration`. Goal: move the Kuya Bong app from the local mock store
(`src/store/appStore.ts` + `localStorage`) to the **manggaleh** BaaS
(https://manggaleh.com/documentation.html), one slice at a time, without
rewriting the UI.

## Why this is low-risk
Every data mutation already goes through a store action — that is the single
integration seam. We swap action bodies to call manggaleh; components stay the same.
A feature flag (`VITE_USE_MANGGALEH`) keeps the demo working on the mock store
until each slice is migrated and verified.

## Scaffolding added on this branch
- `@manggaleh/sdk` dependency (v0.3.x).
- `src/lib/manggaleh/client.ts` — singleton client + `isManggalehEnabled()` + localStorage token adapter.
- `src/lib/manggaleh/auth.ts` — signUp / signIn / signOut / getSession / OTP.
- `src/lib/manggaleh/collections.ts` — collection names + typed `coll<T>()` accessor.
- `.env.example` + `src/env.d.ts` — config.

## What I need from you to go live
1. **Tenant slug**, **publishable key** (`mgpk_…`), base URL, env (dev/staging/prod) → put in `.env`.
2. Create the **collections** below in the manggaleh console (or I can script them via a service key).
3. A **service key** (server-only) if we add serverless functions for admin/role logic.

## Collections (PostgreSQL tables) to create
manggaleh auto-adds `id (uuid)`, `created_at`, `created_by`, `updated_at`, `updated_by`.
Columns below are the domain fields (snake_case). RLS notes in parentheses.

| Collection | Key columns |
| --- | --- |
| `patient_profiles` | user_id (uuid), date_of_birth, gender, address, emergency_contact, family_group_id, active (bool) |
| `clinics` | name, address, contact, active (bool) — *(admin-managed)* |
| `service_types` | name, duration_minutes (int), active (bool), notes |
| `therapists` | name, active (bool), user_id (uuid, nullable → physiotherapist login) |
| `therapist_availability` | therapist_id, clinic_id, date, start, end |
| `appointments` | clinic_id, service_type_id, therapist_id, date, start, end, patient_user_id (owner), for_member_id, for_member_name, status, source, note, cancelled_by, cancellation_reason_id, cancellation_note |
| `package_definitions` | name, sessions (int), validity_days (int) |
| `patient_packages` | definition_id, name, owner_user_id (owner), total_sessions, remaining, assign_date, expiry_date, status, source_package_id, transferred_from_user_id |
| `package_usage` | patient_package_id, appointment_id, member_name, date, recorded_by |
| `products` | name, category, price (numeric), active (bool), notes, image_object_ids (jsonb → storage object ids) |
| `product_purchases` | patient_user_id (owner), product_id, product_name, unit_price_at_sale, quantity, purchase_date, estimated_follow_up_date, follow_up_status, notes |
| `announcements` | title, message, expiry_date, published (bool) |
| `cancellation_reasons` | label, active (bool) |
| `friends` | requester_user_id (owner), addressee_user_id, status |
| `credit_transfers` | from_user_id, to_user_id, sessions, original_package_id, recipient_package_id, expiry_date, reversed (bool) |
| `audit_log` | actor_user_id, actor_name, action, detail, at |
| `sub_admin_permissions` | singleton row: one boolean column per capability |

## Architecture correction (verified against the live `realief-expert/dev`)
Empirically tested with a signed-in user (publishable key + session):
- **Owner-less / shared tables (clinics, service_types, therapists, products, announcements,
  cancellation_reasons, package_definitions, therapist_availability, sub_admin_permissions)
  are READABLE by ANY logged-in user** → catalog reads need **no Function**, just the SDK.
- **Owner-scoped tables (appointments, patient_packages, product_purchases, friends,
  patient_profiles) return only the caller's own rows.**
- So the **patient experience (read catalog + own data, create own bookings/friends/transfers)
  works with just the publishable key + user session.**
- **Functions (service key) are only needed for admin scope:** writing shared catalog,
  reading *all* users' data (admin lists), and cross-user/privileged writes + audit.

Implication: do the patient slice first with the SDK directly; add admin Functions later.

> Known migration detail: some UI hardcodes `clinicId === 'clinic-a'` for accent colors.
> manggaleh ids are uuids, so clinic accent styling needs an explicit `accent`/index field.

## Action → manggaleh mapping (high level)
- **Auth** (`login`, `register`, `verify`, `resetPassword`, `logout`) → `client.auth.*`. Roles/adminLevel
  stored on a `patient_profiles`/role table or via ABAC tags.
- **Reads** (clinics, services, products, announcements, my appointments/packages) → `coll(x).list({filters,order})`,
  optionally `.live()` for realtime.
- **Owner-scoped writes** (book/cancel/reschedule own, friend request/transfer) → `coll(x).insert/update`.
- **Privileged/atomic writes** → **serverless functions** (service key), because RLS is user-centric:
  - `bookAppointment` (conflict check + insert) — must be atomic/server-side.
  - `markCompleted` (deduct a session) — use `{$inc:-1, $guard:{remaining:"gte.1"}}` in a tx.
  - `transferCredit` / package assign/edit/remove, `appointSubAdmin`, `setSubAdminPermission`,
    `deactivateUser`, `appointPhysiotherapist` — write the row(s) **and** the `audit_log` entry in one tx.
- **Product photos** → `client.storage.upload()` + `getSignedUrl()` (server resize), replacing client-side dataURLs.
- **Audit log** → written inside the privileged functions.

## Serverless Function pattern (PROVEN against realief-expert/dev)
Admin/cross-user ops run as Functions because RLS is user-centric. The function
runtime evaluates code as **CommonJS** and the npm SDK import is unavailable, so
Functions call the data REST API with the **SERVICE_KEY secret** via `ctx.fetch`:

```js
// functions/<name>.mjs  (CJS; pushed with: mg functions push --allow-domain api.manggaleh.com)
module.exports = async (input, ctx) => {
  const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
  const res = await ctx.fetch(`${base}/data/<collection>?limit=200`, { headers: { 'x-api-key': ctx.secrets.SERVICE_KEY } })
  return { rows: (await res.json()).data }   // POST/PATCH/DELETE for writes
}
```
Setup once: `mg secrets set --name SERVICE_KEY --value <mgsk_…>`. Verified:
`admin_list_users` returns all users (bypassing RLS). Client calls via `invokeFn(name, input)`.
Functions to build: admin list-all (users/appointments/packages/purchases/transfers/audit),
bookAppointment (+conflict), markCompleted (+deduct), assign/edit/remove package, transferCredit,
friend accept, deactivate/appoint, catalog writes — all on this pattern.

## Phased rollout
1. **Foundation (this branch):** SDK + client + config + plan. *(done)*
2. **Auth slice:** swap `login/register/verify/resetPassword/logout` to manggaleh behind the flag; map roles.
3. **Read slice:** load clinics/services/products/announcements + the user's appointments/packages from collections.
4. **Write slice:** owner-scoped mutations (booking, friends, transfer) via SDK; privileged ones via functions + audit.
5. **Storage slice:** product photos to manggaleh storage.
6. **Realtime polish:** `.live()` on admin/physio schedules; remove `localStorage` persistence.

## Not covered by manggaleh (still external)
- Phone/SMS auth and **push notifications** (FCM/APNs) — announcements "push" stays in-app/email.
