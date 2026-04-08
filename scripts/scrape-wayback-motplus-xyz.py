#!/usr/bin/env python3
"""
Scrape all past events from motplus.xyz via the Wayback Machine CDX API.
Compares against existing events-data.json + Sanity slugs and adds any missing events.

Usage:
  python3 scripts/scrape-wayback-motplus-xyz.py [--dry-run]

  --dry-run   List missing events without fetching content or uploading images.
"""

import requests, json, re, boto3, time, os, html, sys
from datetime import datetime

# ─── Config ──────────────────────────────────────────────────────────────────

OLD_SITE    = "motplus.xyz"
R2_BASE     = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"
R2_BUCKET   = "site-general"
R2_ENDPOINT = "https://31a35595add67ae1366b3f6420432773.r2.cloudflarestorage.com"
R2_KEY      = "83343e12beb2f0aed8d48bc3047814a2"
R2_SECRET   = "8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56"

WAYBACK     = "https://web.archive.org"
CDX_API     = f"{WAYBACK}/cdx/search/cdx"
HEADERS     = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

DRY_RUN = "--dry-run" in sys.argv

# ─── Slug lists ──────────────────────────────────────────────────────────────

# Old-site slugs that are duplicates of known Sanity/JSON slugs (different naming convention).
# Maps old-slug → canonical slug. Images will be aliased into canonical's R2 folder.
SLUG_ALIASES = {
    'mot-4':            'mot-sound-4',
    'mot-5':            'mot-sound-5',
    'mot-6':            'mot-sound-6',
    'mot-7':            'mot-sound-7',
    'mot-8-amoeba':     'mot-sound-8-amoeba',
    'mot-9-aconvergence': 'mot-sound-9-aconvergence',
    'mot-10':           'mot-sound-10-anoise',
    'mot-so-1':         'mot-sound-1',
    'mot-so-2':         'mot-sound-2',
    'mot-so-3':         'mot-sound-3',
    'other-mother-cian-duggan':    'othermother-cian-duggan',
    'password-01':                 'password-01-group-show',
    'run-run-run-ongoing-collaborative-performance': 'cam-xanh-run-run-run-ongoing-collaborative-performance',
    'dusk-dance-for-saigon-river': 'dusk-dance-for-saigon-river-emmanuelle-huynh',
    'renaissance-now-features-work-by-regis-golay': 'renaissance-international-school-now-features-work-by-regis-golay',
    'swab-barcelona-2020':         'swab-barcelona-art-fair-2020',
    'reunification-flowershoa-thong-nhat': 'reunification-flowers',
    'lananh-le':                   'lan-anh-le',
    'big-day-of-performance-2':    'big-day-of-performances-2-performance-plus-2019',
    'big-day-of-performances-2-performance-plus': 'big-day-of-performances-2-performance-plus-2019',
    'big-day-of-performances-3':   'big-day-of-performances-3-performance-plus-2019',
    'big-day-of-performances-4-performance-plus-2019': 'big-day-of-performances-4-a-farm-performance-plus-2019',
    'big-day-of-performances-5performance-plus-2019': 'big-day-of-performances-5-performance-plus-2019',
    'chaoartartchao-performance-cam-xanh': 'cam-xanh-chaoartartchao-performance-plus-2019',
    'performance-plus-2019-screen-time': 'screen-time-performance-plus-2019',
    'performance-plus-2019-big-day-of-performances-1': 'big-day-of-performances-1-performance-plus-2019',
    'presentation-round-table-documenting-performance-art-tanya-amador': 'tanya-amador-documenting-performance-art-presentation-round-table-performance-plus-2019',
    'trash-%e2%99%bb%ef%b8%8f-%f0%9f%97%91': 'trash',
    'cian-duggan-2': 'cian-duggan',
    'performance-enkhbold-togmidshoiirev': 'performance-enkhbold-togmidshiirev',
    'artists-in-residence-cora-von-zezschwitz-tilman-hoepfl': 'cora-von-zezschwitz-tilman-hoepfl',
}

# Bio/resident pages on old site — already handled as bio pages or not needed
BIO_PREFIXES = (
    'artist-in-residence-', 'researcher-in-residence-',
    'critic-in-residence-', 'writer-in-residence-',
)

# Fully skip these
SKIP_SLUGS = {
    'luke-schneider-3',    # removed staff — do not include per site rules
    'cam-xanh',            # artist bio page
    'le-phi-long',         # a.farm studio artist bio
    'artist-talk',         # too generic
    'residency', 'location-space', 'in-progress',
    'call-for-applications-a-farm-residency-season-1',
    'call-for-applications-a-farm-residency-season-2',
    'a-farm-open-call-for-funded-residency-vietnamese-artist',
    'a-farm-program-2023-24',
    'six-month-focus-on-performance-art',
    '__trashed', '2279',
    'exchange-cian-duggan-to-berlin',
    'exchange-kim-duy-to-taipei',
    'exchange-le-quoc-thanh-to-seoul',
    'exchange-christine-nguyen-to-mot',
    'artist-in-residence-aliansyah-caniago-2',
    'aliansah-caniago',
    'a-farm-traiect-iv-vietnam-01-2024',
    'performance-plus-2019', 'performance-plus-2019-2',
}

# ─── CDX helpers ─────────────────────────────────────────────────────────────

def cdx_get_all_dated_posts(retries=3):
    """
    Use CDX to enumerate all unique dated-path posts on motplus.xyz.
    Returns dict: slug -> (timestamp, original_url)
    """
    params = {
        "url": "motplus.xyz/2*",
        "output": "json",
        "fl": "timestamp,original,statuscode",
        "filter": ["statuscode:200", "original:.*/20[0-9][0-9]/"],
        "collapse": "urlkey",
        "limit": "500",
    }
    for attempt in range(retries):
        try:
            r = requests.get(CDX_API, params=params, headers=HEADERS, timeout=30)
            if r.status_code == 429:
                print("  Rate limited — waiting 30s...")
                time.sleep(30)
                continue
            r.raise_for_status()
            rows = r.json()
            result = {}
            for row in rows[1:]:
                ts, orig = row[0], row[1]
                m = re.search(r'/20\d{2}/\d{2}/\d{2}/([^/?#]+)/?$', orig)
                if m:
                    slug = m.group(1).rstrip('/')
                    if slug not in result:
                        result[slug] = (ts, orig)
            return result
        except Exception as e:
            print(f"  CDX error: {e}")
            time.sleep(5)
    return {}

def wayback_fetch(timestamp, original, retries=3):
    url = f"{WAYBACK}/web/{timestamp}/{original}"
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 429:
                print("    Rate limited — waiting 30s...")
                time.sleep(30)
                continue
            if r.status_code == 200:
                return r.text
        except Exception as e:
            print(f"    Fetch error: {e}")
            time.sleep(3)
    return None

# ─── HTML helpers ─────────────────────────────────────────────────────────────

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
    """Extract date from dated WP URL like /2018/03/25/slug/"""
    m = re.search(r'/(20\d{2})/(\d{2})/(\d{2})/', original_url)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return None

def extract_date(page_html):
    for pattern in [
        r'<time[^>]*datetime="(\d{4}-\d{2}-\d{2})',
        r'"datePublished":\s*"(\d{4}-\d{2}-\d{2})',
        r'<abbr[^>]*class="[^"]*published[^"]*"[^>]*title="(\d{4}-\d{2}-\d{2})',
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
    if any(w in t for w in ['exhibition', 'solo show', 'group show', 'art fair', 'walkthrough', 'walk-through']):
        return '+1 contemporary project'
    if any(w in t for w in ['workshop', 'talk', 'discussion', 'reading', 'lecture', 'presentation', 'round table']):
        return '+1 nice place for experimentation'
    return '+1 contemporary project'

# ─── R2 upload ────────────────────────────────────────────────────────────────

def content_type_for(filename):
    return {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.webp': 'image/webp', '.gif': 'image/gif'}.get(
        os.path.splitext(filename)[1].lower(), 'image/jpeg')

def upload_image(s3, original_url, wayback_ts, slug):
    """Fetch image from Wayback and upload to R2. Returns R2 URL or None."""
    fname = original_url.split('/')[-1].lower().replace(' ', '-')
    r2_key = f"motplus/events/{slug}/{fname}"

    fetch_url = f"{WAYBACK}/web/{wayback_ts}/{original_url}"
    for url in [fetch_url, original_url]:
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200 and len(r.content) > 500:
                s3.put_object(
                    Bucket=R2_BUCKET,
                    Key=r2_key,
                    Body=r.content,
                    ContentType=content_type_for(fname),
                )
                return f"{R2_BASE}/{r2_key}"
        except Exception:
            pass
    return None

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path  = os.path.join(script_dir, '..', 'events-data.json')
    with open(json_path, encoding='utf-8') as f:
        existing = json.load(f)
    existing_slugs = {e['slug'] for e in existing}

    sanity_slugs_path = os.path.join(script_dir, 'sanity-slugs.json')
    sanity_slugs = set()
    if os.path.exists(sanity_slugs_path):
        with open(sanity_slugs_path) as f:
            sanity_slugs = set(json.load(f))

    known_slugs = existing_slugs | sanity_slugs
    print(f"Known slugs: {len(known_slugs)} ({len(existing_slugs)} json + {len(sanity_slugs)} sanity)")

    print("\nStep 1: Enumerating motplus.xyz dated posts via CDX...")
    all_posts = cdx_get_all_dated_posts()
    print(f"Found {len(all_posts)} unique dated posts")

    if not all_posts:
        print("ERROR: CDX returned no results. archive.org may be rate-limiting.")
        return

    print("\nStep 2: Categorising slugs...")
    new_candidates   = []   # genuinely new events to fetch
    alias_candidates = []   # old slugs that alias to existing — grab images only

    for slug, (ts, orig) in sorted(all_posts.items()):
        if slug in known_slugs or slug in SKIP_SLUGS:
            continue
        if any(slug.startswith(p) for p in BIO_PREFIXES):
            continue  # bio pages already handled
        if slug in SLUG_ALIASES:
            alias_candidates.append((slug, ts, orig, SLUG_ALIASES[slug]))
            continue
        new_candidates.append((slug, ts, orig))

    print(f"  New events to add: {len(new_candidates)}")
    print(f"  Alias slugs (image merge only): {len(alias_candidates)}")

    if DRY_RUN:
        print("\n[DRY RUN] New events:")
        for slug, ts, orig in new_candidates:
            date = extract_date_from_url(orig) or ts[:8]
            print(f"  {date[:7]}  {slug}")
        print("\n[DRY RUN] Alias merges:")
        for slug, ts, orig, canonical in alias_candidates:
            print(f"  {slug} → {canonical}")
        return

    s3 = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_KEY,
        aws_secret_access_key=R2_SECRET,
        region_name="auto",
    )

    failed_fetches = []   # slugs where Wayback page fetch failed — write at end for retry

    # Step 3a: Fetch alias slugs — upload their images to the canonical slug's R2 folder
    print("\nStep 3a: Uploading images for alias slugs...")
    for slug, ts, orig, canonical in alias_candidates:
        print(f"\n  [{slug}] → {canonical}")
        page_html = wayback_fetch(ts, orig)
        if not page_html:
            print("    Could not fetch — skipping")
            failed_fetches.append({'type': 'alias', 'slug': slug, 'canonical': canonical, 'ts': ts, 'orig': orig})
            continue
        orig_images = extract_images(page_html, ts)
        print(f"    {len(orig_images)} images found")
        for img_url in orig_images:
            r2_url = upload_image(s3, img_url, ts, canonical)
            if r2_url:
                # Add to the canonical event in existing data if found
                for e in existing:
                    if e['slug'] == canonical:
                        if r2_url not in e.get('images', []):
                            e.setdefault('images', []).append(r2_url)
                            if not e.get('thumbnail'):
                                e['thumbnail'] = r2_url
                print(f"    ✓ {img_url.split('/')[-1]}")
            else:
                print(f"    ✗ {img_url.split('/')[-1]}")
            time.sleep(0.2)
        time.sleep(0.3)

    # Step 3b: Fetch and add genuinely new events
    print("\nStep 3b: Fetching new events...")
    new_events = []
    for slug, ts, orig in new_candidates:
        print(f"\n  [{slug}]")
        page_html = wayback_fetch(ts, orig)
        if not page_html:
            print("    Could not fetch — skipping")
            failed_fetches.append({'type': 'new_event', 'slug': slug, 'ts': ts, 'orig': orig})
            continue

        title = extract_title(page_html)
        if not title or len(title) < 4:
            print(f"    No title — skipping")
            continue

        # Skip known non-event patterns
        title_lower = title.lower()
        if any(x in title_lower for x in ['news & events', '404', 'mot+++ |', 'page not found']):
            print(f"    Not an event ({title[:40]}) — skipping")
            continue

        date_iso    = extract_date_from_url(orig) or extract_date(page_html) or ts[:4] + '-01-01'
        description = extract_description(page_html)
        category    = classify_category(title, page_html[:2000])
        orig_images = extract_images(page_html, ts)

        print(f"    {date_iso}  {category}  \"{title[:60]}\"")
        print(f"    {len(orig_images)} images")

        r2_images = []
        for img_url in orig_images:
            r2_url = upload_image(s3, img_url, ts, slug)
            if r2_url:
                r2_images.append(r2_url)
                print(f"    ✓ {img_url.split('/')[-1]}")
            else:
                print(f"    ✗ {img_url.split('/')[-1]}")
            time.sleep(0.2)

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

    # Step 4: Write updated JSON
    print(f"\nStep 4: Writing events-data.json...")
    combined = existing + new_events
    combined.sort(key=lambda e: e.get('dateISO', ''), reverse=True)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    # Write failed slugs for retry
    if failed_fetches:
        failed_path = os.path.join(script_dir, 'wayback-failed-slugs.json')
        with open(failed_path, 'w', encoding='utf-8') as f:
            json.dump(failed_fetches, f, ensure_ascii=False, indent=2)
        print(f"\n  Failed fetches logged: {len(failed_fetches)} → scripts/wayback-failed-slugs.json")

    print(f"\nDone!")
    print(f"  New events added: {len(new_events)}")
    print(f"  Total: {len(combined)}")
    for e in sorted(new_events, key=lambda x: x['dateISO']):
        print(f"  {e['dateISO']}  {e['category']:<35}  {e['title'][:50]}")

if __name__ == '__main__':
    main()
