---
title: Kuya Bong Mobile App - Product Concept and Solution Blueprint
document_version: "0.7"
status: For Internal Review and Stakeholder Discussion
tracking_number: KBA-BP-20260622-001
source_pdf: Kuya_Bong_Product_Concept_and_Solution_Blueprint_v0.7.pdf
supersedes: KBA-BP-20260620-003
updated: 2026-06-22
---

# Kuya Bong Mobile App - Product Concept and Solution Blueprint v0.7

This is the editable requirements companion to the signed-off source artifact named in the front matter. It is a working blueprint, not a final software specification. Confirm the open questions before implementing behavior that depends on them.

## 1. v0.7 update summary

| Area | Current requirement |
| --- | --- |
| Clinic management | Add, edit, deactivate, and delete only when no historical records are linked. |
| Announcements | Admin-created announcements, app notification, expiry, manual withdrawal, and history. |
| Roles | Master Admin, centrally permissioned Sub-Admin, registered-user-linked Physiotherapist, and Patient/Normal User. |
| Physiotherapists | Selected from registered users; access is limited to assigned appointments unless additional Sub-Admin permission applies. |
| User deactivation | Master Admin can deactivate users without deleting historical records. |
| Products | Product photos, display, and automatic resize/compression. |
| Family and Friends | Separate categories; Friends require confirmation and use credit transfer rather than direct package access. |
| Reports | Financial ad-hoc and household spending/active package reports. |
| Sub-Admin control | One central checkbox permission profile applies to all Sub-Admins. |

## 2. Business context and objectives

Kuya Bong provides appointment-based physiotherapy, chiropractic, massage-related, and other therapy services across two clinics whose official names are still to be confirmed. He also sells herbal and supplement products.

The product objectives are to:

1. Support secure registration, verification, login, and password reset.
2. Book by service, clinic, date, time, and Physiotherapist.
3. Prevent overlapping Physiotherapist, clinic/resource, and patient bookings.
4. Publish availability across clinics and Physiotherapists.
5. Support manual booking, rescheduling, cancellation, completion, and cancellation reasons.
6. Manage service types and booking durations.
7. Track packages, expiry, Family usage, and Friend credit transfer.
8. Manage products, photos, prices, purchases, and follow-up.
9. Publish customer announcements and app notifications.
10. Generate financial and household/package reports.
11. Manage Master Admin, Sub-Admin, Physiotherapist, and Patient roles.
12. Protect data through authentication, authorization, deactivation, and audit logging.

## 3. MVP scope

### 3.1 Included

- One mobile app for all roles.
- Registration, verified contact details, login, password reset, and Master Admin user deactivation.
- Clinic, service type, service duration, and cancellation-reason management.
- Registered-user Physiotherapist assignment and an assigned-appointments-only schedule.
- Availability and booking by clinic, service, Physiotherapist, date, and time.
- Conflict checking using service duration.
- Appointment and manual admin booking workflows.
- Package definition, assignment, use, balance, expiry, Family use, and Friend transfer rules.
- Product catalogue, prices, active state, optimized photos, sales, and follow-up.
- Announcement publication, notification, expiry, withdrawal, and history.
- One central Sub-Admin permission profile.
- Financial ad-hoc and household/package reports, preferably shareable as PDF.

### 3.2 Outside current MVP / future

- Online payment processing.
- Advanced announcement audience targeting; MVP may start with all registered users.
- Multiple Sub-Admin permission profiles.
- Excel/CSV export unless separately required.
- Advanced accounting, including tax, refunds, ledgers, reconciliation, and integrations.
- Advanced Physiotherapist push notifications.

## 4. Roles and permissions

### 4.1 Master Admin

Kuya Bong is the Master Admin with full control. Only the Master Admin can appoint or remove Sub-Admins and Physiotherapists unless a later approved rule says otherwise.

The Master Admin can manage clinics, services, cancellation reasons, products, Physiotherapists, users, packages, announcements, reports, bookings, follow-ups, central Sub-Admin permissions, and user deactivation.

### 4.2 Sub-Admin

Sub-Admins are registered users appointed by Kuya. One central permission profile applies to all Sub-Admins.

| No. | Permission |
| --- | --- |
| 1 | Manage Booking / time-slot availability; when disabled, calendar is view-only. |
| 2 | Appointment Management. |
| 3 | Manage Clinics. |
| 4 | Manage Therapists / Physiotherapists and role assignment where permitted. |
| 5 | Manage Patients, package assignment, purchase recording, and operational patient data. |
| 6 | Manage Products, including photos and prices. |
| 7 | Manage Service Types. |
| 8 | Manage Cancellation Reasons. |
| 9 | Manage Announcements. |
| 10 | Manage Follow-Up List. |
| 11 | Generate Financial Reports - Services. |
| 12 | Generate Financial Reports - Products / Sales. |

Sub-Admins cannot appoint/remove Sub-Admins, change Master Admin access, or override the central permission profile.

### 4.3 Physiotherapist

- A Physiotherapist must be a registered user appointed by Kuya; the role must not be represented by a free-text name.
- The user can view their own schedule and appointments assigned to them.
- Cancellation/rescheduling of assigned appointments is subject to open questions Q-03 and Q-04.
- The user cannot manage another Physiotherapist's appointments unless they also hold effective Sub-Admin permission.
- Future notifications may cover assigned bookings, cancellations, and rescheduling.

### 4.4 Patient / Normal User

- Register, verify, authenticate, reset password, and maintain profile.
- View permitted services, clinics, products, announcements, appointments, and package data.
- Book, reschedule, and cancel subject to rules.
- Link Family and Friends according to confirmation rules.
- Transfer package credit to a registered, confirmed Friend when allowed.

## 5. Functional requirements

### 5.1 Account lifecycle and user deactivation

- Required contact verification must be completed before booking.
- Password reset must be secure.
- Master Admin can deactivate a user for business/security reasons.
- A deactivated user cannot log in or create new bookings.
- Deactivation must preserve appointments, package records, product sales, financial records, and other history.
- Effective Sub-Admin and Physiotherapist privileges become inactive while the user is deactivated.
- Reactivation remains open question Q-15.

### 5.2 Clinic, service, booking, and cancellation

- Clinics can be added, edited, deactivated, and conditionally deleted.
- A clinic with linked transactions/history cannot be deleted; its historical records retain original clinic information.
- Every appointment has a service type and defined duration.
- Appointment end time equals start time plus service duration.
- Overlap checks apply to Physiotherapist, patient, and relevant clinic/resource availability.
- Manual bookings use the same conflict rules.
- Cancellation records include reason and actor: Patient, Master Admin, Sub-Admin, or Physiotherapist.

### 5.3 Packages, Family, Friends, and credit transfer

- Packages contain sessions or credit and have expiry rules.
- Family and Friends are separate relationship categories.
- Registered Family links require recipient confirmation; eligible Family Members may be booked for and may share package use subject to policy.
- Usage records identify the Family Member who received a session.
- Friends must be registered and must confirm the relationship.
- Users cannot book for Friends, and Friends cannot directly consume another user's package.
- Sharing with a Friend requires an explicit credit transfer.
- Transferred credit keeps the source package expiry.
- Transfer records include sender, recipient, amount/credit, source package, transfer date, and expiry.

### 5.4 Products and follow-up

- Product data includes name, price, active state, description, and one or more photos.
- High-resolution images are resized and compressed before storage.
- Users can see product photos with product information.
- Purchases record quantity, price snapshot, date, and notes.
- Follow-up can be based on last purchase and estimated consumption.

### 5.5 Announcements

- Authorized admins create product, clinic, schedule, or general announcements.
- Registered customers receive an app notification and can open the in-app announcement.
- Announcements require expiry and automatically leave active customer view after expiry.
- Kuya can withdraw an announcement before expiry.
- Admin history is retained.

### 5.6 Reports

Financial ad-hoc report filters:

| Filter | Default |
| --- | --- |
| Category | Services or Products; selected by user |
| From Date | First day of current month |
| To Date | Today |
| Service | All; visible only for Services |
| Product | All; visible only for Products |

- From Date cannot be later than To Date.
- Services reports list completed sessions; Products reports list sales.
- Include income/amount when recorded.
- Mobile sharing should preferably use PDF.

The Household report covers the main account and linked Family Members, while Friends appear separately only where transfers are relevant. It shows owner, Family Members, spending, active package, start/expiry, total/used/remaining balance, person-level usage, and relevant Friend transfers.

## 6. Core journeys

- Patient booking: authenticate -> service -> clinic -> date -> valid start time -> review -> confirm.
- Admin availability: authorized admin -> clinic/service/Physiotherapist/date -> publish or modify slots -> conflict check -> manage bookings.
- Physiotherapist: authenticate -> My Schedule -> assigned appointment -> permitted action -> audit/notification.
- Friend transfer: request -> recipient notification/confirmation -> active Friend link -> select transfer -> validate package/expiry -> transfer with same expiry -> both users see history.
- Product follow-up: record purchase -> set/calculate follow-up -> due list -> contact -> update status.

## 7. Appointment statuses

Available, Pending Approval, Confirmed, Rescheduled, Cancelled by Patient, Cancelled by Admin, Cancelled by Physiotherapist, Completed, and No-Show.

**Recommended MVP decision:** Automatically confirm published slots unless Kuya requires manual approval.

## 8. Business rules

| ID | Rule |
| --- | --- |
| BR-01 | Required registration verification precedes booking. |
| BR-02 | Secure forgotten-password reset is available. |
| BR-03 | Master Admin can deactivate users without deleting history. |
| BR-04 | Clinics with history are deactivated, not deleted. |
| BR-05 | Every appointment has a service with duration. |
| BR-06 | End time is calculated from start plus duration. |
| BR-07 | A Physiotherapist cannot have overlapping appointments. |
| BR-08 | A patient cannot have overlapping appointments. |
| BR-09 | Physiotherapists are selected from registered users, not free text. |
| BR-10 | Physiotherapists manage only assigned appointments unless additionally authorized. |
| BR-11 | Confirmed slots cannot be double-booked. |
| BR-12 | Cancellation includes a reason when required. |
| BR-13 | Package credit cannot be used after expiry. |
| BR-14 | Package deduction occurs after completion unless a transfer rule applies. |
| BR-15 | Family and Friends are separate. |
| BR-16 | Friend linking requires recipient notification and confirmation. |
| BR-17 | Friends cannot be booked for or directly use another user's package. |
| BR-18 | Friend credit transfer requires registered, confirmed Friends. |
| BR-19 | Transferred credit keeps the source expiry. |
| BR-20 | Product images are resized and compressed before storage. |
| BR-21 | Expired or withdrawn announcements leave customer view. |
| BR-22 | Only Master Admin appoints/removes Sub-Admins and Physiotherapists unless later changed. |
| BR-23 | One central permission profile applies to all Sub-Admins. |
| BR-24 | Financial report access depends on role and permission. |
| BR-25 | Important actions are audit logged. |

## 9. Technical data requirements

The conceptual model includes User, Role Assignment, central Sub-Admin Permission Config, Patient Profile, Family Link, Friend Link, Clinic, Service Type, Physiotherapist linked to User, Appointment Slot, Appointment, Package Definition, Patient Package, Package Usage, Package Credit Transfer, Product, Product Photo, Product Purchase, Follow-Up Record, Announcement, optional Financial Report Log, and Audit Log.

Key integrity requirements:

- User has verification and active status plus role assignments.
- Role assignments retain assigning actor, dates, active state, and removal history.
- Deactivation changes effective access without deleting business history.
- Appointment slots identify clinic, service, Physiotherapist, start/end, and availability.
- Transfers preserve sender, recipient, source package, quantity/unit, transfer date, and source expiry.
- Historical product purchases retain price snapshots.
- Audit records identify actor, action, affected record, timestamp, and before/after data where needed.

## 10. Navigation requirements

- Patient: Home, Book Appointment, My Appointments, My Packages, Family, Friends, Products, Announcements, Profile.
- Master/Sub-Admin: Dashboard, Calendar, Appointments, Patients/Users, Roles, Sub-Admin Permissions, Clinics, Services, Physiotherapists, Packages, Products, Product Sales, Follow-Up, Announcements, Reports, Settings, subject to permission.
- Physiotherapist: My Schedule, Appointment Details, future Notifications, Profile.

## 11. Non-functional requirements

- Authentication for private features and verified registration contact data.
- Server-side/effective role-based authorization for Master Admin, Sub-Admin, Physiotherapist, and Patient.
- Central permission control and least privilege.
- Privacy protection for personal, relationship, clinical-operational, package, product, and financial data.
- Auditability for roles, deactivation, booking, cancellation, transfer, product changes, and reports.
- Reliable conflict checking and date validation.
- Image optimization before product-photo storage.
- Secure backups of business-critical records.
- iOS and Android support and a simple patient booking experience.

## 12. MVP priorities

Must Have: account security/deactivation; service duration and booking logic; registered-user Physiotherapist role; conflict checks; appointment/cancellation management; packages/Family/Friend transfer; Master/Sub-Admin permission control; product catalogue/photos/purchases.

Should Have: announcements with notification/expiry and financial/household reports.

Could Have: Excel/CSV export, targeted announcements, and Physiotherapist push notifications.

## 13. Open questions

| ID | Question |
| --- | --- |
| Q-01 | Are all v0.7 requirements MVP, or should some be Phase 2? |
| Q-02 | Can a Physiotherapist also be a Sub-Admin? |
| Q-03 | Can a Physiotherapist create their own availability? |
| Q-04 | Can a Physiotherapist cancel/reschedule directly, or only request approval? |
| Q-05 | Are Friend transfers partial or full remaining credit only? |
| Q-06 | Is transfer measured in sessions, money, or both? |
| Q-07 | Can received credit be transferred onward? |
| Q-08 | Can Kuya reverse an erroneous transfer? |
| Q-09 | Do Sub-Admin permission changes take effect immediately? |
| Q-10 | Are announcements sent to all users or selected groups? |
| Q-11 | One main product photo or multiple photos? |
| Q-12 | How is service income recorded? |
| Q-13 | Is package income recognized at sale or session consumption? |
| Q-14 | PDF-only report sharing or future Excel/CSV? |
| Q-15 | Can Kuya reactivate a deactivated user? |

## 14. Risks and required decisions

- Role overlap may create conflicting permissions; confirm role hierarchy and composition.
- Friend transfer rules are incomplete; confirm quantity, unit, onward transfer, and reversal.
- Financial reports require a confirmed income-recognition source.
- Broad Sub-Admin access requires least-privilege defaults and per-permission tests.
- Product photos require enforced optimization.
- Physiotherapist schedule ownership requires final action boundaries.
- Notifications depend on platform permission and push infrastructure.

## 15. Recommended next requirements steps

1. Validate v0.7 internally.
2. Resolve Physiotherapist, Friend transfer, and reporting questions with Kuya.
3. Validate role assignment, credit-transfer lineage, audit, and report data requirements.
4. Prepare test scenarios for booking conflicts, deactivation, Friend confirmation/transfer, and reporting.
5. After decisions, convert unresolved items into detailed acceptance criteria.
