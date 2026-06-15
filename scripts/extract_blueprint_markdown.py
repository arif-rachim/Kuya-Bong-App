from __future__ import annotations

import pathlib
import re

import pypdf


PDF_PATH = pathlib.Path("docs/Kuya_Bong_Product_Concept_and_Solution_Blueprint.pdf")
MARKDOWN_PATH = pathlib.Path("docs/Kuya_Bong_Product_Concept_and_Solution_Blueprint.md")
TRACKING_NUMBER = "KBA-BP-20260615-001"
UPDATED_DATE = "2026-06-15"


def clean_page_text(text: str) -> str:
    text = re.sub(r"Internal Review Draft  \|  Version 0\.3  \|  Page\s*", "", text)
    text = re.sub(r"KUYA BONG APP  \|  PRODUCT BLUEPRINT\s*", "", text)
    text = text.replace("____________________________________________", "")

    cleaned: list[str] = []
    previous_blank = False
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            if not previous_blank:
                cleaned.append("")
            previous_blank = True
            continue

        previous_blank = False
        if line.startswith(""):
            line = "- " + line[1:].strip()
        cleaned.append(line)

    return "\n".join(cleaned).strip()


def main() -> None:
    reader = pypdf.PdfReader(str(PDF_PATH))
    pages = [clean_page_text(page.extract_text() or "") for page in reader.pages]
    body = "\n\n".join(
        f"## Page {index}\n\n{page}"
        for index, page in enumerate(pages, start=1)
        if page
    )

    content = f"""---
title: Kuya Bong Mobile App - Product Concept and Solution Blueprint
document_version: "0.3"
status: For Internal Review and Stakeholder Discussion
tracking_number: {TRACKING_NUMBER}
source_pdf: Kuya_Bong_Product_Concept_and_Solution_Blueprint.pdf
updated: {UPDATED_DATE}
---

# Kuya Bong Mobile App

Product Concept and Solution Blueprint

> Tracking number: {TRACKING_NUMBER}
> Source: Extracted from `docs/Kuya_Bong_Product_Concept_and_Solution_Blueprint.pdf` on {UPDATED_DATE}.

{body}
"""
    MARKDOWN_PATH.write_text(content, encoding="utf-8")
    print(f"Wrote {MARKDOWN_PATH}")
    print(f"Tracking number: {TRACKING_NUMBER}")
    print(f"Pages extracted: {len(reader.pages)}")


if __name__ == "__main__":
    main()
