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

def extract_date(display: str, fallback: str) -> str:
    """Return YYYY-MM-DD from displayDate text, or fallback."""
    t = display.lower().strip()

    # "Month DD, YYYY" or "Month DD–DD, YYYY"
    m = re.search(
        r'(january|february|march|april|may|june|july|august|september|october|november|december|'
        r'jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)'
        r'[\s\-–—]+(\d{1,2})(?:[–—\-]\d{1,2})?[,\s]+(\d{4})',
        t, re.I
    )
    if m:
        mo = MONTHS[m.group(1).lower()]
        day = int(m.group(2))
        yr  = int(m.group(3))
        try:
            return date(yr, mo, day).isoformat()
        except ValueError:
            pass

    # "Month — Month YYYY" or "Month YYYY"
    m = re.search(
        r'(?:january|february|march|april|may|june|july|august|september|october|november|december|'
        r'jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)'
        r'(?:\s*[–—\-]\s*(?:january|february|march|april|may|june|july|august|september|october|november|december|'
        r'jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec))?\s+(\d{4})',
        t, re.I
    )
    if m:
        yr = int(m.group(1))
        # find which month(s) are mentioned; use the LAST one (end of range)
        all_months = re.findall(
            r'(january|february|march|april|may|june|july|august|september|october|november|december|'
            r'jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)',
            t, re.I
        )
        if all_months:
            mo = MONTHS[all_months[-1].lower()]
            return date(yr, mo, 1).isoformat()

    # bare YYYY
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
        if sd != e['dateISO']:
            changed += 1
        e['sortDate'] = sd

    events.sort(key=lambda e: e['sortDate'], reverse=True)

    with open(IN, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print(f"Re-sorted {len(events)} events by actual event date.")
    print(f"  {changed} events had sortDate different from dateISO.")
    print(f"\nFirst 10 after sort:")
    for e in events[:10]:
        print(f"  {e['sortDate']}  (pub:{e['dateISO']})  {e['title'][:55]}")
    print(f"\nLast 5 after sort:")
    for e in events[-5:]:
        print(f"  {e['sortDate']}  (pub:{e['dateISO']})  {e['title'][:55]}")


if __name__ == '__main__':
    main()
