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
| 7 | Admin — Manual Booking & Approval | G | — | **manual booking**; approve/reject pending request |
| 7b | Admin — Reschedule & Cancel appt | P | admin-appointments (cancel w/ reason) | admin reschedule; no-reason block; package-intact-on-cancel |
| 8 | Session Completion | C | integration-functions (**deduct exactly one, persisted** ✓), admin-appointments (complete flow via UI) | warn-no-package UI hint |
| 9 | Treatment Packages | C | admin-patients (assign), patient-rules (balance & expiry shown), integration-functions (**zero-balance block + expired block** ✓) | create package definition (UI) |
| 10 | Family Linking | C | patient-social (add child; link-adult rejected), cross-user (**adult-link request → accept, 2 sessions** ✓) | book-on-behalf; usage-by-member; relationship-type variants |
| 11 | Herbal/Supplement Catalogue | C | admin-catalog (create), admin-crud (edit + deactivate), admin-patients (record purchase), integration-functions (**price change doesn't rewrite past sales** ✓) | photo upload/display; follow-up list; deactivated-hidden-from-sale |
| 12 | Admin — Patients & Dashboard | P | admin-patients (search→open profile), admin (dashboard reach) | dashboard stat/pending sections; "no results" message |
| 13 / 20 | Admin — Clinic Management | C | admin-crud (**create → edit → deactivate → delete** ✓) | delete-blocked-with-records guard; empty-name block |
| 14 | Service Type Management | P | admin-catalog (create service) | edit; activate/deactivate; empty-name / zero-duration block; deactivated hidden |
| 15 | Physiotherapist Role Mgmt | P | physio (schedule loads), auth-roles (physio login, cross-role guards) | **appoint** physio; remove/deactivate; assign-to-appointment; access-other's-blocked |
| 16 | Service Duration & Slot Logic | P | implicit in booking wizard | explicit end-time calc; not-enough-room hidden; duration-change stability |
| 17 | Conflict Prevention | C | integration-functions (**therapist-occupied + patient-overlap rejected** ✓) | resource/clinic-level conflict (not in scope of current rules) |
| 18 | Cancellation Reasons | P | admin-catalog (create reason) | edit; activate/deactivate; empty block; deactivate-keeps-past |
| 21 | Announcements & Push | C¹ | admin-catalog (publish), admin-crud (pull + delete), notifications (**patient receives: Home badge + list; pull hides it** ✓) | empty/past-expiry publish block. ¹Native push (FCM/APNs) is out of scope per the blueprint — "push" is the in-app badge + email, so there is no device-push to test. |
| 22 / 26 | Master/Sub-Admin & 12 Permissions | P | admin-config (screen + permission labels render, audit-log loads) | appoint/remove sub-admin; **toggle-permission enforcement**; disabled-capability blocked (direct route); master-cannot-be-removed |
| 23 | Financial Reports | P | admin-config (Reports screen loads) | category/service/product/date filters; **from>to block**; PDF share; no-records msg |
| 25 | Friends & Credit Transfer | C | patient-social (request rejected), cross-user (**request → accept, 2 sessions** ✓), integration-functions (**transfer keeps expiry; blocked w/o confirmed friend; blocked if insufficient** ✓) | decline path; book-on-behalf-friend block |
| 27 | Household Spending Report | G | — | household report screen + spending/package/used-by/friend-transfer sections |
| 28 | Technical Integrity & Audit | P | admin-config (audit log loads) | immutable transfer refs; historical amounts; invalid-transition rejection |
| 29 | User Deactivation | G | — | deactivate user; privileges ineffective; **deactivated login blocked**; records retained |
| 30 | Physio Schedule & Actions | P | physio (My Schedule loads) | reschedule/cancel own; unassigned inaccessible; physio-overlap block |

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

Moved **G → C**: §4, §8, §13/20, §17. Improved to **C**: §5, §9, §10, §11, §25.
**Remaining**: manual booking/approval (§7), household report (§27), user deactivation (§29),
physio own-actions (§30), report filtering + PDF (§23), and assorted per-field validation negatives.

## Summary

- Every user-story **area** has at least one live-manggaleh test (no area is completely dark).
- Coverage is **breadth-first on happy paths**; the main deficit is **negative/business-rule depth**
  and **admin mutation depth**, plus a few whole features (manual booking, household report, user
  deactivation, credit transfer, physio actions).
- Filling priority 1–2 would move most rows from **P → C**.
