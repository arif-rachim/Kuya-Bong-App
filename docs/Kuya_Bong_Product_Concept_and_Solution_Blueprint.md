---
title: Kuya Bong Mobile App - Product Concept and Solution Blueprint
document_version: "0.3"
status: For Internal Review and Stakeholder Discussion
tracking_number: KBA-BP-20260615-001
source_pdf: Kuya_Bong_Product_Concept_and_Solution_Blueprint.pdf
updated: 2026-06-15
---

# Kuya Bong Mobile App

Product Concept and Solution Blueprint

> Tracking number: KBA-BP-20260615-001
> Source: Extracted from `docs/Kuya_Bong_Product_Concept_and_Solution_Blueprint.pdf` on 2026-06-15.

## Page 1

KUYA BONG
MOBILE APP
Product Concept and Solution Blueprint

Document Version: 0.3 - Updated Draft with Service, Therapist, Duration, and Cancellation Rules
Status: For Internal Review and Stakeholder Discussion
Primary Audience: Developer and Systems Analyst
A structured foundation for GUI design, application planning,
and a client-facing solution presentation.

## Page 2

HOW TO USE THIS BLUEPRINT
This blueprint is designed for two working audiences. It distinguishes confirmed requirements from recommendations and open
questions so early design work can proceed without treating assumptions as final decisions.
Audience Primary Use
Developer Begin planning the application structure, database, user roles, workflows, and initial GUI
wireframes.
Systems Analyst Prepare a visual proposal and marketing package that demonstrates the client needs and
explains the proposed solution clearly.
DOCUMENT MAP
Sections Focus
1-5 Context, business problems, proposed solution, and objectives
6-7 MVP scope, user roles, and permissions
8-12 Core workflows and business concepts
13-15 Navigation, initial screens, and conceptual data model
16-18 Business rules, non-functional requirements, and MVP priorities
19-24 Client value, open questions, risks, next steps, and terminology

## Page 3

1. Document Purpose
This document defines the initial concept, business requirements, MVP scope, workflows, user roles, and proposed screen
structure for the Kuya Bong Mobile App.
The document is designed for two audiences:
Audience Primary Use
Developer Begin planning the application structure, database, user roles, workflows, and initial GUI wireframes.
Systems Analyst Prepare a visual proposal and marketing package that demonstrates an understanding of the client's
needs and explains the proposed solution clearly.
This document is not yet a final software specification. Open questions must be discussed with the client before development
decisions are finalized.
2. Business Background
Kuya Bong is an experienced physiotherapist and chiropractor who is well known in his city. Many patients visit him for
physiotherapy, muscle pain, body aches, chiropractic support, and massage-related services.
He operates his business under the name "Kuya Bong" and currently serves patients from two clinics.
The official clinic names have not yet been confirmed. For the purpose of this document, they will be referred to as:
- Clinic A
- Clinic B
The business currently has two main service areas:
Business Area Description
Physiotherapy and Massage
Services Patients book appointments before visiting a clinic for treatment.
Herbal and Supplement Sales Patients regularly purchase herbal products or supplements from Kuya Bong.
3. Business Problems
3.1 Appointment Booking Challenges
Kuya Bong has many patients, making appointment scheduling difficult to manage manually.
Patients may experience the following problems:
- Difficulty knowing which appointment slots are available.
- Confusion about whether the appointment is at Clinic A or Clinic B.
- Difficulty moving or cancelling an existing appointment.
- Forgetting appointment details after booking.
Kuya Bong may experience the following problems:
- Difficulty publishing and updating available time slots.
- Difficulty tracking who booked each slot.
- Difficulty handling bookings received through phone calls or direct messages.
- Difficulty confirming whether a session has been completed.
- Difficulty managing cancellations and rescheduling requests.
3.2 Treatment Package Tracking Challenges
Kuya Bong offers discounted treatment packages. For example, a patient may purchase a package that allows up to six
treatment sessions.
The current challenge is tracking:
- Which patient owns the package.
- How many sessions have already been used.
- How many sessions remain available.
- Whether the package has expired.
- Whether the package may be shared with family members.

## Page 4

- Which family member used each session.
3.3 Herbal and Supplement Follow-Up Challenges
Patients regularly purchase herbal products or supplements. Kuya Bong wants to know when a patient last purchased a product
so that he can follow up when the product may be close to finishing.
The initial requirement is not to operate a full online store. The priority is to record purchase history and support timely customer
follow-up.
4. Proposed Solution
The proposed solution is a single mobile application called the Kuya Bong App, published on:
- Apple App Store
- Google Play Store
The app will support both patients and Kuya Bong through a single downloadable application.
The app will use role-based access:
User Role Main Access
Patient Register, manage profile, view availability, book appointments, reschedule, cancel, view package
information, and manage linked family members.
Kuya Bong / Administrator
Manage clinics, publish appointment slots, manage bookings, record completed sessions, assign
treatment packages, link family members, manage the herbal and supplement catalogue including prices,
and record product purchases.
The MVP should not require separate mobile applications for patients and administrators.
5. Product Objectives
The initial app should:
1. Simplify appointment booking for patients.
2. Reduce confusion between Clinic A and Clinic B.
3. Allow Kuya Bong to publish and modify his weekly or monthly availability.
4. Allow Kuya Bong to view bookings by clinic, date, and time.
5. Support patient registration with verified contact details.
6. Allow patients to book, reschedule, and cancel appointments.
7. Allow Kuya Bong to create and assign discounted treatment packages.
8. Track treatment package usage, remaining balance, and expiry dates.
9. Allow treatment package usage to be shared with linked family members.
10.Record herbal and supplement purchase history for customer follow-up.
11.Allow patients to reset a forgotten password securely.
12.Allow Kuya Bong to manage a catalogue of herbal and supplement products, including product prices.
13.Create a foundation for future clinic expansion and payment features.
6. MVP Scope
6.1 Included in the MVP
Feature Area Included Capabilities
Single Mobile App One application for patients and Kuya Bong, with different access based on user role.
User Registration Patient registration using verified email address, verified mobile number, or both.
Login and Account Access Secure login and access to the correct role-based screens.
Password Reset Patients can securely reset a forgotten password.
Patient Profile Basic patient information and linked family information.
Clinic Information Display Clinic A and Clinic B, including editable clinic names.
Appointment Availability Kuya Bong can publish, edit, and remove appointment slots by clinic, date, and time.

## Page 5

Feature Area Included Capabilities
Appointment Booking Patients can search availability and reserve an appointment.
Booking Confirmation The system displays appointment confirmation, including clinic, date, and time.
Rescheduling Patients can move an appointment to another available slot.
Cancellation Patients and Kuya Bong can cancel appointments before the session.
Manual Booking Kuya Bong can create an appointment manually when a request is received by phone or another channel.
Reservation Approval Kuya Bong can manually approve a reservation when required.
Session Completion Kuya Bong can mark an appointment as completed after treatment.
Treatment Packages Kuya Bong can create packages with a defined number of sessions and validity period.
Package Assignment Kuya Bong can assign a package to a patient.
Package Usage Tracking The app tracks the number of sessions used, sessions remaining, expiry date, and family member usage.
Family Linking Adult patient accounts can be linked, such as spouses. Children can be added manually under a parent
account without creating their own login.
Herbal and Supplement
Catalogue Kuya Bong can create, edit, activate, deactivate, and price herbal or supplement products.
Herbal and Supplement
Purchase Records
Kuya Bong can record product purchases from the managed catalogue and review the patient's latest
purchase date.
Administrative Overview Kuya Bong can review appointments, patient records, packages, and supplement purchase history.
6.2 Outside the Current MVP Scope
Future Feature Notes
Online Payment Patients may pay through the app in a future release.
Treatment Service and
Package Price Management
Future price management for therapy services and treatment packages. Herbal and supplement catalogue
prices are included in the MVP.
New Clinic Creation The system should be designed with future growth in mind, but adding or closing clinics is outside the
current MVP scope.
Full E-Commerce Store Online ordering, checkout, delivery, and inventory management are not part of the current MVP.
Separate Staff Roles Receptionists, therapists, and branch managers are not yet confirmed as separate system users.
Advanced Marketing
Automation Automated sales campaigns and customer segmentation are not included unless added later.
7. User Roles and Permissions
7.1 Patient Role
Function Patient Access
Register and verify account Yes
Log in and update profile Yes
Reset forgotten password Yes
View clinic information Yes
Search available appointment
slots Yes
Select clinic, date, and time Yes
Book an appointment Yes

## Page 6

Function Patient Access
View booking confirmation Yes
Reschedule appointment Yes
Cancel appointment Yes
View appointment history Recommended
Link spouse or another adult
family account Yes
Add children under parent
account Yes
View package balance and
expiry date Recommended
View family package usage Recommended
Record herbal or supplement
purchases No
Manage appointment
availability No
Mark treatment sessions as
complete No
7.2 Kuya Bong / Administrator Role
Function Administrator Access
Log in as administrator Yes
Update clinic names Yes
Publish available appointment
slots Yes
Edit or remove appointment
slots Yes
View appointments by clinic,
date, and time Yes
View patient details Yes
Approve or reject reservation
requests Yes
Create manual bookings Yes
Reschedule or cancel
appointments Yes
Mark sessions as completed Yes
Create treatment package
definitions Yes
Assign packages to patients Yes
View package balance and
expiry date Yes
Link family members to a
package Yes
Manage herbal and
supplement catalogue Yes
Update herbal and supplement
prices Yes

## Page 7

Function Administrator Access
Record herbal and supplement
purchases Yes
Review latest patient purchase
dates Yes
Identify patients who may need
follow-up Recommended
8. Core User Journeys
8.1 Patient Registration and Booking Journey
Download App
v
Create Account
v
Verify Email Address and/or Mobile Number
v
Log In
v
Search Available Appointment Slots
v
Select Clinic
v
Select Date and Time
v
Review Booking Details
v
Submit Reservation
v
Receive Booking Confirmation
8.2 Administrator Availability Management Journey
Administrator Login
v
Open Availability Calendar
v
Select Clinic
v
Select Date or Date Range
v
Add Available Time Slots
v
Publish Availability
v
Review Incoming Bookings
v
Approve, Modify, or Cancel When Required
8.3 Completed Treatment Session Journey
Open Daily Appointment List
v
Select Patient Appointment
v
Confirm Patient Attendance
v
Mark Session as Completed
v
Check Whether a Package Applies
v
Deduct One Session from the Correct Patient or Family Package
v
Store Treatment History

## Page 8

8.4 Treatment Package Journey
Create Package Definition
v
Enter Package Name
v
Enter Number of Included Sessions
v
Enter Validity Period
v
Assign Package to Patient
v
Calculate Expiry Date
v
Optionally Link Eligible Family Members
v
Deduct Sessions After Completed Treatments
v
Prevent Usage After Balance Reaches Zero or Package Expires
8.5 Herbal and Supplement Follow-Up Journey
Open Product Catalogue
v
Select or Maintain Product and Price
v
Open Patient Record
v
Record Product Purchased
v
Record Purchase Date
v
Optionally Record Quantity and Notes
v
Review Last Purchase Date
v
Identify Patients for Follow-Up
v
Contact Patient Outside the App or Through a Future Notification Feature
9. Proposed Appointment Statuses
A clear appointment status model will help the developer avoid inconsistent booking behavior.
Status Description
Available Slot has been published and may be booked.
Pending Approval Patient requested the slot, but administrator approval is required.
Confirmed Reservation has been approved and the slot is reserved.
Rescheduled Original booking was moved to a new slot.
Cancelled by Patient Patient cancelled before the appointment.
Cancelled by Administrator Kuya Bong cancelled before the appointment.
Completed Treatment session has been delivered.
No-Show Patient did not attend the appointment. Recommended for discussion.
Recommended Decision
The client should confirm whether all bookings require manual approval or whether bookings should normally be confirmed
automatically when a slot is available.
A practical MVP approach is:
- Automatically confirm bookings for published slots.
- Allow Kuya Bong to manually modify, cancel, or create appointments.
- Use manual approval only when needed.

## Page 9

This reduces unnecessary administrative work.
10. Proposed Treatment Package Rules
Rule Initial Requirement
Package Name Administrator defines the package name.
Included Sessions Administrator defines the number of sessions, such as six sessions.
Assignment Administrator assigns the package to a patient.
Start Date Recorded when the package is assigned or activated.
Expiry Date Calculated using assignment date plus a defined number of days or months.
Session Deduction One session is deducted when an appointment is marked as completed.
Expired Package Remaining sessions cannot be used after the expiry date.
Zero Balance Package cannot be used when all sessions have been consumed.
Family Sharing Package may be shared with linked eligible family members.
Usage History Each deduction should record the patient, family member, appointment, clinic, date, and administrator
action.
Recommended Safeguard
Package deductions should not occur when an appointment is booked. The session should be deducted only after the treatment
is marked as completed.
This avoids incorrect balance reductions when a patient cancels or reschedules an appointment.
11. Family Account Concept
The app should support a simple family relationship model.
Family Member
Type Registration Requirement Proposed Handling
Adult Patient Own registered account Adult users may connect their accounts, such as spouses.
Child No separate app login required Parent adds the child manually under the parent account.
Other Dependent To be confirmed May be added manually if approved by Kuya Bong.
Suggested Family Linking Flow
Patient Opens Family Section
v
Selects "Link Adult Family Member" or "Add Child"
v
For Adult: Enter Registered Mobile Number or Email Address
v
Other Adult Receives Link Request
v
Other Adult Accepts Request
v
Family Relationship Becomes Active
For children:
Parent Opens Family Section
v
Selects "Add Child"
v
Enters Child Name and Basic Details
v

## Page 10

Child Appears Under Parent Account
v
Administrator Can Assign or Allow Shared Package Usage
12. Herbal and Supplement Tracking Concept
The MVP should provide a lightweight product catalogue and customer follow-up tool rather than a full e-commerce or inventory
system. Kuya Bong should be able to manage the herbal and supplement products he sells, including each product price.
Suggested Product Catalogue Record
Field Description
Product ID Unique internal identifier.
Product Name Name of herbal product or supplement.
Product Category Optional classification such as herbal or supplement.
Selling Price Current selling price managed by Kuya Bong.
Active Status Indicates whether the product is currently available for selection.
Notes Optional product description or usage notes.
Suggested Purchase Record
Field Description
Patient Person who purchased or received the product.
Product Product selected from the managed catalogue.
Unit Price at Time of Sale Stored price snapshot so historical records remain accurate after a future price change.
Purchase Date Date of purchase.
Quantity Optional but recommended.
Estimated Usage Duration Optional number of days.
Estimated Follow-Up Date Optional calculated date.
Notes Optional comments from Kuya Bong.
Follow-Up Status Optional: Not Due, Due, Contacted, or Completed.
Suggested Administrator View
Patient Product Unit Price Last Purchase Date Estimated Follow-
Up Date Follow-Up Status
This feature can later support reminders or notifications.
13. Proposed Mobile App Navigation
13.1 Patient Navigation
Main Menu Item Purpose
Home Show upcoming appointment, booking shortcut, clinic reminder, and package balance summary.
Book Appointment Search and reserve available time slots.
My Appointments View upcoming, completed, cancelled, and rescheduled appointments.

## Page 11

Main Menu Item Purpose
My Packages View package balance, expiry date, and family usage history.
Family Link spouse account and add children.
Clinics View Clinic A and Clinic B information.
Profile Update personal information, account settings, and password.
13.2 Administrator Navigation
Main Menu Item Purpose
Dashboard Show today's appointments, pending requests, and follow-up reminders.
Calendar Publish, edit, and review appointment slots.
Appointments Search and manage bookings by clinic, date, patient, and status.
Patients View patient profiles, family links, and appointment history.
Packages Create package types and assign packages to patients.
Products Manage the herbal and supplement catalogue, update prices, and record purchases.
Follow-Ups Review patients whose products may be close to finishing.
Clinics Update clinic names and view clinic configuration.
Settings Manage account and application settings.
14. Initial Screen List for GUI Design
14.1 Shared Screens
Screen Purpose
Splash Screen Display the Kuya Bong brand when the app opens.
Welcome Screen Introduce the app and provide login or registration options.
Login Screen Allow registered users to sign in.
Registration Screen Collect patient registration details.
Verification Screen Verify mobile number, email address, or both.
Forgot Password Screen Allow patients to securely reset a forgotten password.
Profile Screen View and update user information.
14.2 Patient Screens
Screen Purpose
Patient Home Dashboard Show upcoming booking, clinic details, package balance, and booking shortcut.
Clinic Selection Screen Choose Clinic A or Clinic B.
Availability Calendar View available dates and time slots.
Booking Review Screen Confirm selected clinic, date, and time.
Booking Confirmation Screen Display successful reservation details.
My Appointments Screen View upcoming and previous appointments.
Appointment Details Screen View clinic, time, status, and reschedule or cancellation options.

## Page 12

Screen Purpose
My Packages Screen View active, used, expired, and remaining package sessions.
Package Details Screen View expiry date and usage by family member.
Family Members Screen Link spouse or add children.
Add Child Screen Add a child without a separate login.
14.3 Administrator Screens
Screen Purpose
Administrator Dashboard Review today's schedule, bookings, pending actions, and follow-ups.
Availability Management
Screen Create and update appointment slots.
Appointment Management
Screen View and manage all appointments.
Manual Booking Screen Assign a slot to a patient manually.
Patient Search Screen Find registered patients.
Patient Profile Screen Review appointments, packages, family members, and product purchases.
Package Definition Screen Create and manage package templates.
Assign Package Screen Assign a package and configure validity.
Package Usage Screen Review deductions and remaining sessions.
Product Catalogue Screen Create, edit, activate, deactivate, and price herbal or supplement products.
Product Purchase Screen Record herbal or supplement purchases using products from the catalogue.
Follow-Up List Screen Review patients who may need to purchase products again.
Clinic Settings Screen Update Clinic A and Clinic B names.
15. High-Level Conceptual Data Model
The following illustration is intended as an initial guide for the developer.
USER
├── User ID
├── Role: Patient or Administrator
├── Name
├── Mobile Number
├── Email Address
└── Verification Status
PATIENT PROFILE
├── Patient ID
├── Linked User ID
├── Basic Patient Details
└── Family Group ID
FAMILY MEMBER
├── Family Member ID
├── Family Group ID
├── Name
├── Relationship Type
├── Linked User ID, if registered adult
└── Parent User ID, if child
CLINIC
├── Clinic ID
├── Clinic Name

## Page 13

├── Address
└── Active Status
APPOINTMENT SLOT
├── Slot ID
├── Clinic ID
├── Date
├── Start Time
├── End Time
└── Availability Status
APPOINTMENT
├── Appointment ID
├── Slot ID
├── Patient or Family Member ID
├── Booking Status
├── Booking Source: App or Manual
└── Completion Status
PACKAGE DEFINITION
├── Package Type ID
├── Package Name
├── Number of Sessions
└── Validity Period
PATIENT PACKAGE
├── Patient Package ID
├── Package Type ID
├── Owner Patient ID
├── Assignment Date
├── Expiry Date
├── Remaining Sessions
└── Package Status
PACKAGE USAGE
├── Usage ID
├── Patient Package ID
├── Appointment ID
├── Patient or Family Member ID
├── Usage Date
└── Recorded By
PRODUCT CATALOGUE
├── Product ID
├── Product Name
├── Category
├── Current Selling Price
├── Active Status
└── Notes
PRODUCT PURCHASE
├── Purchase ID
├── Patient ID
├── Product ID
├── Unit Price at Time of Sale
├── Purchase Date
├── Quantity
├── Estimated Follow-Up Date
└── Notes
16. Important Business Rules
ID Rule
BR-01 A patient must register and complete verification before booking an appointment.
BR-02 Each appointment slot must belong to a specific clinic, date, and time.
BR-03 A confirmed appointment slot cannot be booked by another patient.
BR-04 Patients may reschedule only to available slots.
BR-05 Patients and administrators may cancel appointments before the scheduled session, subject to the agreed

## Page 14

ID Rule
cancellation policy.
BR-06 Kuya Bong may create appointments manually for requests received by phone or other channels.
BR-07 Kuya Bong may mark a session as completed after treatment has been delivered.
BR-08 A treatment package must have a defined number of included sessions.
BR-09 A treatment package must have an expiry date.
BR-10 Package sessions cannot be used after the package expires, even when a balance remains.
BR-11 Package sessions should be deducted only after treatment completion.
BR-12 Package usage must identify which patient or family member received the session.
BR-13 Children may be linked to a parent account without creating their own app login.
BR-14 Adult family members should use their own verified accounts before linking profiles.
BR-15 Clinic names must be editable by the administrator.
BR-16 Product purchase records should store the patient, selected catalogue product, price at the time of sale,
and purchase date.
BR-17 A patient must be able to securely reset a forgotten password after identity verification.
BR-18 Kuya Bong must be able to create, edit, activate, deactivate, and update the price of herbal and
supplement products.
BR-19 Updating a catalogue price must not overwrite the price stored in historical purchase records.
17. Non-Functional Requirements
Because the app will contain personal information and treatment-related records, privacy and security are important.
Area Initial Requirement
Security Users must authenticate before accessing private information.
Verification Patient registration must include verified email address, verified mobile number, or both.
Account Recovery Forgotten-password reset must verify the patient identity before allowing a new password.
Role-Based Access Patients must not access administrator functions.
Privacy Personal data, family information, appointment history, and treatment package usage must be protected.
Auditability Important administrator actions should be recorded, including manual bookings, cancellations, package
assignments, and package deductions.
Reliability The system must prevent double booking.
Usability Booking should require only a small number of simple steps.
Performance Available time slots and confirmation screens should load quickly.
Scalability The design should allow more clinics and additional staff roles in future releases.
Platform Support The mobile app should be designed for both iOS and Android.
Backup Business-critical records should be backed up securely.
Notifications The app should support booking confirmations and appointment reminders, subject to confirmation of the
notification method.

## Page 15

18. Recommended MVP Priorities
Priority Feature Group Reason
Must Have Registration, verification, login, and patient
profile Patients need verified accounts before booking.
Must Have Clinic selection and appointment slot
management This addresses the main operational problem.
Must Have Booking, rescheduling, cancellation, and
confirmation These are the core patient journeys.
Must Have Administrator calendar and manual booking Kuya Bong needs to manage both app and phone requests.
Must Have Session completion status Required for accurate treatment tracking.
Must Have Package creation, assignment, balance, expiry,
and deduction This is a major business requirement.
Must Have Basic family linking Required for shared packages.
Must Have
Herbal and supplement catalogue, price
management, purchase recording, and last
purchase date
Supports product sales tracking and timely follow-up.
Should Have Appointment reminders Reduces forgotten sessions and clinic confusion.
Should Have Follow-up date and follow-up status for products Improves customer retention.
Should Have Appointment history and package usage history Improves transparency and support.
Could Have No-show tracking Useful for future operational analysis.
Could Have Dashboard charts and reports Helpful but not essential for the initial release.
19. Client-Facing Value Proposition
The Kuya Bong App will provide a simpler and more organized experience for both Kuya Bong and his patients.
For Patients
- Easily see available appointment slots.
- Select the correct clinic before booking.
- Receive clear appointment confirmation.
- Reschedule or cancel appointments more easily.
- View remaining treatment package sessions.
- Share eligible treatment packages with family members.
For Kuya Bong
- Publish availability for both clinics.
- Reduce booking confusion and manual scheduling effort.
- See who is booked by clinic, date, and time.
- Manage phone reservations in the same system.
- Track completed treatment sessions.
- Track package balances and expiry dates.
- Maintain the list and current selling prices of herbal and supplement products.
- Monitor herbal and supplement purchase history.
- Follow up with patients when products may be close to finishing.

## Page 16

20. Open Questions for Client Discussion
20.1 Business and Branding
ID Question
Q-01 What are the official names, addresses, and contact details of Clinic A and Clinic B?
Q-02 Is "Kuya Bong" the final app name and brand name?
Q-03 Does the client already have a logo, brand colors, and clinic photos?
20.2 Appointment Management
ID Question
Q-04 What is the standard appointment duration: 30 minutes, 45 minutes, 60 minutes, or variable?
Q-05 Does Kuya Bong provide treatment alone, or are other therapists involved?
Q-06 Should patients choose the service type, such as physiotherapy, chiropractic treatment, or massage?
Q-07 Should booking confirmation be automatic or require Kuya Bong's approval?
Q-08 How late may a patient cancel or reschedule an appointment?
Q-09 Should the app record no-shows?
Q-10 Should the patient receive reminders by push notification, SMS, email, or a combination?
Q-11 Can Kuya Bong block unavailable dates, breaks, and holidays?
20.3 Patient Registration
ID Question
Q-12 Which details are required during registration: full name, mobile number, email, date of birth, gender,
address, or emergency contact?
Q-13 Should verification use mobile OTP, email verification, or both?
Q-14 Can patients edit all profile information themselves, or must some changes be approved?
20.4 Treatment Packages
ID Question
Q-15 Can a patient have more than one active package at the same time?
Q-16 Does a package start on the assignment date, purchase date, or first completed treatment date?
Q-17 Can Kuya Bong manually add or restore package sessions when correcting a mistake?
Q-18 Can expired packages be extended manually?
Q-19 May all family members use the package automatically, or must Kuya Bong approve each family member?
Q-20 Can package sessions be used for all service types or only selected treatments?
20.5 Herbal and Supplement Records
ID Question
Q-21 Which herbal and supplement products should be loaded into the initial catalogue?
Q-22 Should the app record quantity, unit price, estimated usage duration, and follow-up date for each
purchase?

## Page 17

ID Question
Q-23 Should Kuya Bong receive reminders when a patient may need a new supply?
Q-24 Will patients be able to view their product purchase history?
Q-25 Is stock quantity or inventory tracking required in a future phase?
20.6 Administration and Future Growth
ID Question
Q-26 Will Kuya Bong be the only administrator during the MVP?
Q-27 Should receptionists or clinic staff have their own accounts?
Q-28 Does the client need a web-based administration portal in addition to the mobile app?
Q-29 Does the client currently use spreadsheets, calendars, messaging apps, or another system for bookings?
Q-30 Is data migration required from an existing patient list?
21. Risks and Dependencies
Risk or Dependency Impact Recommended Action
Booking approval
process is unclear GUI and workflow may need redesign later. Confirm whether reservations are automatic or manually
approved.
Appointment duration
is unknown Calendar and slot design cannot be finalized. Confirm standard and variable durations.
Family package rules
are incomplete Package deduction logic may be incorrect. Confirm who may share packages and whether approval is
required.
Staff structure is
unknown Administrator design may be too limited. Confirm whether receptionists or other therapists need access.
Notification channels
are unknown
Reminder implementation may change cost and
scope.
Decide whether to use push notifications, SMS, email, or a
combination.
Existing records are
unknown Manual migration effort may be underestimated. Ask whether patient and package records already exist in
spreadsheets or another system.
Health-related
information may be
stored
Privacy and security requirements may
increase.
Define the minimum data required for the MVP and avoid
collecting unnecessary sensitive information.
22. Recommended Next Steps
14.Review this document internally with the developer and systems analyst.
15.Conduct a structured discussion with Kuya Bong using the open questions in Section 20.
16.Confirm the MVP scope and identify which recommended features may be deferred.
17.Prepare low-fidelity wireframes for the patient booking flow and administrator calendar.
18.Define the appointment status rules and package deduction rules.
19.Confirm whether the MVP requires a web administration portal.
20.Create a revised Version 0.3 after stakeholder feedback.
21.Prepare a simple client-facing proposal using the approved workflows and screen concepts.
23. Initial Wireframe Focus
The developer should begin with the following priority screens:

## Page 18

Patient Flow
Welcome
-> Register
-> Verify Account
-> Patient Home
-> Select Clinic
-> Select Date
-> Select Time Slot
-> Review Reservation
-> Booking Confirmation
-> My Appointments
Administrator Flow
Administrator Login
-> Dashboard
-> Availability Calendar
-> Select Clinic
-> Add or Modify Slots
-> Review Bookings
-> Open Appointment
-> Confirm, Reschedule, Cancel, or Complete Session
Package Flow
Patients
-> Open Patient Profile
-> Assign Package
-> Set Sessions and Expiry Date
-> Link Eligible Family Members
-> Review Usage History
Herbal and Supplement Flow
Products
-> Manage Product Catalogue and Prices
-> Patients
-> Open Patient Profile
-> Record Product Purchase
-> Select Product and Confirm Price
-> Set Follow-Up Date
-> Review Follow-Up List
24. Working Terminology
Term Meaning
Patient Registered adult user receiving treatment or managing dependents.
Family Member Linked spouse, child, or approved dependent.
Clinic Physical location where treatment is delivered.
Slot A specific available appointment time at a clinic.
Appointment A reserved treatment session.
Package A prepaid or assigned bundle of treatment sessions.
Package Usage A completed treatment session deducted from a package.
Product Catalogue The managed list of herbal and supplement products sold by Kuya Bong, including current prices.
Product Purchase A recorded herbal or supplement transaction linked to a catalogue product.
Administrator Kuya Bong or an authorized business user managing the system.

## Page 19

END OF BLUEPRINT

## Page 20

25. Additional Confirmed Requirements - Service Types, Therapists,
Durations, and Cancellation Reasons
Purpose: This section adds the latest confirmed requirements to the blueprint. Some items were previously listed only as open
questions; they are now treated as confirmed MVP requirements because they directly affect booking logic, screen design, and
conflict checking.
Requirement Previously Mentioned? Updated Status
Manage service types Partially Previously an open question; now a
confirmed requirement.
Each service has a duration Partially Appointment duration was an open
question; now duration is linked to service
type.
Service duration affects booking slots No New scheduling rule that must be included
in booking logic.
Manage therapist names Partially Previously an open question; now a
confirmed requirement.
Prevent therapist conflict across clinics No New conflict-prevention rule.
Prevent patient double-booking Partially Now clarified to prevent overlapping
bookings across clinics, therapists, and
services.
Cancellation reason required No New requirement for patient and
administrator cancellation.
Manage cancellation reasons No New administrator master-data function.
Admin cancels after phone request Partially Admin cancellation existed; this offline-
phone scenario is now clarified.
25.1 Service Type Management
Kuya Bong should be able to manage the list of services offered by the clinic. Each appointment booking must be linked to a
selected service type.
Example Service Example Duration
Physiotherapy & Massage 3 hours
Grounding Machine Therapy 2 hours
The administrator should be able to:
- Add a new service type.
- Edit an existing service name.
- Activate or deactivate a service.
- Define the standard duration of each service.
- Update the duration when business rules change.
25.2 Service Duration and Booking Slot Logic
The duration of the selected service must affect appointment availability. The appointment end time should be calculated from
the selected start time plus the service duration.
Scenario Rule
Patient books Physiotherapy & Massage at 09:00 and duration is
3 hours
System reserves the therapist and clinic from 09:00 to 12:00.
Another patient tries to book the same therapist from 10:00 to
11:00
System must prevent the booking because the therapist is
already occupied.
The same patient tries to book another appointment from 10:00
to 11:00 at another clinic
System must prevent the booking because the patient already
has an overlapping appointment.

## Page 21

25.3 Therapist Management
Kuya Bong is currently the main therapist, but another therapist, such as his brother, may occasionally join. The system should
support therapist master data and therapist assignment to appointments.
The administrator should be able to:
- Add therapist names.
- Edit therapist names.
- Activate or deactivate therapists.
- Assign a therapist to an appointment.
- View appointments by therapist.
25.4 Conflict Prevention Rules
Conflict Type System Rule
Therapist conflict The same therapist cannot be assigned to overlapping
appointments, especially across different clinics.
Patient conflict The same patient cannot have overlapping appointments, even if
the clinic, therapist, or service type is different.
Clinic/resource conflict If clinic-level resource checking is required, the same
clinic/resource should not be double-booked for overlapping
service durations.
25.5 Cancellation Reason Management
When a patient cancels a reservation, the patient should be required to select a cancellation reason. Kuya Bong should be able
to manage the cancellation reason list.
Example Cancellation Reason
Patient is not available
Patient is sick
Emergency
Booked wrong clinic
Booked wrong date or time
Other
If “Other” is selected, the system may allow the patient or administrator to enter a short note.
25.6 Administrator Cancellation on Behalf of Patient
Kuya Bong should be able to cancel a reservation when the patient requests cancellation by phone or another offline channel.
- Open the appointment.
- Select “Cancel Appointment”.
- Select the cancellation reason.
- Optionally add an internal note.
- Save the cancellation.
The system should record that the cancellation was performed by the administrator, not directly by the patient.
25.7 Updated Booking Flow
Patient Opens Booking Screen
↓
Select Service Type
↓
System Identifies Required Duration
↓
Select Clinic
↓
Select Date
↓
System Shows Only Valid Available Start Times
↓
Patient Selects Time
↓

## Page 22

System Checks:
- Therapist availability
- Clinic/resource availability, if applicable
- Patient availability
- Slot duration availability
↓
Patient Reviews Booking Details
↓
System Confirms Reservation
25.8 Additional Business Rules

> Editorial note: the source PDF numbered these rules BR-17 through BR-27, which
> collides with BR-17/BR-18/BR-19 already defined in Section 16. They are renumbered
> here as BR-20 through BR-30 to keep every business-rule ID unique across the document.

Rule ID Business Rule
BR-20 Each appointment must be linked to a service type.
BR-21 Each service type must have a defined duration.
BR-22 The appointment end time should be calculated based on the
selected service duration.
BR-23 The same therapist cannot be assigned to overlapping
appointments.
BR-24 The same patient cannot have overlapping appointments.
BR-25 The system should check therapist availability before confirming
a booking.
BR-26 The system should check patient availability before confirming a
booking.
BR-27 Patient cancellation must include a cancellation reason.
BR-28 Kuya Bong can manage the master list of cancellation reasons.
BR-29 Kuya Bong can cancel an appointment on behalf of the patient
when the request is received by phone or another offline channel.
BR-30 The system should record who cancelled the appointment:
patient or administrator.
25.9 Recommended GUI Additions
Area Addition
Admin Settings Service Type Management screen.
Admin Settings Therapist Management screen.
Admin Settings Cancellation Reason Management screen.
Booking Flow Patient selects service type before selecting available time.
Booking Flow Available slots are filtered based on service duration.
Appointment Details Display service type, therapist, start time, end time, clinic, and
status.
Appointment Cancellation Cancellation reason selection field.
Admin Appointment Cancellation Cancellation reason and internal note fields.
Admin Calendar Filter by clinic, therapist, service type, date, and appointment
status.
25.10 Updated Appointment Data Requirements
Field Description
Appointment ID Unique appointment reference.
Patient ID Patient who booked the appointment.
Family Member ID If the appointment is for a linked family member.
Service Type ID Selected service.
Therapist ID Assigned therapist.
Clinic ID Selected clinic.
Start Time Appointment start time.

## Page 23

End Time Calculated based on service duration.
Appointment Status Available, confirmed, cancelled, completed, etc.
Cancellation Reason ID Required if appointment is cancelled.
Cancelled By Patient or administrator.
Cancellation Note Optional note.
Booking Source App, phone, manual admin entry, or other channel.
25.11 Impact on MVP Priority
Recommendation: treat these additions as MVP requirements, not future features. They directly affect the booking engine and
should be included before the developer finalizes appointment logic, slot generation, conflict checking, and calendar design.
