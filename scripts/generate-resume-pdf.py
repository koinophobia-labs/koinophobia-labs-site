#!/usr/bin/env python3
"""Generate public/resume/Blake-Taylor-Resume.pdf from lib/resume.json.

The web page (app/resume/page.tsx) and this PDF read the same
lib/resume.json so the two never drift apart.

Requires: pip install reportlab
Usage: python3 scripts/generate-resume-pdf.py
"""
import json
import os

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = json.load(open(os.path.join(ROOT, "lib", "resume.json")))
OUT = os.path.join(ROOT, "public", "resume", "Blake-Taylor-Resume.pdf")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

PW, PH = letter
MARGIN = 0.7 * inch
BODY_W = PW - 2 * MARGIN
INK = HexColor("#16181d")
MUTED = HexColor("#4a4f58")
GOLD = HexColor("#8a6d1f")  # print-safe warm gold, AA on white
RULE = HexColor("#d8d3c4")

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("Blake Taylor — Résumé")
c.setAuthor("Blake Taylor")
c.setSubject(DATA["headline"])
c.setCreator("koinophobia.dev")

y = PH - MARGIN


def wrap(text, font, size, width):
    words = text.split()
    lines, line = [], ""
    for w in words:
        probe = f"{line} {w}".strip()
        if c.stringWidth(probe, font, size) <= width:
            line = probe
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def para(text, font, size, leading, color=INK, width=BODY_W, x=MARGIN):
    global y
    c.setFont(font, size)
    c.setFillColor(color)
    for ln in wrap(text, font, size, width):
        c.drawString(x, y, ln)
        y -= leading


def section(title):
    global y
    y -= 3
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MARGIN, y, title.upper())
    y -= 5
    c.setStrokeColor(RULE)
    c.setLineWidth(0.8)
    c.line(MARGIN, y, PW - MARGIN, y)
    y -= 10


def continuation_page():
    global y
    c.showPage()
    y = PH - MARGIN
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN, y, "BLAKE TAYLOR")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    c.drawRightString(PW - MARGIN, y, "RESUME · PAGE 2")
    y -= 18


def link_row(items):
    """Centered row of clickable links separated by dots."""
    global y
    font, size = "Helvetica", 9.5
    sep = "   ·   "
    total = sum(c.stringWidth(t, font, size) for t, _ in items) + c.stringWidth(sep, font, size) * (len(items) - 1)
    x = (PW - total) / 2
    c.setFont(font, size)
    for i, (text, href) in enumerate(items):
        w = c.stringWidth(text, font, size)
        c.setFillColor(GOLD if href else MUTED)
        c.drawString(x, y, text)
        if href:
            c.linkURL(href, (x, y - 2, x + w, y + size), relative=0)
        x += w
        if i < len(items) - 1:
            c.setFillColor(MUTED)
            c.drawString(x, y, sep)
            x += c.stringWidth(sep, font, size)
    y -= 14


# ---- Header ----
c.setFillColor(INK)
c.setFont("Helvetica-Bold", 24)
c.drawCentredString(PW / 2, y - 8, DATA["name"].upper())
y -= 26
c.setFillColor(GOLD)
c.setFont("Helvetica-Bold", 12)
c.drawCentredString(PW / 2, y, DATA["headline"])
y -= 18

contact = DATA["contact"]
link_row([
    (contact["location"], None),
    (contact["email"], f"mailto:{contact['email']}"),
    ("linkedin.com/in/bt77", contact["linkedin"]),
    ("github.com/koinophobia-labs", contact["github"]),
    ("koinophobia.dev", contact["site"]),
])

# ---- Summary ----
section("Summary")
para(DATA["summary"], "Helvetica", 10, 12.8)

# ---- Experience ----
section("Experience")
for role in DATA["experience"]:
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN, y, f"{role['title']} — {role['org']}")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(MUTED)
    c.drawRightString(PW - MARGIN, y, f"{role['location']} · {role['dates']}")
    y -= 13
    for b in role["bullets"]:
        c.setFillColor(INK)
        c.setFont("Helvetica", 10)
        first = True
        for ln in wrap(b, "Helvetica", 10, BODY_W - 14):
            c.drawString(MARGIN + 14, y, ln)
            if first:
                c.circle(MARGIN + 5, y + 3, 1.2, stroke=0, fill=1)
                first = False
            y -= 12
        y -= 0.4
    y -= 5

# ---- Projects ----
section("Projects")
for p in DATA["projects"]:
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10.5)
    label = p["name"]
    c.drawString(MARGIN, y, label)
    if p.get("url"):
        w = c.stringWidth(label, "Helvetica-Bold", 10.5)
        c.linkURL(p["url"], (MARGIN, y - 2, MARGIN + w, y + 10), relative=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica", 8.5)
        c.drawString(MARGIN + w + 8, y + 0.5, p["url"].replace("https://", ""))
    y -= 11
    para(p["blurb"], "Helvetica", 9.5, 11.5)
    y -= 3

# ---- Education ----
continuation_page()
section("Education")
for ed in DATA["education"]:
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN, y, ed["school"])
    c.setFont("Helvetica", 9.5)
    c.setFillColor(MUTED)
    c.drawRightString(PW - MARGIN, y, ed["graduation"])
    y -= 15
    para(ed["degree"], "Helvetica-Bold", 10.5, 13)
    para(f"Track: {ed['track']}", "Helvetica", 10, 13)
    para(f"Minors: {', '.join(ed['minors'])}", "Helvetica", 10, 13)

# ---- Research & Publication ----
section("Research & Publication")
for publication in DATA["publications"]:
    para(publication["title"], "Helvetica-Bold", 11, 14)
    para(publication["author"], "Helvetica-Bold", 10, 13)
    para(f"{publication['institution']} · {publication['date']}", "Helvetica", 9.5, 12, MUTED)
    y -= 3

# ---- Skills ----
section("Skills")
for group in DATA["skills"]:
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    label = f"{group['label']}:  "
    c.drawString(MARGIN, y, label)
    lw = c.stringWidth(label, "Helvetica-Bold", 10)
    c.setFont("Helvetica", 10)
    for ln in wrap(", ".join(group["items"]), "Helvetica", 10, BODY_W - lw):
        c.drawString(MARGIN + lw, y, ln)
        y -= 12
    y -= 1

c.showPage()
c.save()
print(f"wrote {OUT}  (page 2 y ended at {y:.0f}pt — must stay > {MARGIN:.0f})")
