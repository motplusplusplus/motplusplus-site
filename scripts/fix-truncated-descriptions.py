#!/usr/bin/env python3
"""
Re-fetch full descriptions for events/artists truncated at exactly 3000 chars.
Uses entry-content extraction instead of full-page strip — no character limit.
"""
import requests, json, re, html, time, os

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
ROOT = os.path.join(os.path.dirname(__file__), '..')

def strip_html(s):
    s = re.sub(r'<style[^>]*>.*?</style>', ' ', s, flags=re.DOTALL)
    s = re.sub(r'<script[^>]*>.*?</script>', ' ', s, flags=re.DOTALL)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()

def fetch_full_body(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.status_code != 200:
            return None
        page = r.text
        # Try to extract just the article/post content — no length limit
        idx = page.find('entry-content')
        if idx > 0:
            chunk = page[idx:idx+50000]
            # Take up to the footer/comment section
            for cutoff in ['class="wp-block-post-comments', 'id="comments"', 'class="site-footer"', 'class="comments-area"']:
                ci = chunk.find(cutoff)
                if ci > 0:
                    chunk = chunk[:ci]
                    break
            body = strip_html(chunk)
            # Remove the class attribute blob at the start
            body = re.sub(r'^entry-content[\w\s\-]+?>\s*', '', body)
            if len(body) > 100:
                return body.strip()
        # Fallback: full page strip (no limit)
        body = strip_html(page)
        if len(body) > 100:
            return body
    except Exception as e:
        print(f"  fetch failed: {e}")
    return None

# ── Fix events-data.json ──────────────────────────────────────────────────────
events_path = os.path.join(ROOT, 'events-data.json')
with open(events_path) as f:
    events = json.load(f)

# Fix anything that was previously truncated (still ends at 3000) or was patched
# to a slightly shorter fallback. Re-run on all that were originally 3000.
# We track by checking if description ends abruptly (no sentence-ending punctuation at end)
def looks_truncated(s):
    if not s:
        return False
    s = s.rstrip()
    return not s.endswith(('.', '!', '?', '"', '\u201d', ')')) or len(s) >= 2990

truncated = [(i, e) for i, e in enumerate(events) if looks_truncated(e.get('description') or '')]
print(f"Events to fix: {len(truncated)}")

fixed = 0
for i, event in truncated:
    wp_link = event.get('wpLink') or ''
    if not wp_link:
        print(f"  SKIP {event['slug']} — no wpLink")
        continue
    print(f"  Fetching {event['slug']} ...")
    body = fetch_full_body(wp_link)
    if body and len(body) > (len(event.get('description') or '') - 50):
        events[i]['description'] = body
        print(f"    ✓ {len(body)} chars (was {len(event.get('description') or '')})")
        fixed += 1
    else:
        print(f"    ~ {len(body) if body else 0} chars — keeping current")
    time.sleep(0.35)

with open(events_path, 'w', encoding='utf-8') as f:
    json.dump(events, f, ensure_ascii=False, indent=2)
print(f"\nevents-data.json saved. Fixed {fixed} events.\n")

# ── Fix artists-data.json ─────────────────────────────────────────────────────
artists_path = os.path.join(ROOT, 'artists-data.json')
with open(artists_path) as f:
    artists = json.load(f)

event_by_slug = {e['slug']: e for e in events}
truncated_a = [(i, a) for i, a in enumerate(artists) if looks_truncated(a.get('bio') or '')]
print(f"Artists to fix: {len(truncated_a)}")

fixed_a = 0
for i, artist in truncated_a:
    slug = artist['slug']
    evt = event_by_slug.get(slug)
    if evt and evt.get('wpLink'):
        print(f"  Fetching {slug} ...")
        body = fetch_full_body(evt['wpLink'])
        if body and len(body) > (len(artist.get('bio') or '') - 50):
            artists[i]['bio'] = body
            print(f"    ✓ {len(body)} chars (was {len(artist.get('bio') or '')})")
            fixed_a += 1
        else:
            print(f"    ~ {len(body) if body else 0} chars — keeping current")
        time.sleep(0.35)
    else:
        print(f"  SKIP {slug} — no matching event with wpLink")

with open(artists_path, 'w', encoding='utf-8') as f:
    json.dump(artists, f, ensure_ascii=False, indent=2)
print(f"artists-data.json saved. Fixed {fixed_a} artists.")
