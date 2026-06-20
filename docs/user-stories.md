# Kuya Bong App — User Stories (MVP)

Based on the *Product Concept and Solution Blueprint v0.3* (tracking KBA-BP-20260615-001)
and *Blueprint Update v0.4* (tracking KBA-BP-20260620-001).
Organized simply per feature, with a **Positive Flow** (success) and **Negative Flow** (failure / edge case).
Roles: **Patient**, **Admin (Kuya Bong / Master Admin)**, and **Sub-Admin**.

> **v0.3 update:** Sections 14–18 cover blueprint Section 25 — service types, therapists,
> service-duration-driven slots, conflict prevention, and cancellation reasons. Sections 4, 5,
> and 7b were also updated for service selection and required cancellation reasons.
>
> **v0.4 update:** Sections 20–23 cover the latest customer-meeting requirements — clinic
> lifecycle management, announcements & push notifications, master/sub-admin roles, and
> financial ad-hoc reports. Items still pending confirmation are listed in the Notes.

---

## 1. Registration & Verification

### Positive
- As a patient, I want to register using my email and/or mobile number so that I can create an account.
- As a patient, I want to verify my account via OTP/email link so that my account is activated.

### Negative
- As a patient, I want to be told when my email/mobile is already registered so that I don't create a duplicate account.
- As a patient, I want to be told when I enter a wrong or expired verification code so that I can request a new one.
- As a patient, I want to be blocked from booking before my account is verified so that only verified users can book.

---

## 2. Login & Password Reset

### Positive
- As a user, I want to log in with my credentials so that I can access my role-based screens.
- As a patient, I want to reset a forgotten password after identity verification so that I can regain access securely.

### Negative
- As a user, I want to see an error when my email/password is wrong so that I know the login failed.
- As a patient, I want to be denied a password reset if I fail identity verification so that my account stays protected.
- As a patient, I want to be prevented from accessing admin screens so that roles stay separated.

---

## 3. Profile & Clinic Info

### Positive
- As a patient, I want to view and update my profile information so that my details stay correct.
- As a patient, I want to view Clinic A and Clinic B information so that I know where to go.

### Negative
- As a patient, I want to be warned when I leave a required field empty so that I can't save an incomplete profile.

---

## 4. Appointment Booking

### Positive
- As a patient, I want to select a service type first so that the system knows the required duration before showing times.
- As a patient, I want to search available appointment slots so that I can find an open time.
- As a patient, I want to select a clinic, date, and time so that I book at the right place.
- As a patient, I want the system to show only valid start times (with enough room for the service duration) so that I don't pick a slot that can't fit my treatment.
- As a patient, I want to review my booking details (service, clinic, date, start–end time) before confirming so that I avoid mistakes.
- As a patient, I want to receive a booking confirmation (service, clinic, date, start–end time) so that I know my reservation is set.

### Negative
- As a patient, I want to be blocked from booking a slot someone just took so that double booking is prevented.
- As a patient, I want to be blocked from booking a time that overlaps one of my existing appointments (even at the other clinic) so that I can't be in two places at once.
- As a patient, I want to be stopped if no service type is selected so that every appointment is linked to a service.
- As a patient, I want to see a clear message when no slots are available so that I know to try another date.
- As a patient, I want to be stopped from booking a past or expired slot so that I only book valid times.

---

## 5. Reschedule & Cancel

### Positive
- As a patient, I want to reschedule my appointment to another available slot so that I can change my plans.
- As a patient, I want to cancel my appointment before the session so that the slot is freed up.
- As a patient, I want to select a cancellation reason (from the admin-managed list) when I cancel so that the clinic understands why.
- As a patient, I want to add a short note when I pick "Other" as the reason so that I can explain an unlisted situation.
- As a patient, I want to view my appointment history (upcoming, completed, cancelled, rescheduled) so that I can track my visits.

### Negative
- As a patient, I want to be prevented from rescheduling to an unavailable slot so that I only move to open times.
- As a patient, I want to be prevented from rescheduling to a time that overlaps another of my appointments so that I don't double-book myself.
- As a patient, I want to be stopped from cancelling without choosing a reason so that every cancellation is explained.
- As a patient, I want to be blocked from cancelling/rescheduling past the allowed cutoff so that the clinic policy is respected.

---

## 6. Admin — Availability Management

### Positive
- As an admin, I want to publish appointment slots by clinic, date, and time so that patients can book them.
- As an admin, I want to edit or remove slots so that I can keep availability accurate.
- As an admin, I want to view bookings by clinic, date, and time so that I can manage my schedule.

### Negative
- As an admin, I want to be warned when I try to remove a slot that's already booked so that I don't drop a patient by accident.
- As an admin, I want to be prevented from creating overlapping/duplicate slots so that the calendar stays consistent.

---

## 7. Admin — Manual Booking & Approval

### Positive
- As an admin, I want to create a booking manually for phone/DM requests so that all bookings live in one system.
- As an admin, I want to approve or reject a reservation request when approval is required so that I control my schedule.

### Negative
- As an admin, I want to be blocked from manually booking an already-taken slot so that double booking is prevented.

---

## 7b. Admin — Reschedule & Cancel Appointments

### Positive
- As an admin, I want to reschedule a patient's appointment to another available slot so that I can handle changes received by phone or in person.
- As an admin, I want to cancel a patient's appointment on their behalf when they request it by phone or another offline channel so that all changes stay in the system.
- As an admin, I want to select a cancellation reason and optionally add an internal note when I cancel so that the record is complete.
- As an admin, I want the system to record that the cancellation was performed by the administrator (not the patient) so that responsibility is clear.

### Negative
- As an admin, I want to be prevented from rescheduling to an unavailable/taken slot so that double booking is prevented.
- As an admin, I want to be stopped from cancelling without choosing a reason so that every cancellation is explained.
- As an admin, I want cancelling/rescheduling to keep the patient's package balance intact (no deduction) so that only completed sessions are charged.

---

## 8. Session Completion

### Positive
- As an admin, I want to mark an appointment as completed after treatment so that the session is recorded.
- As an admin, I want a completed session to deduct one from the patient's package (if any) so that the balance stays accurate.

### Negative
- As an admin, I want session deduction to happen only on completion (not on booking) so that cancelled/rescheduled bookings don't reduce the balance.
- As an admin, I want to be warned when no valid package applies so that I don't deduct from the wrong package.

---

## 9. Treatment Packages

### Positive
- As an admin, I want to create a package with a set number of sessions and validity period so that I can sell treatment bundles.
- As an admin, I want to assign a package to a patient so that they can use prepaid sessions.
- As a patient, I want to view my package balance and expiry date so that I know how many sessions are left.

### Negative
- As an admin/patient, I want package usage blocked when the balance reaches zero so that no extra sessions are taken.
- As an admin/patient, I want package usage blocked after the expiry date (even with sessions left) so that expired packages aren't used.

---

## 10. Family Linking & Shared Packages

### Positive
- As a patient, I want to link an adult family member (spouse) by their registered email/mobile so that we can share eligible packages.
- As a patient, I want to add a child under my account (no separate login) so that I can manage their sessions.
- As a patient, I want to view which family member used each session so that usage is transparent.

### Negative
- As a patient, I want an adult link request to require the other person's acceptance so that no one is linked without consent.
- As a patient, I want to be told when the email/mobile I'm linking isn't registered so that I can correct it.

---

## 11. Herbal & Supplement Catalogue (Admin)

### Positive
- As an admin, I want to create, edit, activate/deactivate, and price products so that my catalogue stays current.
- As an admin, I want to record a patient's product purchase with price-at-time-of-sale and date so that I keep accurate history.
- As an admin, I want to review each patient's last purchase date and a follow-up list so that I can contact patients when products may be running out.

### Negative
- As an admin, I want updating a product's price to NOT change past purchase records so that historical prices stay accurate.
- As an admin, I want deactivated products hidden from new purchase selection so that I don't sell discontinued items.

---

## 12. Admin — Patient Management & Dashboard

### Positive
- As an admin, I want to search and open a patient's profile so that I can review their details, family links, and appointment history.
- As an admin, I want a dashboard showing today's appointments, pending requests, and follow-up reminders so that I can manage the day at a glance.
- As an admin, I want a single overview of appointments, patient records, packages, and purchase history so that I can run the business in one place.

### Negative
- As an admin, I want a clear "no results" message when a patient search returns nothing so that I know the patient isn't registered.

---

## 13. Admin — Clinic Management

### Positive
- As an admin, I want to update the names of Clinic A and Clinic B so that the app shows the correct official names.

### Negative
- As an admin, I want to be prevented from saving an empty clinic name so that clinic info stays valid.

---

## 14. Admin — Service Type Management

### Positive
- As an admin, I want to add a service type with a name and standard duration (e.g. Physiotherapy & Massage = 3h, Grounding Machine Therapy = 2h) so that bookings can be linked to a service.
- As an admin, I want to edit a service name and update its duration when business rules change so that the catalogue stays current.
- As an admin, I want to activate or deactivate a service so that only offered services appear during booking.

### Negative
- As an admin, I want to be prevented from saving a service with an empty name or a zero/invalid duration so that booking logic always has valid data.
- As an admin, I want deactivated services hidden from new bookings while existing appointments keep their original service so that history stays accurate.

---

## 15. Admin — Therapist Management

### Positive
- As an admin, I want to add and edit therapist names so that I can support myself plus occasional therapists (e.g. my brother).
- As an admin, I want to activate or deactivate a therapist so that only available therapists can be assigned.
- As an admin, I want to assign a therapist to an appointment so that I know who delivers each session.
- As an admin, I want to view appointments filtered by therapist so that I can see each therapist's schedule.

### Negative
- As an admin, I want to be prevented from saving a therapist with an empty name so that therapist data stays valid.
- As an admin, I want to be warned before deactivating a therapist who has upcoming appointments so that I don't leave sessions unassigned.

---

## 16. Service Duration & Booking Slot Logic

### Positive
- As a patient, I want the appointment end time to be calculated automatically from my start time plus the service duration so that the booking reflects the real treatment length.
- As an admin, I want availability to account for service duration so that a 3-hour service reserves the therapist and clinic for the full window (e.g. 09:00–12:00).

### Negative
- As a patient, I want start times that don't have enough remaining room for the service duration to be hidden or blocked so that I can't book a session that won't fit.
- As an admin, I want changing a service duration to NOT alter the start/end times already saved on existing appointments so that confirmed bookings stay stable.

---

## 17. Conflict Prevention

### Positive
- As an admin, I want the system to check therapist, patient, and clinic/resource availability before confirming a booking so that overlaps are caught early.

### Negative
- As an admin/patient, I want a booking blocked when the chosen therapist is already occupied for an overlapping time (even at the other clinic) so that one therapist can't be in two places at once.
- As a patient, I want a booking blocked when it overlaps another of my own appointments (any clinic, therapist, or service) so that I'm never double-booked.
- As an admin, I want a booking blocked when a clinic/resource is already taken for an overlapping service duration (when resource checking applies) so that the same resource isn't double-booked.

---

## 18. Admin — Cancellation Reasons (Master Data)

### Positive
- As an admin, I want to manage the list of cancellation reasons (e.g. Patient not available, Patient is sick, Emergency, Booked wrong clinic, Booked wrong date/time, Other) so that cancellations are categorized consistently.
- As an admin, I want "Other" to allow a free-text note so that unlisted situations can still be captured.

### Negative
- As an admin, I want to be prevented from saving an empty cancellation reason so that the list stays meaningful.
- As an admin, I want deactivating/removing a reason to keep it on past cancellations that already used it so that history stays accurate.

---

## 20. Admin — Clinic Management (v0.4)

### Positive
- As an admin, I want to add a new clinic so that the business can grow to more locations.
- As an admin, I want to edit a clinic's details (name, address) so that information stays accurate.
- As an admin, I want to deactivate a clinic so that it no longer appears for new bookings while its history is preserved.
- As an admin, I want to delete a clinic only when it has no linked records (appointments, bookings, sales, packages) so that empty/mistaken entries can be cleaned up.

### Negative
- As an admin, I want deletion blocked when a clinic has any historical transactions, with deactivation offered instead, so that historical records are protected.
- As an admin, I want a deactivated clinic hidden from new booking/availability while existing appointments there stay intact.
- As an admin, I want to be prevented from saving a clinic with an empty name so that clinic data stays valid.

---

## 21. Announcements & Push Notifications (v0.4)

### Positive
- As an admin, I want to create an announcement (title + message) and push it to registered customers so that I can share promos, clinic notices, and updates.
- As an admin, I want to set an expiry date so that the announcement hides automatically once it's no longer relevant.
- As an admin, I want to manually unpublish/pull an announcement before its expiry so that I can retract it early.
- As an admin, I want announcement history kept for reference so that I can see what was sent.
- As a patient, I want to receive a notification and see the announcement inside the app so that I stay informed.

### Negative
- As an admin, I want to be prevented from publishing an announcement with an empty title/message or an expiry date in the past so that only valid announcements go out.
- As a patient, I want expired or unpublished announcements to no longer appear so that I only see current notices.

---

## 22. Master Admin & Sub-Admin Roles (v0.4)

### Positive
- As the Master Admin (Kuya), I want to appoint a registered user as a Sub-Admin so that they can help with daily operations.
- As the Master Admin, I want to remove a Sub-Admin's access so that I stay in control of who can administer the system.
- As a Sub-Admin, I want to help with daily tasks (bookings, completion, product purchases, announcements per policy) so that operations run smoothly.

### Negative
- As a Sub-Admin, I want to be blocked from adding/removing other Sub-Admins and from changing the Master Admin's access so that only Kuya controls admin access.
- As a Sub-Admin, I want core master data (clinics, therapists, services, cancellation reasons) to be read-only/hidden so that only the Master Admin manages it.
- As the Master Admin, I want my own Master Admin access to be impossible to remove so that I never lose control of the system.

---

## 23. Financial Ad-Hoc Reports (v0.4)

### Positive
- As an admin, I want to generate a financial report filtered by Category (Services or Products), From Date (defaults to the 1st of the month), and To Date (defaults to today) so that I can review income for a period.
- As an admin, I want a Service filter (default All) when Category = Services, and a Product filter (default All) when Category = Products, so that I can narrow the report.
- As an admin, I want the Services report to list completed therapy sessions in range, and the Products report to list sold products in range, with the related amount/income when recorded.
- As an admin, I want to share the generated report as a PDF via my phone's standard share function so that I can send it easily.

### Negative
- As an admin, I want to be blocked (with a clear message) when From Date is later than To Date so that the range is always valid.
- As an admin, I want a clear "no records in range" message when nothing matches so that an empty report isn't confusing.

---

## 24. Notes
- Appointment statuses: Available, Pending Approval, Confirmed, Rescheduled, Cancelled (by Patient/Admin), Completed, No-Show.
- **v0.3 appointment data includes:** service type, therapist, calculated end time, cancellation reason, cancelled-by (patient/admin), and optional cancellation note. Booking source expands to App / phone / manual admin / other channel.
- **Confirmed in v0.3 (Section 25):** service types (with durations driving slot logic), therapists (managed + assigned), and required/managed cancellation reasons.
- **v0.4 open questions to confirm with client:** (1) MVP vs Phase 2 for these items; (2) can Sub-Admins view financial reports; (3) can Sub-Admins publish announcements or only Kuya; (4) announcements to all customers or selected; (5) how service income is recorded (manual / price list / package records) — **note: services currently have no price field, only products do**; (6) report sharing PDF-only or also Excel/CSV later.
- Open items still pending from earlier: auto vs manual approval, cancellation cutoff, verification method (OTP/email/both), multiple active packages, package start date, family approval rules, and clinic/resource-level conflict checking.
