# E2E Coverage vs. User Stories — Gap Analysis

Maps every `docs/user-stories.md` section to the Playwright specs in `e2e/`.
Legend: **C** = covered · **P** = partial (happy path or load-only; negatives/depth missing) · **G** = gap (no test).

Bias of the current suite: **positive/primary flows across every area are covered; most
negative / business-rule scenarios and admin CRUD depth are not yet.**

| # | User story area | Status | Covered by | Notable gaps |
|---|---|---|---|---|
| 1 | Registration & Verification | P | smoke (field + password validation, register→verify→home mock), auth (manggaleh register opt-in) | duplicate email/mobile rejected; **booking blocked before verified** |
| 2 | Login & Password Reset | P | auth, auth-roles (login all roles, wrong password, role separation, forgot-password neutral msg) | full reset-with-token flow; denied reset on failed identity |
| 3 | Profile & Clinic Info | P | patient-profile (view/edit, change-pw validation), patient-misc (clinics) | required-empty-field save warning |
| 4 | Appointment Booking | C | patient-booking (wizard end-to-end), integration-functions (**therapist + own-overlap conflict rejected** ✓) | no-service stop; "no slots" msg; past-slot block (UI-enforced) |
| 5 | Reschedule & Cancel | P | patient-appointments (reschedule, cancel w/ reason), patient-rules (**24h cutoff block** ✓), My Visits list | note for "Other"; reschedule-to-unavailable |
| 6 | Admin — Availability | P | admin-config (calendar loads + Therapist control) | **publish/edit/remove window**; remove-booked warning; overlap block |
| 7 | Admin — Manual Booking & Approval | C | integration-functions (**approve → Confirmed; reject → CancelledByAdmin; admin books on behalf** ✓) | manual-booking UI wizard (backend covered; UI slot-picker not driven) |
| 7b | Admin — Reschedule & Cancel appt | P | admin-appointments (cancel w/ reason) | admin reschedule; no-reason block; package-intact-on-cancel |
| 8 | Session Completion | C | integration-functions (**deduct exactly one, persisted** ✓), admin-appointments (complete flow via UI) | warn-no-package UI hint |
| 9 | Treatment Packages | C | admin-patients (assign), patient-rules (balance & expiry shown), integration-functions (**zero-balance block + expired block** ✓) | create package definition (UI) |
| 10 | Family Linking | C | patient-social (add child; link-adult rejected), cross-user (**adult-link request → accept, 2 sessions** ✓) | book-on-behalf; usage-by-member; relationship-type variants |
| 11 | Herbal/Supplement Catalogue | C | admin-catalog (create), admin-crud (edit + deactivate), admin-patients (record purchase), integration-functions (**price change doesn't rewrite past sales** ✓) | photo upload/display; follow-up list; deactivated-hidden-from-sale |
| 12 | Admin — Patients & Dashboard | P | admin-patients (search→open profile), admin (dashboard reach) | dashboard stat/pending sections; "no results" message |
| 13 / 20 | Admin — Clinic Management | C | admin-crud (**create → edit → deactivate → delete** ✓) | delete-blocked-with-records guard; empty-name block |
| 14 | Service Type Management | P | admin-catalog (create), validation (**empty-name + zero-duration blocked** ✓) | edit; activate/deactivate; deactivated-hidden-from-booking |
| 15 | Physiotherapist Role Mgmt | P | physio (schedule loads), auth-roles (physio login, cross-role guards) | **appoint** physio; remove/deactivate; assign-to-appointment; access-other's-blocked |
| 16 | Service Duration & Slot Logic | P | implicit in booking wizard | explicit end-time calc; not-enough-room hidden; duration-change stability |
| 17 | Conflict Prevention | C | integration-functions (**therapist-occupied + patient-overlap rejected** ✓) | resource/clinic-level conflict (not in scope of current rules) |
| 18 | Cancellation Reasons | P | admin-catalog (create), validation (**empty blocked** ✓) | edit; activate/deactivate; deactivate-keeps-past |
| 13 | Clinic (empty-name) | C | validation (**empty clinic name blocked** ✓) | — |
| 21 | Announcements & Push | C¹ | admin-catalog (publish), admin-crud (pull + delete), notifications (**patient receives: Home badge + list; pull hides it** ✓) | empty/past-expiry publish block. ¹Native push (FCM/APNs) is out of scope per the blueprint — "push" is the in-app badge + email, so there is no device-push to test. |
| 22 / 26 | Master/Sub-Admin & 12 Permissions | P | admin-config (screen + permission labels render, audit-log loads) | appoint/remove sub-admin; **toggle-permission enforcement**; disabled-capability blocked (direct route); master-cannot-be-removed |
| 23 | Financial Reports | C | admin-reports (**from>to blocked**; PDF button present ✓) | per-filter result contents; PDF output; no-records message |
| 25 | Friends & Credit Transfer | C | patient-social (request rejected), cross-user (**request → accept, 2 sessions** ✓), integration-functions (**transfer keeps expiry; blocked w/o confirmed friend; blocked if insufficient** ✓) | decline path; book-on-behalf-friend block |
| 27 | Household Spending Report | C | admin-reports (**loads + select household → spending section** ✓) | per-section content assertions |
| 28 | Technical Integrity & Audit | P | admin-config (audit log loads) | immutable transfer refs; historical amounts; invalid-transition rejection |
| 29 | User Deactivation | C² | integration-functions (**deactivate persists; master-admin cannot be deactivated** ✓) | ²**deactivated-login-blocked is NOT enforced in manggaleh mode** (mock-only) — see Findings |
| 30 | Physio Schedule & Actions | P³ | physio (My Schedule screen loads) | ³In manggaleh mode the schedule is **empty** (assigned appts aren't loaded) and cancel/reschedule are **mock-only** — see Findings |

## Biggest gaps, by priority

1. **Business-rule negatives (highest value, currently thin):** conflict/double-booking (§4, §17),
   24h cancel/reschedule cutoff (§5), package zero-balance & expiry blocks (§9), session-completion
   deduction proof (§8), price-history immutability (§11). These encode the core rules and are the
   most valuable to lock down. Several need `fixtures.ts` to seed exact state (near-cutoff appt,
   zero/expired package, an existing sale).
2. **Admin CRUD depth:** currently mostly "create" + "screen loads". Missing edit / activate-deactivate /
   delete and their guards for clinics (§13/20), services (§14), products (§11), reasons (§18),
   announcements unpublish/delete (§21).
3. **Cross-user (2-context) flows:** friend accept + credit transfer (§25), family adult-link acceptance
   (§10). Need two browser contexts.
4. **Untouched areas:** manual booking + approval (§7), household report (§27), user deactivation (§29),
   physio appoint/assign/own-actions (§15/§30), reports filtering + from>to (§23).
5. **Verification/eligibility gates:** booking blocked before verified (§1), deactivated-user login blocked (§29).

## Progress

Priority 1 & 2 increments landed:
- `patient-rules`, `admin-crud` (UI): §5 24h cutoff, §9 balance/expiry display, §11 product
  edit/deactivate, §13/20 full clinic lifecycle, §21 announcement pull/delete.
- `integration-functions` (Function level — signs in with the publishable key and invokes the
  deployed serverless Functions as the app does): §4/§17 therapist + patient-overlap conflict
  rejection, §8 deduct-exactly-one (persisted), §9 zero-balance & expired completion blocks.

Also added (option a+b): `integration-functions` §11 price-history immutability + §25 transfer
(keeps expiry / confirmed-friend / insufficient guards); `cross-user` (two live sessions) §25
friend request→accept and §10 adult-link request→accept.

Final sweep added: §7 approve/reject/on-behalf, §23 from>to, §27 household, §29 deactivate +
master-guard (Functions/UI); per-field validation negatives (§13/§14/§18).

Moved **G → C**: §4, §8, §13/20, §17, §7, §27, §29. Improved to **C**: §5, §9, §10, §11, §23, §25.
**Remaining (deliberate)**: items behind the Findings below (physio schedule/actions §30,
deactivated-login §29-enforcement) are app gaps, not test gaps; plus low-value leftovers
(catalog edit/deactivate for services/reasons, PDF output bytes, per-filter report contents).

## Findings (real gaps in the app, surfaced by writing these tests)

These are product/integration gaps, not test gaps — flagged rather than papered over:

1. **Physiotherapist role bug (fixed):** the schedule crashed under real data (React #185
   infinite render); memoized `usePhysioTherapistIds`/`useFamilyMembers` in `src/store/selectors.ts`.
2. **Physiotherapist schedule is non-functional on manggaleh:** hydrate loads only the caller's
   own (owner-scoped) appointments, and a physio is a patient-role user — so appointments *assigned
   to them* are never fetched. `My Schedule` renders empty. Needs a physio-scoped read (a Function
   that returns appointments by therapist_id), analogous to `admin_bootstrap`.
3. **Physio cancel/reschedule are mock-only:** `MySchedule.tsx` calls the local store actions with
   no `isManggalehEnabled()` branch, so a physio's changes never persist to manggaleh.
4. **Deactivated-login is not enforced on manggaleh:** the "account deactivated" block exists only in
   the mock `login()`. `mgSignIn`/hydrate/route-guards never check `app_users.active`, so a
   deactivated user can still sign in. (Deactivation itself persists correctly.)

## Summary

- Every user-story **area** has at least one live-manggaleh test (no area is completely dark).
- Coverage is **breadth-first on happy paths**; the main deficit is **negative/business-rule depth**
  and **admin mutation depth**, plus a few whole features (manual booking, household report, user
  deactivation, credit transfer, physio actions).
- Filling priority 1–2 would move most rows from **P → C**.
