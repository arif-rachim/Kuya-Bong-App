---
title: Kuya Bong Mobile App - Blueprint Update v0.5
document_version: "0.5"
status: Superseded by v0.6; retained for traceability
tracking_number: KBA-BP-20260620-002
source_pdf: Kuya_Bong_App_Blueprint_Update_v0.5.pdf
supersedes: KBA-BP-20260620-001
superseded_by: KBA-BP-20260620-003
updated: 2026-06-20
---

# Kuya Bong App - Blueprint Update v0.5

This update builds on v0.4. It retains clinic management, announcements, Master/Sub-Admin roles, and financial ad-hoc reports, and adds the requirements below.

## 1. Product Photo Management

- An admin can upload one or more photos for each product.
- High-resolution uploads must be resized and compressed before storage.
- Only optimized images should be stored.
- Product photos should appear with product names or product details.

**Business rule:** The system must not retain unnecessarily large product images.

## 2. Family Members

Family remains a distinct relationship category and may include spouse, child, parent, sibling, or another family member.

- A patient can add family members.
- A patient can book a session on behalf of a family member.
- A family member can use a shared package when permitted.
- Each package deduction must identify the family member who received the session.

## 3. Trusted Contacts (superseded by v0.6)

v0.5 introduced Trusted Contacts as a separate non-family category for friends, helpers, caregivers, or other trusted people. It proposed allowing booking and, subject to Kuya's approval, package use.

> **Superseded:** v0.6 replaces Trusted Contacts with **Friends** and explicitly prohibits booking on behalf of a Friend or direct Friend use of another user's package. See the v0.6 companion document.

## 4. Household Spending and Active Package Report

The report covers the main patient account and linked Family Members and shows:

- Main account owner and linked family members.
- Total spending.
- Active package/subscription.
- Package start and expiry dates.
- Total, used, and remaining sessions.
- The family member associated with each used session.

v0.5 proposed showing Trusted Contacts separately unless later included by decision. This point is superseded by v0.6, which instead includes relevant Friend credit transfers.

## 5. Requirements retained from v0.4

- Controlled clinic deletion and deactivation.
- Announcement publishing, expiry, withdrawal, and history.
- Master Admin appointment/removal of Sub-Admins.
- Financial reports for services and product sales, date validation, and PDF sharing preference.

## 6. v0.5 open questions

1. Are the additions MVP or Phase 2?
2. Can Sub-Admins view financial reports?
3. Can Sub-Admins publish announcements?
4. Are announcements sent to all or selected customers?
5. One main product photo or multiple photos?
6. Can Trusted Contacts use packages?
7. Does Trusted Contact package use require Kuya's approval?
8. Are Trusted Contacts included in household reporting or separate?
9. How is service income recorded?
10. Is report sharing PDF-only or should Excel/CSV follow?

Questions 2, 3, 6, 7, and 8 are materially reframed or superseded by v0.6.
