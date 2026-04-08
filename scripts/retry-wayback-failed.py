#!/usr/bin/env python3
"""
Retry Wayback fetches that failed in scrape-wayback-motplus-xyz.py.
Reads scripts/wayback-failed-slugs.json, retries each one, updates events-data.json.

Usage:
  python3 scripts/retry-wayback-failed.py [--dry-run]
"""

import requests, json, re, boto3, time, os, html, sys
from datetime import datetime

# ─── Config (same as main scraper) ───────────────────────────────────────────

R2_BASE     = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"
R2_BUCKET   = "site-general"
R2_ENDPOINT = "https://31a35595add67ae1366b3f6420432773.r2.cloudflarestorage.com"
R2_KEY      = "83343e12beb2f0aed8d48bc3047814a2"
R2_SECRET   = "8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56"

WAYBACK = "https://web.archive.org"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
CDX_API = f"{WAYBACK}/cdx/search/cdx"

DRY_RUN = "--dry-run" in sys.argv

# ─── Helpers (duplicated from main scraper) ───────────────────────────────────

def wayback_fetch(timestamp, original, retries=4):
    url = f"{WAYBACK}/web/{timestamp}/{original}"
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=40)
            if r.status_code == 429:
                wait = 60 * (attempt + 1)
                print(f"    Rate limited — waiting {wait}s...")
                time.sleep(wait)
                continue
            if r.status_code == 200:
                return r.text
            print(f"    HTTP {r.status_code} — attempt {attempt+1}/{retries}")
        except Exception as e:
            print(f"    Fetch error: {e}")
        time.sleep(5 * (attempt + 1))
    return None

def strip_html(s):
    s = re.sub(r'<style[^>]*>.*?</style>', ' ', s, flags=re.DOTALL)
    s = re.sub(r'<script[^>]*>.*?</script>', ' ', s, flags=re.DOTALL)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()

def extract_title(page_html):
    for pattern in [
        r'<h1[^>]*class="[^"]*(?:entry-title|post-title)[^"]*"[^>]*>(.*?)</h1>',
        r'<h1[^>]*>(.*?)</h1>',
        r'<title>(.*?)(?:\s*[|\-–].*)?</title>',
    ]:
        m = re.search(pattern, page_html, re.DOTALL | re.IGNORECASE)
        if m:
            t = strip_html(m.group(1)).strip()
            if t and len(t) < 200:
                return t
    return ""

def extract_date_from_url(original_url):
    m = re.search(r'/(20\d{2})/(\d{2})/(\d{2})/', original_url)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return None

def extract_date(page_html):
    for pattern in [
        r'<time[^>]*datetime="(\d{4}-\d{2}-\d{2})',
        r'"datePublished":\s*"(\d{4}-\d{2}-\d{2})',
    ]:
        m = re.search(pattern, page_html, re.IGNORECASE)
        if m:
            return m.group(1)[:10]
    return None

def extract_description(page_html):
    m = re.search(r'<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>(.*?)</div\s*>', page_html, re.DOTALL | re.IGNORECASE)
    if m:
        text = strip_html(m.group(1))
        if len(text) > 80:
            return text[:3000]
    return ""

def extract_images(page_html, wayback_ts):
    patterns = [
        r'/web/\d+/https?://(?:motplus\.xyz|motplusplusplus\.com)/wp-content/uploads/[^\s"\'<>?#]+',
        r'https?://(?:motplus\.xyz|motplusplusplus\.com)/wp-content/uploads/[^\s"\'<>?#]+',
    ]
    found = []
    for pat in patterns:
        for m in re.finditer(pat, page_html, re.IGNORECASE):
            url = m.group(0)
            if url.startswith('/web/'):
                url = re.sub(r'^/web/\d+/', '', url)
            if not url.startswith('http'):
                url = 'https://' + url.lstrip('/')
            url = url.split('?')[0]
            found.append(url)
    JUNK = ['logomot', 'a.farmlogo', 's-1-edited', 'amanaki_png', 'artboard',
            'web-e1760', '3nam-2', 'ajar', 'artrepublik', 'pixel.wp', 'b.gif',
            'favicon', 'codesurfing', 'formapubli', 'kirti', 'marg1n', 'matca',
            'nbs', 'rr-1', 'vanguard', 'wdg']
    seen_names = set()
    result = []
    for url in found:
        fname = url.split('/')[-1].lower()
        if any(j in fname for j in JUNK):
            continue
        if fname in seen_names:
            continue
        seen_names.add(fname)
        result.append(url)
    return result

def classify_category(title, text):
    t = (title + ' ' + text).lower()
    if any(w in t for w in ['motsound', 'mot sound', 'mot+sound', 'mọt #', 'mot #', 'mot-so', 'sound edition']):
        return 'MoTsound'
    if any(w in t for w in ['open studio', 'a. farm', 'a.farm', 'afarm', 'residency', 'a-farm']):
        return '+a.Farm'
    if any(w in t for w in ['performance']):
        return '+1 performance'
    if any(w in t for w in ['exhibition', 'solo show', 'group show', 'art fair', 'walkthrough']):
        return '+1 contemporary project'
    if any(w in t for w in ['workshop', 'talk', 'discussion', 'reading', 'lecture', 'presentation', 'round table']):
        return '+1 nice place for experimentation'
    return '+1 contemporary project'

def content_type_for(filename):
    return {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.webp': 'image/webp', '.gif': 'image/gif'}.get(
        os.path.splitext(filename)[1].lower(), 'image/jpeg')

def upload_image(s3, original_url, wayback_ts, slug):
    fname = original_url.split('/')[-1].lower().replace(' ', '-')
    r2_key = f"motplus/events/{slug}/{fname}"
    fetch_url = f"{WAYBACK}/web/{wayback_ts}/{original_url}"
    for url in [fetch_url, original_url]:
        try:
            r = requests.get(url, headers=HEADERS, timeout=40)
            if r.status_code == 200 and len(r.content) > 500:
                s3.put_object(
                    Bucket=R2_BUCKET, Key=r2_key, Body=r.content,
                    ContentType=content_type_for(fname),
                )
                return f"{R2_BASE}/{r2_key}"
        except Exception:
            pass
    return None

def cdx_best_snapshot(orig_url, retries=3):
    """Find the best (most recent 200) Wayback snapshot timestamp for a URL."""
    params = {
        'url': orig_url, 'output': 'json',
        'fl': 'timestamp,statuscode',
        'filter': 'statuscode:200',
        'limit': '5',
        'sort': 'reverse',
    }
    for _ in range(retries):
        try:
            r = requests.get(CDX_API, params=params, headers=HEADERS, timeout=30)
            rows = r.json()
            if len(rows) > 1:
                return rows[1][0]  # most recent 200 timestamp
        except Exception as e:
            print(f"    CDX error: {e}")
            time.sleep(5)
    return None

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    failed_path = os.path.join(script_dir, 'wayback-failed-slugs.json')
    json_path   = os.path.join(script_dir, '..', 'events-data.json')

    with open(failed_path) as f:
        failed = json.load(f)
    with open(json_path, encoding='utf-8') as f:
        existing = json.load(f)

    existing_slugs = {e['slug'] for e in existing}

    print(f"Retrying {len(failed)} failed slugs...")
    print(f"Existing events: {len(existing)}\n")

    if DRY_RUN:
        print("[DRY RUN] Would retry:")
        for e in failed:
            canonical = e.get('canonical', '')
            alias = f' -> {canonical}' if canonical else ''
            print(f"  [{e['type']}] {e['slug']}{alias}  {e['orig']}")
        return

    s3 = boto3.client("s3", endpoint_url=R2_ENDPOINT,
                      aws_access_key_id=R2_KEY, aws_secret_access_key=R2_SECRET,
                      region_name="auto")

    still_failed = []
    new_events   = []

    aliases  = [e for e in failed if e['type'] == 'alias']
    new_evts = [e for e in failed if e['type'] == 'new_event']

    # ── Aliases: upload images to canonical R2 folder ─────────────────────────
    if aliases:
        print(f"── Aliases ({len(aliases)}) ──────────────────────────────────")
    for entry in aliases:
        slug     = entry['slug']
        canonical = entry['canonical']
        ts       = entry['ts']
        orig     = entry['orig']
        print(f"\n  [{slug}] → {canonical}")

        # Try a fresher snapshot if original ts failed
        fresh_ts = cdx_best_snapshot(orig)
        if fresh_ts and fresh_ts != ts:
            print(f"    Using fresher snapshot: {fresh_ts} (was {ts})")
            ts = fresh_ts

        page_html = wayback_fetch(ts, orig)
        if not page_html:
            print("    Could not fetch — still failing")
            still_failed.append(entry)
            continue

        images = extract_images(page_html, ts)
        print(f"    {len(images)} images found")
        uploaded = 0
        for img_url in images:
            r2_url = upload_image(s3, img_url, ts, canonical)
            if r2_url:
                for e in existing:
                    if e['slug'] == canonical:
                        if r2_url not in e.get('images', []):
                            e.setdefault('images', []).append(r2_url)
                            if not e.get('thumbnail'):
                                e['thumbnail'] = r2_url
                uploaded += 1
                print(f"    ✓ {img_url.split('/')[-1]}")
            else:
                print(f"    ✗ {img_url.split('/')[-1]}")
            time.sleep(0.3)
        print(f"    → {uploaded} uploaded")
        time.sleep(0.5)

    # ── New events: fetch, extract, upload ────────────────────────────────────
    if new_evts:
        print(f"\n── New events ({len(new_evts)}) ──────────────────────────────")
    for entry in new_evts:
        slug = entry['slug']
        ts   = entry['ts']
        orig = entry['orig']
        print(f"\n  [{slug}]")

        if slug in existing_slugs:
            print("    Already in events-data.json — skipping")
            continue

        # Try fresher snapshot
        fresh_ts = cdx_best_snapshot(orig)
        if fresh_ts and fresh_ts != ts:
            print(f"    Using fresher snapshot: {fresh_ts} (was {ts})")
            ts = fresh_ts

        page_html = wayback_fetch(ts, orig)
        if not page_html:
            print("    Could not fetch — still failing")
            still_failed.append(entry)
            continue

        title = extract_title(page_html)
        if not title or len(title) < 4:
            print(f"    No title — skipping")
            still_failed.append({**entry, 'note': 'no title extracted'})
            continue

        title_lower = title.lower()
        if any(x in title_lower for x in ['news & events', '404', 'mot+++ |', 'page not found']):
            print(f"    Not an event ({title[:50]}) — skipping")
            continue

        date_iso    = extract_date_from_url(orig) or extract_date(page_html) or ts[:4] + '-01-01'
        description = extract_description(page_html)
        category    = classify_category(title, page_html[:2000])
        images      = extract_images(page_html, ts)

        print(f"    {date_iso}  {category}  \"{title[:60]}\"")
        print(f"    {len(images)} images")

        r2_images = []
        for img_url in images:
            r2_url = upload_image(s3, img_url, ts, slug)
            if r2_url:
                r2_images.append(r2_url)
                print(f"    ✓ {img_url.split('/')[-1]}")
            else:
                print(f"    ✗ {img_url.split('/')[-1]}")
            time.sleep(0.3)

        new_events.append({
            'slug':        slug,
            'title':       title,
            'displayDate': '',
            'dateISO':     date_iso,
            'sortDate':    date_iso,
            'pubDate':     date_iso,
            'category':    category,
            'location':    'hồ chí minh',
            'description': description,
            'images':      r2_images,
            'thumbnail':   r2_images[0] if r2_images else '',
            'wpLink':      orig,
        })
        time.sleep(0.5)

    # ── Write results ─────────────────────────────────────────────────────────
    print(f"\n── Writing events-data.json...")
    combined = existing + new_events
    combined.sort(key=lambda e: e.get('dateISO', ''), reverse=True)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    # Update failed slugs file — keep only those still failing
    with open(failed_path, 'w') as f:
        json.dump(still_failed, f, indent=2)

    print(f"\nDone!")
    print(f"  New events added:   {len(new_events)}")
    print(f"  Total events:       {len(combined)}")
    print(f"  Still failing:      {len(still_failed)}")
    if still_failed:
        print("  Still failing slugs:")
        for e in still_failed:
            print(f"    {e['slug']}")
    if new_events:
        print("\n  Added:")
        for e in sorted(new_events, key=lambda x: x['dateISO']):
            print(f"    {e['dateISO']}  {e['slug']}")

if __name__ == '__main__':
    main()
