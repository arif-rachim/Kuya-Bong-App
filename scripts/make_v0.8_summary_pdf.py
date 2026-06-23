#!/usr/bin/env python3
"""Generate a sales-facing summary PDF of the v0.8 demo update for Raymond."""
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
    pdf.set_font("Helvetica", "B", 18); pdf.set_text_color(*GREEN); pdf.multi_cell(W, 8, txt)


def h2(txt):
    pdf.ln(2); pdf.set_font("Helvetica", "B", 12.5); pdf.set_text_color(*GREEN); pdf.multi_cell(W, 6.5, txt); pdf.ln(0.5)


def body(txt):
    pdf.set_font("Helvetica", "", 10.5); pdf.set_text_color(*DARK); pdf.multi_cell(W, 5.2, txt)


def small(txt):
    pdf.set_font("Helvetica", "", 9); pdf.set_text_color(*GREY); pdf.multi_cell(W, 4.6, txt)


def bullet(txt, label=None):
    pdf.set_x(18)
    if label:
        pdf.set_font("Helvetica", "B", 10.5); pdf.set_text_color(*DARK)
        pdf.cell(3, 5.2, chr(149)); pdf.cell(50, 5.2, label)
        pdf.set_font("Helvetica", "", 10.5); pdf.multi_cell(W - 53, 5.2, txt)
    else:
        pdf.set_font("Helvetica", "", 10.5); pdf.set_text_color(*DARK)
        pdf.cell(3, 5.2, chr(149)); pdf.multi_cell(W - 3, 5.2, txt)


# Header
h1("Kuya Bong App - Demo Update Summary")
pdf.set_font("Helvetica", "B", 11); pdf.set_text_color(*DARK)
cell(0, 6, "Version 0.8  -  Client Demo Build")
small(f"Prepared for: Raymond (Sales)    |    Date: {date.today():%d %b %Y}    |    Ref: KBA-BP-20260623-001")
pdf.ln(1)
body("This build adds package assignment initialization and correction controls. It lets Kuya enter packages "
     "that customers already bought offline, fix mistakes, and pull back a wrongly assigned package.")

# New in v0.8
h2("New in This Update (v0.8)")
bullet("When assigning a package, Kuya can set the starting 'Remaining Sessions' (defaults to the full count). "
       "This is used to enter an existing package a customer already bought offline - e.g. a 6-session package "
       "with only 3 left.", "Enter Existing Package")
bullet("Kuya can correct the remaining sessions on an assigned package at any time (for example to fix a "
       "data-entry mistake).", "Edit Remaining")
bullet("Kuya can pull back / delete a package that was assigned to the wrong patient.", "Remove Package")
bullet("Every initialize, edit, and pull-back is recorded in the Audit Log (who did it and the old/new value).",
       "Audit Trail")

# Already in the demo
h2("Already in the Demo (Earlier Updates)")
bullet("Physiotherapist login & 'My Schedule', user deactivation, clinics, services & booking, cancellation reasons.")
bullet("Packages, Family sharing, Friends + credit transfer, products with photos, purchases & follow-up.")
bullet("Announcements (e.g. 'Buy 2 Get 3' herbal promo), reports, household report, Sub-Admin permissions, audit log.")

# Demo accounts
h2("How to Demo (Login Accounts)")
rows = [
    ("Master Admin (Kuya)", "admin@reliefexpert.app", "admin123"),
    ("Sub-Admin (Erick)", "staff@reliefexpert.app", "staff123"),
    ("Physiotherapist (Dr. Lina)", "physio@reliefexpert.app", "physio123"),
    ("Patient (Maria)", "maria@example.com", "patient123"),
    ("Patient (Ahmed)", "ahmed@example.com", "patient123"),
]
pdf.ln(1)
pdf.set_font("Helvetica", "B", 9.5); pdf.set_fill_color(*GREEN); pdf.set_text_color(255, 255, 255)
cell(62, 6.5, "  Role", fill=True, ln=False)
cell(66, 6.5, "  Email", fill=True, ln=False)
cell(0, 6.5, "  Password", fill=True, ln=True)
fill = False
for r in rows:
    pdf.set_font("Helvetica", "", 9.5); pdf.set_text_color(*DARK); pdf.set_fill_color(*LIGHT)
    cell(62, 6.2, "  " + r[0], fill=fill, ln=False)
    cell(66, 6.2, "  " + r[1], fill=fill, ln=False)
    cell(0, 6.2, "  " + r[2], fill=fill, ln=True)
    fill = not fill
pdf.ln(1)
bullet("Log in as Kuya > Patients > open a patient > Assign Package, then set 'Remaining sessions' (e.g. 3 of 6).",
       "Enter existing")
bullet("On a listed package, use 'Edit remaining' to correct it, or 'Pull back' to remove a wrong one.", "Correct")

# Pending
h2("Pending / Next Phase")
bullet("Minor: clinic contact field and family parent/sibling labels.")
bullet("Real phone push, native PDF share, online payment, advanced promo/discount automation - Phase 2.")

pdf.ln(2)
small("Demonstration build with sample data and no live backend yet. Prepared by the development team.")

out = "docs/Kuya_Bong_App_Demo_Update_v0.8_Summary.pdf"
pdf.output(out)
print("WROTE", out)
