#!/usr/bin/env python3
"""
Post-process events-data.json:
- Remove 'Luke Schneider' from all text fields
- Remove placeholder/garbage entries
- Deduplicate by keeping the richer version of duplicate content
- Re-sort newest first
"""

import json, re, os

IN  = os.path.join(os.path.dirname(__file__), '..', 'events-data.json')
OUT = os.path.join(os.path.dirname(__file__), '..', 'events-data.json')

REMOVE_NAMES = ['Luke Schneider']

# Titles that should be removed (placeholders / non-events that slipped through)
REMOVE_TITLES = [
    'upcoming: exhibition name',
    'meet the residents',
    'programs',
    'residents',
    'news & events',
]

def clean_text(s):
    for name in REMOVE_NAMES:
        # Remove "Luke Schneider" with common surrounding patterns
        patterns = [
            rf'\b{re.escape(name)}\b,?\s*',
            rf',?\s*\b{re.escape(name)}\b',
        ]
        for p in patterns:
            s = re.sub(p, '', s, flags=re.IGNORECASE)
    # Clean up double spaces, trailing commas, etc.
    s = re.sub(r' {2,}', ' ', s)
    s = re.sub(r' ,', ',', s)
    s = re.sub(r', ,', ',', s)
    return s.strip()

def main():
    with open(IN, encoding='utf-8') as f:
        events = json.load(f)

    print(f"Input: {len(events)} events")

    cleaned = []
    seen_slugs = set()

    for e in events:
        slug  = e.get('slug', '')
        title = e.get('title', '')

        # Skip garbage entries
        if any(t in title.lower() for t in REMOVE_TITLES):
            print(f"  REMOVE (placeholder): {title[:60]}")
            continue

        # Deduplicate slugs — keep the one with more images
        if slug in seen_slugs:
            # Find existing entry, replace if this one has more images
            existing = next((x for x in cleaned if x['slug'] == slug), None)
            if existing and len(e.get('images', [])) > len(existing.get('images', [])):
                cleaned.remove(existing)
                seen_slugs.discard(slug)
            else:
                print(f"  DEDUP (fewer images): {title[:60]}")
                continue

        # Clean Luke Schneider from all text fields
        e['title']       = clean_text(e.get('title', ''))
        e['description'] = clean_text(e.get('description', ''))
        e['displayDate'] = clean_text(e.get('displayDate', ''))

        seen_slugs.add(slug)
        cleaned.append(e)

    # Re-sort newest first
    cleaned.sort(key=lambda e: e.get('dateISO', '2000-01-01'), reverse=True)

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    print(f"\nOutput: {len(cleaned)} events saved to events-data.json")
    removed = len(events) - len(cleaned)
    print(f"Removed: {removed} entries (placeholders + dupes)")

if __name__ == '__main__':
    main()
