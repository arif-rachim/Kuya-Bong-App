#!/usr/bin/env python3
"""Generate a sales-facing summary PDF of the v0.4 demo update for Raymond."""
from fpdf import FPDF
from datetime import date

GREEN = (21, 119, 43)
DARK = (28, 27, 27)
GREY = (90, 95, 95)
LIGHT = (240, 246, 241)

pdf = FPDF(format="A4")
pdf.set_auto_page_break(auto=True, margin=16)
pdf.add_page()
pdf.set_margins(16, 16, 16)
W = pdf.epw  # effective page width


def h1(txt):
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(*GREEN)
    pdf.multi_cell(W, 8, txt)
    pdf.ln(1)


def h2(txt):
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 12.5)
    pdf.set_text_color(*GREEN)
    pdf.multi_cell(W, 6.5, txt)
    pdf.ln(0.5)


def body(txt):
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(W, 5.2, txt)


def small(txt):
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*GREY)
    pdf.multi_cell(W, 4.6, txt)


def bullet(txt, label=None):
    pdf.set_x(18)
    if label:
        pdf.set_font("Helvetica", "B", 10.5)
        pdf.set_text_color(*DARK)
        pdf.cell(3, 5.2, chr(149))
        pdf.cell(38, 5.2, label)
        pdf.set_font("Helvetica", "", 10.5)
        pdf.multi_cell(W - 41, 5.2, txt)
    else:
        pdf.set_font("Helvetica", "", 10.5)
        pdf.set_text_color(*DARK)
        pdf.cell(3, 5.2, chr(149))
        pdf.multi_cell(W - 3, 5.2, txt)


# ---- Header ----
h1("Kuya Bong App - Demo Update Summary")
pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(*DARK)
pdf.cell(0, 6, "Version 0.4  -  Client Demo Build", ln=1)
small(f"Prepared for: Raymond (Sales)    |    Date: {date.today():%d %b %Y}    |    Ref: KBA-BP-20260620-001")
pdf.ln(1)
body("This update adds the features Kuya requested in the latest meeting. Everything below is live in the "
     "demo app and ready to show to customers.")

# ---- What's new ----
h2("What's New in This Update")

bullet("Kuya can add new clinics, edit their details, and deactivate a clinic so it stops taking new "
       "bookings. A clinic with existing history can't be deleted by mistake - it can only be deactivated, "
       "protecting past records.", "Clinic Management")
bullet("Kuya is the Master Admin. He can appoint a trusted staff member as a Sub-Admin to help with daily "
       "work (bookings, sessions, product sales, announcements, reports). Only Kuya controls who is an admin "
       "and the core settings (clinics, therapists, services, cancellation reasons).", "Admin & Sub-Admin")
bullet("Kuya can post announcements (promos, clinic notices, schedule changes) to customers. Each has an "
       "expiry date and hides automatically; he can also pull one early. Customers see a notification badge "
       "and read the message inside the app.", "Announcements")
bullet("Kuya can generate an ad-hoc report by date range - product sales (with income) or completed therapy "
       "sessions - and share it as a PDF from his phone.", "Financial Reports")

# ---- How to demo ----
h2("How to Demo (Login Accounts)")
small("Open the app and use the Login screen. The accounts are also listed on the login screen.")
# simple table
rows = [
    ("Master Admin (Kuya)", "admin@reliefexpert.app", "admin123"),
    ("Sub-Admin (Erick)", "staff@reliefexpert.app", "staff123"),
    ("Patient (Maria)", "maria@example.com", "patient123"),
    ("Patient (Ahmed)", "ahmed@example.com", "patient123"),
]
pdf.ln(1)
pdf.set_font("Helvetica", "B", 9.5)
pdf.set_fill_color(*GREEN)
pdf.set_text_color(255, 255, 255)
pdf.cell(55, 6.5, "  Role", border=0, fill=True)
pdf.cell(70, 6.5, "  Email", border=0, fill=True)
pdf.cell(0, 6.5, "  Password", border=0, fill=True, ln=1)
fill = False
for r in rows:
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(*DARK)
    pdf.set_fill_color(*LIGHT)
    pdf.cell(55, 6.2, "  " + r[0], border=0, fill=fill)
    pdf.cell(70, 6.2, "  " + r[1], border=0, fill=fill)
    pdf.cell(0, 6.2, "  " + r[2], border=0, fill=fill, ln=1)
    fill = not fill
pdf.ln(1)
small("Tip: To demo cancelling with a reason, open a patient's next-week appointment (Maria or Ahmed) - "
      "the Cancel button is enabled and asks for a cancellation reason.")

# ---- Pending / next phase ----
h2("Not Included Yet (Next Phase / Needs a Decision)")
bullet("Real phone push notifications - currently shown inside the app only (needs app-store build + "
       "notification service).")
bullet("Native phone 'share' for the PDF - currently uses the browser's Save-as-PDF.")
bullet("Income value for therapy services - services have no price yet, so the services report shows the "
       "session count only. (Products already show income.)")
bullet("Sending announcements to selected customers only, and Excel/CSV export - planned for later.")

# ---- Open questions ----
h2("Questions to Confirm with Kuya")
bullet("Are these features part of the MVP, or a later phase?")
bullet("How should service income be recorded (price list, per package, or manual)?")
bullet("Should announcements go to all customers or selected ones?")
bullet("Report sharing as PDF only, or also Excel/CSV later?")

pdf.ln(3)
small("This is a demonstration build (sample data, no live backend yet). Prepared by the development team for "
      "the client-facing demo.")

out = "docs/Kuya_Bong_App_Demo_Update_v0.4_Summary.pdf"
pdf.output(out)
print("WROTE", out)
