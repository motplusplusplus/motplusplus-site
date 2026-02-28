#!/usr/bin/env python3
"""
Re-sort events-data.json by actual event date extracted from displayDate.
Falls back to dateISO (publication date) when displayDate can't be parsed.
Writes a 'sortDate' field used for ordering, then sorts newest first.
"""
import json, os, re
from datetime import date

IN = os.path.join(os.path.dirname(__file__), '..', 'events-data.json')

MONTHS = {
    'january':1,'february':2,'march':3,'april':4,'may':5,'june':6,
    'july':7,'august':8,'september':9,'october':10,'november':11,'december':12,
    'jan':1,'feb':2,'mar':3,'apr':4,'jun':6,'jul':7,'aug':8,
    'sep':9,'sept':9,'oct':10,'nov':11,'dec':12,
}

MONTH_PAT = (
    r'(january|february|march|april|may|june|july|august|september|october|november|december|'
    r'jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)'
)


def safe_date(yr, mo, day=1) -> str | None:
    try:
        return date(int(yr), int(mo), int(day)).isoformat()
    except (ValueError, OverflowError):
        return None


def extract_date(display: str, fallback: str) -> str:
    """Return YYYY-MM-DD from displayDate text, or fallback."""
    t = display.strip()
    tl = t.lower()

    # ── Vietnamese: "D tháng M năm YYYY" ─────────────────────────────────────
    m = re.search(r'(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})', t, re.I)
    if m:
        d = safe_date(m.group(3), m.group(2), m.group(1))
        if d:
            return d

    # ── Vietnamese: "tháng M năm YYYY" (no day) ──────────────────────────────
    m = re.search(r'tháng\s+(\d{1,2})\s+năm\s+(\d{4})', t, re.I)
    if m:
        d = safe_date(m.group(2), m.group(1))
        if d:
            return d

    # ── DD/MM/YYYY  (Vietnamese numeric, pick the LAST occurrence in string) ─
    # e.g. "30/8/2025" or "30/7 & 2/8/2025" → take last DD/MM/YYYY group
    all_dmy = re.findall(r'(\d{1,2})/(\d{1,2})/(20\d{2})', t)
    if all_dmy:
        day, mo, yr = all_dmy[-1]
        d = safe_date(yr, mo, day)
        if d:
            return d

    # ── "D - D Month, YYYY" or "D Month, YYYY" (day-first English) ───────────
    # e.g. "14 - 21 December, 2019"  "24 November - 7 December, 2019"
    m = re.search(
        r'\d{1,2}\s*[–—\-]+\s*(\d{1,2})\s+' + MONTH_PAT + r'[,\s]+(\d{4})',
        tl, re.I
    )
    if m:
        # use end-day, month, year
        d = safe_date(m.group(3), MONTHS[m.group(2).lower()], m.group(1))
        if d:
            return d

    m = re.search(r'(\d{1,2})\s+' + MONTH_PAT + r'[,\s]+(\d{4})', tl, re.I)
    if m:
        d = safe_date(m.group(3), MONTHS[m.group(2).lower()], m.group(1))
        if d:
            return d

    # ── "Month DD, YYYY" or "Month DD - DD, YYYY" (English, space-sep range) ─
    m = re.search(
        MONTH_PAT + r'\s+(\d{1,2})(?:\s*[–—\-]+\s*\d{1,2})?\s*,?\s+(\d{4})',
        tl, re.I
    )
    if m:
        d = safe_date(m.group(3), MONTHS[m.group(1).lower()], m.group(2))
        if d:
            return d

    # ── "Month — Month YYYY" or "Month YYYY" (month-level precision) ─────────
    m = re.search(
        MONTH_PAT +
        r'(?:\s*[–—\-]+\s*' + MONTH_PAT + r')?\s+(\d{4})',
        tl, re.I
    )
    if m:
        yr = int(m.group(3))
        all_months = re.findall(MONTH_PAT, tl, re.I)
        if all_months:
            mo = MONTHS[all_months[-1].lower()]
            d = safe_date(yr, mo)
            if d:
                return d

    # ── bare YYYY ─────────────────────────────────────────────────────────────
    m = re.search(r'\b(20\d{2})\b', t)
    if m:
        return f"{m.group(1)}-01-01"

    return fallback


def main():
    with open(IN, encoding='utf-8') as f:
        events = json.load(f)

    changed = 0
    for e in events:
        sd = extract_date(e.get('displayDate', ''), e['dateISO'])
        if sd != e.get('sortDate'):
            changed += 1
        e['sortDate'] = sd

    events.sort(key=lambda e: e['sortDate'], reverse=True)

    with open(IN, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print(f"Re-sorted {len(events)} events by actual event date.")
    print(f"  {changed} sortDate values updated.")
    print(f"\nFirst 10 after sort:")
    for e in events[:10]:
        print(f"  {e['sortDate']}  {e['title'][:55]}")
    print(f"\nLast 5 after sort:")
    for e in events[-5:]:
        print(f"  {e['sortDate']}  {e['title'][:55]}")

    # Report remaining YYYY-01-01 placeholders (excluding bio slugs / bad scrapes)
    placeholders = [e for e in events if e['sortDate'].endswith('-01-01')]
    if placeholders:
        print(f"\nStill using YYYY-01-01 fallback ({len(placeholders)}):")
        for e in placeholders:
            print(f"  {e['sortDate']} | {e['displayDate'][:50]!r} | {e['slug']}")


if __name__ == '__main__':
    main()
