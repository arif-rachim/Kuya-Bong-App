---
title: Kuya Bong Mobile App - Blueprint Update v0.6
document_version: "0.6"
status: Current requirements update; open questions remain
tracking_number: KBA-BP-20260620-003
source_pdf: Kuya_Bong_App_Blueprint_Update_v0.6.pdf
supersedes: KBA-BP-20260620-002
updated: 2026-06-20
---

# Kuya Bong App - Blueprint Update v0.6

v0.6 is the current additive requirements update. Where its wording conflicts with v0.5, v0.6 takes precedence.

## 1. Clinic Management

- Add and edit clinics.
- Deactivate a clinic so it no longer appears for new bookings.
- Delete a clinic only when no appointments, bookings, sales, packages, or other historical records are linked to it.

**Business rule:** A clinic with historical transactions must not be deleted; it can only be deactivated.

## 2. Announcements and Push Notifications

- Create a title and message.
- Push the announcement to registered customers.
- Set an expiry date and automatically hide the announcement after expiry.
- Withdraw/unpublish an announcement before expiry.
- Retain announcement history for admin reference.

Targeting all users versus selected users remains an open question.

## 3. Product Photo Management

- Upload one or multiple product photos.
- Resize and compress high-resolution photos before storage.
- Display photos with product information.

**Technical rule:** Only optimized product images should be stored; unnecessarily large originals must not be retained as the serving asset.

## 4. Family Members

Family is a separate relationship category and may include spouse, child, parent, sibling, or another family member.

- A patient can add or link a family member.
- When the family member is already a registered user, the linked user must receive a notification and confirm before the relationship becomes active.
- Family can be used for booking on behalf of the family member.
- Family can share package usage when allowed.
- Package usage history must identify the family member who received each session.

**Business rule:** Family and Friends must remain separate relationship types.

## 5. Friends and Package Credit Transfer

### Friend linking

1. User A sends a Friend-link request to registered User B.
2. User B receives an app notification.
3. User B acknowledges and confirms the relationship.
4. The Friend link becomes active only after confirmation.

The same confirmation rule applies to Family links when both people are registered users.

### Friend usage restrictions

- A user cannot book a session on behalf of a Friend.
- A Friend cannot directly use another user's package.
- Package benefit sharing with a Friend must occur through a package-credit transfer.

### Package-credit transfer rules

- Both parties must be registered users and confirmed Friends.
- Transfers are bidirectional between confirmed Friends.
- Transferred credit retains the original package expiry date.
- The audit record must include sender, recipient, transferred amount, original package reference, and expiry date.

**Business rule:** No Friend transfer is allowed until registration and mutual relationship confirmation are complete.

## 6. Master Admin and Sub-Admin Permission Control

Kuya is the Master Admin and is the only user who can appoint or remove Sub-Admins. All Sub-Admins share one centrally configured permission profile controlled by Kuya.

The configuration panel must independently enable/disable:

1. Manage Booking - create, edit, or delete time-slot availability; when disabled, calendar access is view-only like a normal user.
2. Appointment Management - complete, cancel, or reschedule appointments and related operations.
3. Manage Clinics.
4. Manage Therapists.
5. Manage Patients - including assigning packages, recording purchases, and updating operational patient data.
6. Manage Products.
7. Manage Service Types.
8. Manage Cancellation Reasons.
9. Manage Announcements.
10. Manage Follow-Up List.
11. Generate Financial Reports - Services only.
12. Generate Financial Reports - Products/Sales only.

**Permission and audit rules:**

- Sub-Admins cannot appoint/remove Sub-Admins.
- Sub-Admins cannot change Master Admin access.
- Permission checks use the central profile for all Sub-Admins.
- Important Master Admin and Sub-Admin actions must be audit logged.

## 7. Financial Ad-Hoc Reports

| Filter | Requirement |
| --- | --- |
| Category | Services or Products |
| From Date | Defaults to the first day of the current month |
| To Date | Defaults to today |
| Service | Visible only for Services; defaults to All |
| Product | Visible only for Products; defaults to All |

- From Date must not be later than To Date.
- Services output shows completed therapy sessions in range.
- Products output shows sold products in range.
- Include the related amount/income when recorded.
- The report should be shareable from mobile, preferably as PDF.

## 8. Household Spending and Active Package Report

For this report, Household means the main patient account plus linked Family Members. Show:

- Account owner and linked family members.
- Total spending.
- Active package/subscription.
- Package start and expiry dates.
- Total, used, and remaining sessions.
- The family member associated with each used session.
- Relevant Friend credit transfers.

Friends are not household members; only their credit-transfer records are relevant to this report.

## 9. Open Questions

1. Can users transfer partial credit, or only the full remaining balance?
2. Is transferred credit measured in sessions, monetary value, or both?
3. Can received credit be transferred again to another Friend?
4. Can Kuya cancel or reverse a transfer?
5. Do Sub-Admin permission changes take effect immediately?
6. Are reports visible to Sub-Admins only when the corresponding Services or Products/Sales permission is enabled?
7. Are announcements pushed to all users or selected users?
8. Is report sharing PDF-only, or should Excel/CSV be added later?

Until these questions are decided, implementations must not invent irreversible business behavior. The data model should preserve original-package lineage and a complete transfer audit trail.

## 10. Supersession Summary

- Replace v0.5 **Trusted Contacts** with **Friends**.
- Keep Family and Friends separate.
- Family may support booking and direct package usage, subject to policy.
- Friends cannot be booked for and cannot directly consume another user's package.
- Friends may receive transferred package credit only after registration and relationship confirmation.
- Replace v0.4/v0.5 fixed Sub-Admin restrictions with one central, configurable permission profile applying to all Sub-Admins.
