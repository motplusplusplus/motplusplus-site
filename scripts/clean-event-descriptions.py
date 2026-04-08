#!/usr/bin/env python3
"""
Clean event descriptions in events-data.json:
1. Strip "English Tiếng Việt" / "English | Tiếng Việt" nav artifacts (WP tab relics)
2. Merge -vn duplicate events as vnDescription on their canonical
3. Remove email addresses and contact boilerplate
4. Decode HTML entities
5. Trim trailing/leading whitespace and excess blank lines

Run with --dry-run to preview changes without saving.
Run with --apply to save changes.
"""

import json, re, html, sys, os

DRY_RUN = "--apply" not in sys.argv
if DRY_RUN:
    print("DRY RUN — pass --apply to save changes\n")

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path  = os.path.join(script_dir, '..', 'events-data.json')

with open(json_path, encoding='utf-8') as f:
    data = json.load(f)

# Index by slug for fast lookup
by_slug = {e['slug']: e for e in data}

# ─── Cleaning helpers ──────────────────────────────────────────────────────────

BILINGUAL_PREFIXES = [
    r'^English\s*\|\s*Tiếng Việt\s*',
    r'^English\s+Tiếng Việt\s*',
    r'^English\s*$',
]

def strip_bilingual_prefix(text):
    for pat in BILINGUAL_PREFIXES:
        text = re.sub(pat, '', text, flags=re.IGNORECASE)
    return text.strip()

def decode_entities(text):
    # Decode HTML entities
    text = html.unescape(text)
    # Clean up leftover &amp; artefacts (double-encoded)
    text = text.replace('&amp;', '&')
    return text

EMAIL_BOILERPLATE_PATTERNS = [
    # "contact us on info@... for an appointment"
    r'[,.]?\s*[Cc]ontact us (?:on|at) \S+@\S+ [^.]*\.',
    # "please contact info@..."
    r'[Pp]lease contact \S+@\S+[^.]*\.',
    # Standalone email address on its own line
    r'\n\s*\S+@\S+\s*\n',
    # "or email info@..."
    r'[Oo]r (?:email|write to) \S+@\S+[^.]*\.',
    # "email: info@..."
    r'[Ee]mail:\s*\S+@\S+',
]

LOCATION_BOILERPLATE_PATTERNS = [
    # Old standard MoT+++ venue address
    r'[Ll]ocation:\s*Saigon Domaine,?\s*Ground [Ff]loor,?\s*1057 Bình Quới[^$\n]*',
    r'[Ll]ocation:\s*Saigon Domaine,?\s*Ground [Ff]loor,?\s*1057 Binh Quoi[^$\n]*',
    r'[Ll]ocation:\s*Ground floor, Saigon Domaine[^$\n]*',
]

def remove_boilerplate(text):
    for pat in EMAIL_BOILERPLATE_PATTERNS + LOCATION_BOILERPLATE_PATTERNS:
        text = re.sub(pat, '', text)
    return text

def clean_whitespace(text):
    # Collapse 3+ newlines to 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip leading/trailing whitespace on each line
    lines = [l.rstrip() for l in text.split('\n')]
    text = '\n'.join(lines)
    return text.strip()

def clean_description(text):
    if not text:
        return text
    text = decode_entities(text)
    text = strip_bilingual_prefix(text)
    text = remove_boilerplate(text)
    text = clean_whitespace(text)
    return text

# ─── Identify -vn events and their canonicals ─────────────────────────────────

CANONICAL_OVERRIDES = {
    'tuan-mami-amp-cam-xanh-artist-presentations-performance-plus-2019-vn':
        'tuan-mami-cam-xanh-artist-presentations-performance-plus-2019',
}

vn_events = [e for e in data if e['slug'].endswith('-vn')]
vn_merges = []
for vn in vn_events:
    canonical_slug = CANONICAL_OVERRIDES.get(vn['slug']) or vn['slug'][:-3]
    canonical = by_slug.get(canonical_slug)
    if canonical:
        vn_merges.append((vn, canonical))
    else:
        print(f"WARNING: No canonical found for {vn['slug']}")

# ─── Apply changes ─────────────────────────────────────────────────────────────

changes = []
vn_slugs_to_hide = set()

# 1. Merge -vn descriptions into their canonicals
for vn, canonical in vn_merges:
    vn_desc = clean_description(vn.get('description', ''))
    vn_title = vn.get('title', '') or ''

    old_vn_desc = canonical.get('vnDescription', '')
    old_vn_title = canonical.get('vnTitle', '')

    changed = False
    if vn_desc and vn_desc != old_vn_desc:
        changes.append(f"MERGE VN DESC: {canonical['slug']}")
        if not DRY_RUN:
            canonical['vnDescription'] = vn_desc
        changed = True
    if vn_title and vn_title != canonical.get('title', '') and vn_title != old_vn_title:
        changes.append(f"  vnTitle: {vn_title[:60]}")
        if not DRY_RUN:
            canonical['vnTitle'] = vn_title

    vn_slugs_to_hide.add(vn['slug'])

# 2. Clean descriptions on all JSON-only events
sanity_slugs_path = os.path.join(script_dir, 'sanity-slugs.json')
sanity_slugs = set()
if os.path.exists(sanity_slugs_path):
    with open(sanity_slugs_path) as f:
        sanity_slugs = set(json.load(f))

for e in data:
    slug = e['slug']
    # Clean description
    orig_desc = e.get('description', '')
    if orig_desc:
        cleaned = clean_description(orig_desc)
        if cleaned != orig_desc:
            changes.append(f"CLEAN DESC: {slug}")
            if DRY_RUN:
                # Show diff preview
                orig_preview = orig_desc[:120].replace('\n', '↵')
                new_preview  = cleaned[:120].replace('\n', '↵')
                if orig_preview != new_preview:
                    changes.append(f"  BEFORE: {orig_preview}")
                    changes.append(f"  AFTER:  {new_preview}")
            else:
                e['description'] = cleaned

    # Clean vnDescription too
    orig_vn = e.get('vnDescription', '')
    if orig_vn:
        cleaned_vn = clean_description(orig_vn)
        if cleaned_vn != orig_vn:
            changes.append(f"CLEAN VN DESC: {slug}")
            if not DRY_RUN:
                e['vnDescription'] = cleaned_vn

    # Clean title HTML entities
    orig_title = e.get('title', '')
    if orig_title:
        cleaned_title = html.unescape(orig_title)
        if cleaned_title != orig_title:
            changes.append(f"CLEAN TITLE: {slug} — {cleaned_title[:60]}")
            if not DRY_RUN:
                e['title'] = cleaned_title

# ─── Print summary ─────────────────────────────────────────────────────────────

print(f"Total changes: {len([c for c in changes if not c.startswith('  ')])}")
print()
for c in changes:
    print(c)

if not DRY_RUN:
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {json_path}")
    print(f"\n-vn events to add to HIDDEN_SLUGS (if not already there):")
    for s in sorted(vn_slugs_to_hide):
        print(f"  '{s}',")
else:
    print(f"\n-vn events that will have their desc merged into canonical:")
    for vn, canonical in vn_merges:
        print(f"  {vn['slug']} → {canonical['slug']}")
    print(f"\nRun with --apply to save.")
