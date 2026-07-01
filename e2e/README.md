# E2E tests (Playwright) — mock + manggaleh

End-to-end tests that drive the real UI in a browser. Because the app renders the
same UI whether the store is backed by the **local mock** or the **manggaleh BaaS**
(the integration only swaps store-action bodies), one suite serves both:

| Run mode | How | What runs |
| --- | --- | --- |
| **Mock** (default) | no `VITE_*` env | `smoke.spec.ts` only — the manggaleh specs auto-skip |
| **manggaleh** | export `VITE_USE_MANGGALEH=true` + tenant/key + test creds | the full suite against a live dev/staging tenant |

The mock run needs no secrets and is safe in CI; it guards the app shell, routing,
and the client-side auth flow. The manggaleh run is the actual backend integration
test (auth, hydration, the conflict-checked `book_appointment` Function, admin
service-key reads, role guards).

## Layout

- `helpers.ts` — env gating (`manggalehConfigured`, per-role credential flags), route/login/dialog helpers.
- `fixtures.ts` — service-key precondition helpers (seed an appointment/package, look up a user id) for
  deterministic stateful/negative flows. No-op / skipped when `MANGGALEH_SERVICE_KEY` is absent.

Auth & roles
- `smoke.spec.ts` — backend-agnostic: boot, Welcome, login validation, register→verify→home (mock).
- `auth.spec.ts` — login / wrong-password / role separation / logout / (opt-in) registration.
- `auth-roles.spec.ts` — admin & physiotherapist login, cross-role route guards, forgot-password.

Patient
- `patient-booking.spec.ts` — the booking wizard end-to-end → `book_appointment`.
- `patient-nav.spec.ts` — every patient tab hydrates its own data without app errors.
- `patient-appointments.spec.ts` — reschedule / cancel an existing appointment.
- `patient-profile.spec.ts` — view + edit profile, change-password validation.
- `patient-social.spec.ts` — family (add child, link-adult negative) & friends (request negative).
- `patient-misc.spec.ts` — clinics, announcements, packages, home.

Admin & physio
- `admin.spec.ts` / `admin-catalog.spec.ts` — dashboard/reads + products/services/reasons/announcements CRUD.
- `admin-patients.spec.ts` — search patient, assign package, record purchase.
- `admin-appointments.spec.ts` — complete (deduct)/cancel appointment lifecycle.
- `admin-config.spec.ts` — settings toggle, calendar, reports, sub-admins & the 12 permissions, audit log.
- `physio.spec.ts` — physiotherapist schedule.

Specs skip (not fail) when their prerequisites are missing, so a partial config
still runs everything it can. Verified green against `realief-expert/dev` (44 tests:
5 backend-agnostic + 39 manggaleh) via the relay below.

> While building this suite the physiotherapist screen was found to crash under real
> data (React #185 infinite render from array-returning selectors); fixed in
> `src/store/selectors.ts` (`usePhysioTherapistIds`, `useFamilyMembers`).

## Running (mock mode)

```bash
npm install
# Pinned Playwright + a pre-provisioned browser → point at it instead of downloading:
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e
```

The `webServer` in `playwright.config.ts` runs `npm run build && npm run preview`
automatically, so no separate server is needed.

## Running against manggaleh

```bash
cp .env.e2e.example .env.e2e          # then fill in tenant, publishable key, test accounts
set -a; source .env.e2e; set +a       # export VITE_* (baked into the build) + E2E_* creds
npm run test:e2e
```

Requirements:
1. A **dev/staging** tenant (never prod — the booking spec creates an appointment row).
2. Schema + seed present: `bash scripts/manggaleh/setup.sh` then
   `MANGGALEH_SERVICE_KEY=… node scripts/manggaleh/seed.mjs` and `… seed_users.mjs`.
3. Test accounts that exist in the tenant (the seed creates `maria@example.com` /
   `admin@reliefexpert.app`, etc.).

## Restricted-egress environments (browser can't reach the API)

In some sandboxed containers/CI the **headless browser cannot open a direct
connection to `api.manggaleh.com`** (the request dies with
`net::ERR_CONNECTION_CLOSED`) even though server-side `curl`/Node can reach it.
This is an environment egress limit — not a CORS/domain-whitelist issue on
manggaleh (a blocked origin would return an HTTP response; here the connection is
closed before any response).

Work around it with the bundled localhost relay, which the browser *can* reach:

```bash
node scripts/e2e-manggaleh-relay.mjs &            # localhost:8788 -> api.manggaleh.com
# build the app against the relay + run the suite:
VITE_MANGGALEH_BASE_URL=http://localhost:8788 \
VITE_USE_MANGGALEH=true VITE_MANGGALEH_TENANT=realief-expert \
VITE_MANGGALEH_API_KEY=mgpk_… \
E2E_PATIENT_EMAIL=… E2E_PATIENT_PASSWORD=… \
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium \
npm run test:e2e
```

This setup was used to verify the full suite green against the live `realief-expert/dev`
tenant (login → hydrate → book via the `book_appointment` Function → admin reads).
In an unrestricted environment, drop the relay and point `VITE_MANGGALEH_BASE_URL`
at the real API.

## Notes

- Reports: `npm run test:e2e:report` (HTML). Interactive: `npm run test:e2e:ui`.
- Single worker by design — the specs share one tenant and booking is stateful.
- SDK/RLS-level assertions (owner isolation, admin-Function guards, act-as-user) that
  aren't observable through the UI are described in
  `../docs/manggaleh-test-agent-prompt.md`.
