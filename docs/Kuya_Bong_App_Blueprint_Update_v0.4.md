---
title: Kuya Bong Mobile App - Blueprint Update v0.4
document_version: "0.4"
status: For Internal Review and Stakeholder Discussion
tracking_number: KBA-BP-20260620-001
source_pdf: Kuya_Bong_App_Blueprint_Update_v0.4.pdf
supersedes_note: Additive update on top of Blueprint v0.3 (KBA-BP-20260615-001).
updated: 2026-06-20
---

# Kuya Bong App — Blueprint Update v0.4

**Additional Requirements from Latest Customer Meeting**

> Tracking number: KBA-BP-20260620-001
> Source: Extracted from `docs/Kuya_Bong_App_Blueprint_Update_v0.4.pdf`.
> This is an additive update; it builds on Blueprint v0.3 (Section 25 service/therapist/duration/cancellation rules).

---

## 1. Clinic Management

Kuya should be able to manage clinic records from the admin side of the app.

**Required capabilities:**
- Add a new clinic.
- Edit existing clinic details.
- Deactivate an existing clinic so it no longer appears for new bookings.
- Delete a clinic **only if** there are no appointments, bookings, sales, packages, or other records linked to it.

**Key rule:** If a clinic already has historical transactions, it must **not** be deleted — it should only be **deactivated** to protect historical records.

## 2. Announcements and Push Notifications

Kuya should be able to create announcements and push them to registered customers through app notifications.

**Examples:**
- Product promotion, e.g. "Buy one get one free".
- Clinic notice, e.g. "Clinic B is under maintenance".
- Schedule notice.
- General business update.

**Required capabilities:**
- Create announcement title and message.
- Push the announcement to registered customers.
- Set an expiry date.
- Automatically hide the announcement after the expiry date.
- Manually pull / unpublish an announcement before expiry.
- Keep announcement history for admin reference.

Customers should receive a notification and, when they open it, see the announcement inside the app.

## 3. Master Admin and Sub-Admin Roles

Kuya should be the **Master Admin** of the system.

**As Master Admin, Kuya can:**
- Appoint a registered user as Sub-Admin.
- Remove Sub-Admin access.
- Manage core system data such as clinics, therapists, services, and cancellation reasons.
- Access admin functions, reports, announcements, bookings, packages, and product records.

Sub-Admins can help with daily operational tasks, but they should **not** have full control.

**Sub-Admins cannot:**
- Add or remove other Sub-Admins.
- Remove or change Kuya's Master Admin access.
- Manage core master data such as clinics, therapists, services, and cancellation reasons.

**Key rule:** Only Kuya, as Master Admin, can control Sub-Admin access.

## 4. Financial Ad-Hoc Reports

Kuya should be able to generate financial reports from the mobile app.

**Filters:**

| Filter | Description |
| --- | --- |
| Category | Services or Products |
| From Date | Defaults to the first day of the current month |
| To Date | Defaults to today's date |
| Service | Appears only when Category = Services; default is All |
| Product | Appears only when Category = Products; default is All |

**Validation rule:** From Date must not be later than To Date.

**Report output:**
- If **Services** is selected, the report shows completed therapy sessions within the selected date range.
- If **Products** is selected, the report shows sold products within the selected date range.
- The report should include the related amount or income value if recorded in the system.

Kuya should be able to **share** the generated report from his mobile app, preferably as a **PDF** using the phone's standard share function.

## 5. Main Open Questions

Before updating the full blueprint, confirm:
1. Are these requirements part of the MVP or Phase 2?
2. Can Sub-Admins view financial reports?
3. Can Sub-Admins publish announcements, or only Kuya?
4. Should announcements go to all customers or selected customers only?
5. How should service income be recorded: manually, from a price list, or from package records?
6. Should report sharing be PDF only, or also Excel/CSV later?

## 6. Recommendation

These requirements should be added to the Product Concept and Solution Blueprint as **Version 0.4**.

**Recommended treatment:**
- Include clinic deactivation and controlled deletion.
- Include Master Admin and Sub-Admin access control.
- Include announcement creation if push notifications are part of the MVP.
- Include financial reporting if income data will be recorded in the app.
- Keep advanced targeting, multiple admin permission levels, Excel export, and online payment processing for a later phase unless Kuya specifically requires them now.
