#!/usr/bin/env python3
"""Generate a sales-facing summary PDF of the v0.6 demo update for Raymond."""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
from datetime import date

GREEN = (21, 119, 43)
DARK = (28, 27, 27)
GREY = (90, 95, 95)
LIGHT = (240, 246, 241)

pdf = FPDF(format="A4")
pdf.set_auto_page_break(auto=True, margin=16)
pdf.add_page()
pdf.set_margins(16, 16, 16)
W = pdf.epw


def cell(w, h, txt, fill=False, ln=True):
    pdf.cell(w, h, txt, border=0, fill=fill,
             new_x=(XPos.LMARGIN if ln else XPos.RIGHT),
             new_y=(YPos.NEXT if ln else YPos.TOP))


def h1(txt):
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(*GREEN)
    pdf.multi_cell(W, 8, txt)


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
        pdf.cell(45, 5.2, label)
        pdf.set_font("Helvetica", "", 10.5)
        pdf.multi_cell(W - 48, 5.2, txt)
    else:
        pdf.set_font("Helvetica", "", 10.5)
        pdf.set_text_color(*DARK)
        pdf.cell(3, 5.2, chr(149))
        pdf.multi_cell(W - 3, 5.2, txt)


# ---- Header ----
h1("Kuya Bong App - Demo Update Summary")
pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(*DARK)
cell(0, 6, "Version 0.6  -  Client Demo Build")
small(f"Prepared for: Raymond (Sales)    |    Date: {date.today():%d %b %Y}    |    Ref: KBA-BP-20260620-003")
pdf.ln(1)
body("This build adds the newest features from Kuya's latest meetings on top of the earlier demo. "
     "Everything below is live and ready to show.")

# ---- New in v0.6 ----
h2("New in This Update (v0.6)")
bullet("Add one or more photos to a product; the app automatically shrinks and compresses large images. "
       "Photos appear with the product.", "Product Photos")
bullet("Kuya (Master Admin) can appoint trusted staff as Sub-Admins and switch each of 12 capabilities on/off "
       "from one central panel (bookings, appointments, clinics, therapists, patients, products, services, "
       "cancellation reasons, announcements, follow-ups, and the two report types). Important admin actions are "
       "recorded in an Audit Log.", "Staff Access & Audit")
bullet("Friends are separate from Family. Confirmed friends can transfer treatment-package sessions to each "
       "other; transferred sessions keep the original expiry date and every transfer is logged. Kuya can reverse "
       "a transfer if it hasn't been used yet.", "Friends & Credit Transfer")
bullet("A per-household view: the account owner plus family members, total spending, the active package "
       "(start/expiry, sessions used/remaining), who used each session, and related friend transfers.",
       "Household Report")

# ---- Already in the demo ----
h2("Already in the Demo (Earlier Updates)")
bullet("Clinic management (add/edit/deactivate, safe delete), announcements with expiry, and financial reports "
       "(product income + completed-session counts) shareable as PDF.")
bullet("Service types & durations, therapist assignment, conflict-free booking, and cancellation reasons.")

# ---- How to demo ----
h2("How to Demo (Login Accounts)")
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
cell(55, 6.5, "  Role", fill=True, ln=False)
cell(70, 6.5, "  Email", fill=True, ln=False)
cell(0, 6.5, "  Password", fill=True, ln=True)
fill = False
for r in rows:
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(*DARK)
    pdf.set_fill_color(*LIGHT)
    cell(55, 6.2, "  " + r[0], fill=fill, ln=False)
    cell(70, 6.2, "  " + r[1], fill=fill, ln=False)
    cell(0, 6.2, "  " + r[2], fill=fill, ln=True)
    fill = not fill
pdf.ln(1)
bullet("Log in as Maria and Ahmed, add each other as Friends, confirm, then transfer package sessions. "
       "Reverse it from Master Admin > Settings > Credit Transfers.", "Friends/transfer")
bullet("Log in as Erick to show the limited menu; as Kuya, change permissions in Settings > Sub-Admins.", "Staff access")
bullet("Master Admin > Settings > Household Report / Audit Log.", "Reports")

# ---- Pending ----
h2("Pending Decisions / Next Phase")
bullet("Transfer rules to confirm with Kuya: partial vs full, sessions vs money, re-transfer allowed, reversal "
       "policy (demo currently: partial, sessions, re-transfer allowed, Kuya-reversible).")
bullet("Real phone push notifications and native phone PDF share (demo uses in-app + browser Save-as-PDF).")
bullet("Service income value, sending announcements to selected customers, and Excel/CSV export.")

pdf.ln(2)
small("Demonstration build with sample data and no live backend yet. Prepared by the development team.")

out = "docs/Kuya_Bong_App_Demo_Update_v0.6_Summary.pdf"
pdf.output(out)
print("WROTE", out)
