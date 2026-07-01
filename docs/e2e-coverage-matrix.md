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
| 4 | Appointment Booking | P | patient-booking (service→clinic→date→time→review→confirm) | **double-book blocked**, **own-overlap blocked**, no-service stop, "no slots" msg, past-slot block |
| 5 | Reschedule & Cancel | P | patient-appointments (reschedule, cancel w/ reason), My Visits list | note for "Other"; reschedule-to-unavailable; **24h cutoff block** |
| 6 | Admin — Availability | P | admin-config (calendar loads + Therapist control) | **publish/edit/remove window**; remove-booked warning; overlap block |
| 7 | Admin — Manual Booking & Approval | G | — | **manual booking**; approve/reject pending request |
| 7b | Admin — Reschedule & Cancel appt | P | admin-appointments (cancel w/ reason) | admin reschedule; no-reason block; package-intact-on-cancel |
| 8 | Session Completion | P | admin-appointments (complete flow; skipped when no same-day card) | **deduct-one-session verified**; deduct only on completion; warn no package |
| 9 | Treatment Packages | P | admin-patients (assign), patient-misc (packages loads) | create package definition; **zero-balance block**; **expired block**; balance/expiry assertions |
| 10 | Family Linking | P | patient-social (add child; link-adult unregistered rejected) | relationship types; **book on behalf**; usage-by-member; **adult-link acceptance** (2-user); pending-until-confirm |
| 11 | Herbal/Supplement Catalogue | P | admin-catalog (create product), admin-patients (record purchase) | edit/activate-deactivate; **photo upload/display**; follow-up list; **price-change doesn't rewrite past sales**; deactivated hidden from sale |
| 12 | Admin — Patients & Dashboard | P | admin-patients (search→open profile), admin (dashboard reach) | dashboard stat/pending sections; "no results" message |
| 13 / 20 | Admin — Clinic Management | G | — | create/edit/deactivate/delete clinic; delete-blocked-with-records; empty-name |
| 14 | Service Type Management | P | admin-catalog (create service) | edit; activate/deactivate; empty-name / zero-duration block; deactivated hidden |
| 15 | Physiotherapist Role Mgmt | P | physio (schedule loads), auth-roles (physio login, cross-role guards) | **appoint** physio; remove/deactivate; assign-to-appointment; access-other's-blocked |
| 16 | Service Duration & Slot Logic | P | implicit in booking wizard | explicit end-time calc; not-enough-room hidden; duration-change stability |
| 17 | Conflict Prevention | G | — | **therapist-occupied**, **patient-overlap**, resource-taken (all negative) |
| 18 | Cancellation Reasons | P | admin-catalog (create reason) | edit; activate/deactivate; empty block; deactivate-keeps-past |
| 21 | Announcements & Push | P | admin-catalog (publish), patient-misc (list loads) | unpublish/pull; delete; expiry auto-hide; empty/past-expiry block |
| 22 / 26 | Master/Sub-Admin & 12 Permissions | P | admin-config (screen + permission labels render, audit-log loads) | appoint/remove sub-admin; **toggle-permission enforcement**; disabled-capability blocked (direct route); master-cannot-be-removed |
| 23 | Financial Reports | P | admin-config (Reports screen loads) | category/service/product/date filters; **from>to block**; PDF share; no-records msg |
| 25 | Friends & Credit Transfer | P | patient-social (friend request to unregistered rejected) | accept/decline (2-user); **credit transfer**; expiry-retained; transfer-before-confirm block; book-on-behalf-friend block |
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

## Summary

- Every user-story **area** has at least one live-manggaleh test (no area is completely dark).
- Coverage is **breadth-first on happy paths**; the main deficit is **negative/business-rule depth**
  and **admin mutation depth**, plus a few whole features (manual booking, household report, user
  deactivation, credit transfer, physio actions).
- Filling priority 1–2 would move most rows from **P → C**.
