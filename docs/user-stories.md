# Kuya Bong App — User Stories (MVP)

Based on the *Product Concept and Solution Blueprint v0.2*.
Organized simply per feature, with a **Positive Flow** (success) and **Negative Flow** (failure / edge case).
Two roles: **Patient** and **Admin (Kuya Bong)**.

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
- As a patient, I want to search available appointment slots so that I can find an open time.
- As a patient, I want to select a clinic, date, and time so that I book at the right place.
- As a patient, I want to review my booking details before confirming so that I avoid mistakes.
- As a patient, I want to receive a booking confirmation (clinic, date, time) so that I know my reservation is set.

### Negative
- As a patient, I want to be blocked from booking a slot someone just took so that double booking is prevented.
- As a patient, I want to see a clear message when no slots are available so that I know to try another date.
- As a patient, I want to be stopped from booking a past or expired slot so that I only book valid times.

---

## 5. Reschedule & Cancel

### Positive
- As a patient, I want to reschedule my appointment to another available slot so that I can change my plans.
- As a patient, I want to cancel my appointment before the session so that the slot is freed up.
- As a patient, I want to view my appointment history (upcoming, completed, cancelled, rescheduled) so that I can track my visits.

### Negative
- As a patient, I want to be prevented from rescheduling to an unavailable slot so that I only move to open times.
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
- As an admin, I want to cancel a patient's appointment before the session so that the slot is freed up.

### Negative
- As an admin, I want to be prevented from rescheduling to an unavailable/taken slot so that double booking is prevented.
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

## 14. Notes
- Appointment statuses: Available, Pending Approval, Confirmed, Rescheduled, Cancelled (by Patient/Admin), Completed, No-Show.
- Open items still to confirm with client (Section 20): auto vs manual approval, appointment duration, cancellation cutoff, verification method (OTP/email/both), multiple active packages, package start date, family approval rules.
