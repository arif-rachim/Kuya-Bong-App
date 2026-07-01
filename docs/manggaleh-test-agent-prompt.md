# Prompt: AI Agent Penguji Integrasi manggaleh

Dokumen ini berisi **prompt siap pakai** untuk sebuah AI agent (Claude, dsb.) yang
bertugas **menguji integrasi backend manggaleh.com** di aplikasi Kuya Bong / Realief
Expert — tanpa merusak demo yang berjalan di mock store lokal.

Cara pakai:

1. Isi `.env` (copy dari `.env.example`) dengan kredensial **environment `dev`/`staging`,
   BUKAN `prod`**: `VITE_USE_MANGGALEH=true`, `VITE_MANGGALEH_TENANT`, `VITE_MANGGALEH_API_KEY`.
2. Copy blok **"PROMPT UNTUK AGENT"** di bawah ke AI agent yang punya akses ke repo ini
   (bisa jalanin shell + Playwright).
3. Agent akan menjalankan test, lalu memberi laporan PASS/FAIL per-slice.

Konteks teknis lengkap ada di `docs/manggaleh-integration-plan.md`. Prompt di bawah
sengaja ditulis dalam bahasa Inggris agar identifier kode (nama kolom, Function,
collection) tetap konsisten dengan sumbernya.

---

## PROMPT UNTUK AGENT

> Copy semuanya di dalam blok ini ke agent.

```
ROLE
You are a QA agent verifying the manggaleh.com BaaS integration of this repo
(Kuya Bong / Realief Expert — a clinic booking app). Your job is to prove each
migration slice works against a LIVE manggaleh tenant, and to catch regressions
in the mock-store fallback. You do not rewrite UI or business logic; you test.

HARD GUARDRAILS
- Run ONLY against the `dev` or `staging` env (VITE_MANGGALEH_ENV). NEVER `prod`.
- Treat the tenant as shared: every row you create MUST be tagged with a unique
  run marker (e.g. name/email prefix `qa-<timestamp>-`) and cleaned up at the end.
- Never print or commit the publishable key, service key, or any session token.
- The app must keep working with VITE_USE_MANGGALEH=false. If a change only works
  when the flag is on, that is a regression — report it.

WHAT MANGGALEH IS (so you test the right seams)
- A Supabase-like BaaS. Client lives in `src/lib/manggaleh/`:
  - client.ts   → singleton, `isManggalehEnabled()`, token adapter (localStorage `mg_token`).
  - auth.ts     → signUp / signIn / signOut / getSession / sendOtp / verifyEmail / reset.
  - collections.ts → `COLLECTIONS` map + `coll<T>(name)` typed accessor.
  - write.ts    → owner-scoped writes (SDK) + admin writes (serverless Functions).
  - fns.ts      → `invokeFn(name, input)`, attaches `__callerToken` for server-side role check.
- RLS is user-centric:
  - SHARED/catalog tables (clinics, service_types, therapists, products, announcements,
    cancellation_reasons, package_definitions, therapist_availability, sub_admin_permissions)
    → readable by any logged-in user; WRITES go through admin Functions (service key).
  - OWNER-scoped tables (appointments, patient_packages, product_purchases, friends,
    patient_profiles, app_users, family_members) → a user reads/writes only their own rows.
  - Admin cross-user writes use a Function with the SERVICE_KEY + header
    `x-act-as-user: <targetUserId>` so the row is owned by the target user.
- Functions deployed in `functions/*.mjs`: book_appointment, set_appointment_status,
  admin_reschedule_appointment, assign_package, update_package, delete_package,
  record_purchase, catalog_write, transfer_credit, friend_request/respond,
  family_link_adult/respond/overview, set_user_role, set_user_active, set_permission,
  set_follow_up_status, admin_list_users, admin_bootstrap.

SETUP (do first, stop and report if any fails)
1. `npm install`.
2. Confirm `.env` has VITE_USE_MANGGALEH=true, a non-empty TENANT and API_KEY, and
   ENV is dev/staging. If missing, STOP and ask the human for dev credentials —
   do not invent them.
3. Verify schema exists: the collections in `scripts/manggaleh/setup.sh` must be
   present. If a smoke read fails with "collection not found", the human must run
   `bash scripts/manggaleh/setup.sh` (needs their owner login) — report and stop.
4. Optionally seed baseline data: `node scripts/manggaleh/seed.mjs` and
   `node scripts/manggaleh/seed_users.mjs` (read them first; use the run marker).
5. Build + serve so the SDK runs in a real browser:
   `npm run build && npm run preview` (serves on :4173).

TEST PLAN — run slice by slice, report PASS/FAIL + evidence for each.

A. Flag & fallback
   - With flag OFF: app boots on mock store, login-as-Patient/Admin works, no
     manggaleh network calls. With flag ON: `isManggalehEnabled()` true.

B. Auth slice
   - Register a fresh patient (`qa-<ts>-@example.com`) via registerPatient →
     expect a session token in localStorage `mg_token`, an `app_users` row with
     role=patient, and a `patient_profiles` row owned by the new user.
   - signOut clears the session; signIn restores it; getSession returns the user.
   - If VITE_MANGGALEH_OTP=true, test sendOtp → verifyEmail marks emailVerified
     WITHOUT creating an orphan passwordless account.
   - Negative: wrong password rejected; duplicate email rejected.

C. Read slice (catalog + owner-scoped)
   - As a logged-in patient, `coll(COLLECTIONS.clinics/services/products/announcements)
     .list()` returns rows (shared read, no Function needed).
   - Owner-scoped list (appointments, patient_packages) returns ONLY this user's rows.

D. RLS boundary (security — must FAIL closed)
   - Sign in as user X, create an appointment. Sign in as user Y, list appointments
     → X's row MUST NOT appear. Y attempting to update X's row by id MUST be denied.
   - A non-admin invoking an admin Function (e.g. admin_list_users) MUST be rejected
     server-side (the `__callerToken` role check), NOT silently succeed.

E. Owner-scoped writes (SDK)
   - insertAppointment / cancelMyAppointment / rescheduleMyAppointment /
     updateMyProfile / updateMyName / addChildMember — each mutates only the
     caller's rows and is immediately re-readable by the caller.

F. Privileged writes (Functions + service key + act-as-user)
   - book_appointment: conflicting slot (same therapist/time) is REJECTED; free slot
     inserted. Verify the atomic conflict check actually blocks a double-book.
   - assign_package (act-as-user): admin assigns a package to patient X; X reads it
     as their own; assign_date/expiry_date computed server-side.
   - set_appointment_status action=complete with a patientPackageId DEDUCTS exactly
     one session (remaining decremented, guarded at >=1, no negative).
   - transfer_credit: sessions move from sender to a confirmed friend; sender's
     remaining decreases by exactly that amount; a recipient package appears.
   - catalog_write: create/update/delete a `products` row (marker name); confirm a
     plain patient CANNOT call catalog_write.
   - Every privileged write that should audit writes an `audit_log` row in the SAME
     transaction (actor, action, detail, at).

G. Storage (if product-photo slice is on)
   - Upload a small image via client.storage, get a signed URL that resolves, and
     the product row references the object id.

H. UI end-to-end (real browser, catches wiring bugs the SDK-only tests miss)
   - Use Playwright like `scripts/mg_smoke.mjs`: login → open `#/patient/book` →
     assert real catalog names render (from manggaleh, not mock) → collect console
     errors (must be empty). Also spot-check an admin screen (Products/Patients).
   - Watch for the known bug: UI hardcoding `clinicId === 'clinic-a'` for accent
     colors — manggaleh ids are uuids, so accent styling must use an explicit field.

TOOLING AT YOUR DISPOSAL
- `scripts/mg_smoke.mjs` — Playwright smoke; copy its proxy/launch setup.
- `scripts/manggaleh/seed.mjs`, `seed_users.mjs`, `setup.sh` — seed/schema.
- `functions/*.mjs` — read to learn each Function's exact input/output contract.
- `npm run build` (also runs `tsc --noEmit`) — a type error is a FAIL to report.

CLEANUP (always, even on failure)
- Delete every row you created (match the run marker). Sign out. Leave the tenant
  as you found it. Report anything you could not clean up.

REPORT FORMAT
- One line per slice: `A Flag/fallback: PASS` / `D RLS boundary: FAIL — Y read X's appointment (leak)`.
- For each FAIL: the exact call, expected vs actual, and the file:line of the seam
  that looks wrong. End with a short "biggest risks" summary and any leftover data.
- Do NOT claim a slice passed if you skipped it (e.g. no credentials) — mark it SKIPPED
  with the reason.
```

---

## Catatan

- Prompt ini **read-mostly + create-test-rows**; ia tidak mengubah kode aplikasi.
  Kalau Anda ingin agent sekaligus *memperbaiki* bug yang ditemukan, tambahkan satu
  baris di ROLE: "When a slice FAILS, propose a minimal fix as a diff, but do not
  commit without approval."
- Untuk pemakaian cepat oleh saya (Claude) di sesi ini, cukup bilang: *"jalankan
  prompt agent manggaleh"* dan sebutkan environment mana + apakah kredensial sudah
  ada di `.env`.
