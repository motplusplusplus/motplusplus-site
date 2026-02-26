#!/usr/bin/env python3
"""
Scrape ALL events from motplusplusplus.com via RSS + individual pages.
Migrates all images to R2. Outputs events-data.json for Next.js build.
"""

import requests, json, re, boto3, time, os, html
from xml.etree import ElementTree as ET
from datetime import datetime

# ─── Config ──────────────────────────────────────────────────────────────────

WP_BASE     = "https://motplusplusplus.com"
R2_BASE     = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"
R2_BUCKET   = "site-general"
R2_ENDPOINT = "https://31a35595add67ae1366b3f6420432773.r2.cloudflarestorage.com"
R2_KEY      = "83343e12beb2f0aed8d48bc3047814a2"
R2_SECRET   = "8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56"
HEADERS     = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

# ─── Helpers ─────────────────────────────────────────────────────────────────

def content_type(filename):
    return {".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",
            ".webp":"image/webp",".gif":"image/gif"}.get(
        os.path.splitext(filename)[1].lower(), "image/jpeg")

def strip_html(s):
    s = re.sub(r'<style[^>]*>.*?</style>', ' ', s, flags=re.DOTALL)
    s = re.sub(r'<script[^>]*>.*?</script>', ' ', s, flags=re.DOTALL)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()

def extract_images(html_str):
    urls = re.findall(r'https://motplusplusplus\.com/wp-content/uploads/[^\s"\'<>?#]+', html_str)
    skip = ['logomot', 'pixel.wp.com', 'b.gif', 'favicon']
    urls = [u for u in urls if not any(s in u for s in skip)]
    return list(dict.fromkeys(urls))  # dedup, preserve order

def url_to_slug(url):
    return url.rstrip('/').split('/')[-1]

def is_latin_enough(s):
    """Return True if string is mostly ASCII — filters out Vietnamese-primary posts."""
    ascii_count = sum(1 for c in s if ord(c) < 128)
    return ascii_count / max(len(s), 1) > 0.72

# ─── Classification ───────────────────────────────────────────────────────────

# Titles that are definitely not events
SKIP_TITLE_SUBSTRINGS = [
    'news & events', 'programs', 'residents', 'reading room', 'library |',
    'nhabe scholae', 'matca', 'marg1n', 'kirti', 'formapubli', 'ajar press',
    'art republik', 'wedogood', 'vănguard', '3năm', 'bookstore |', 'library |',
]
# Description patterns that indicate a staff bio
SKIP_DESC_SUBSTRINGS = [
    'director', 'art technician', 'partner & admin', 'graphic designer',
    'admin &', 'partner &', 'residency coordinator', 'co-director',
]

def is_event(title, description):
    title_l = title.lower()
    desc_l  = description.lower()
    if any(s in title_l for s in SKIP_TITLE_SUBSTRINGS):
        return False
    if any(s in desc_l for s in SKIP_DESC_SUBSTRINGS):
        return False
    if 'vnd' in desc_l:   # publisher profile with price
        return False
    return True

def classify_category(title, text):
    t = (title + ' ' + text).lower()
    if any(w in t for w in ['motsound', 'mot+sound', 'motsound', 'sound edition']):
        return 'MoTsound'
    if any(w in t for w in ['open studio', 'a. farm', 'a.farm', 'afarm', 'residency', 'season 7', 'season 8', 'season 6', 'season 5', 'season 4', 'season 3', 'season 2', 'season 1']):
        return '+a.farm'
    if any(w in t for w in ['exhibition', 'solo show', 'group show', 'art fair', 'duo exhibition', 'walk-through', 'walkthrough']):
        return '+1 contemporary project'
    if any(w in t for w in ['performance', 'big day of performances', 'performance plus']):
        return '+1 performance'
    if any(w in t for w in ['workshop', 'talk', 'discussion', 'reading', 'lecture', 'presentation', 'round table']):
        return '+1 nice place for experimentation'
    return '+a.farm'

# ─── R2 upload ───────────────────────────────────────────────────────────────

def migrate_image(s3, wp_url, slug):
    clean_url = wp_url.split('?')[0]
    filename  = clean_url.split('/')[-1]
    r2_key    = f"motplus/events/{slug}/{filename}"
    try:
        r = requests.get(clean_url, headers=HEADERS, timeout=30)
        r.raise_for_status()
        s3.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=r.content,
                      ContentType=content_type(filename))
        return f"{R2_BASE}/{r2_key}"
    except Exception as e:
        print(f"    ✗ {filename}: {e}")
        return None

# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    s3 = boto3.client("s3", endpoint_url=R2_ENDPOINT,
                      aws_access_key_id=R2_KEY, aws_secret_access_key=R2_SECRET,
                      region_name="auto")

    # ── Step 1: Collect all posts from RSS ──────────────────────────────────
    print("=" * 60)
    print("STEP 1: Collecting posts from RSS feed...")
    all_posts = []
    for page_num in range(1, 50):   # up to 50 pages
        url = f"{WP_BASE}/?feed=rss2&paged={page_num}"
        print(f"  RSS page {page_num}...", end=" ", flush=True)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            if resp.status_code != 200:
                print(f"status {resp.status_code} — stopping.")
                break
            root  = ET.fromstring(resp.content)
            items = root.findall('.//item')
            if not items:
                print("empty — stopping.")
                break
            ns = {'content': 'http://purl.org/rss/1.0/modules/content/'}
            for item in items:
                content_el = item.find('content:encoded', ns)
                desc_el    = item.find('description')
                raw_content = content_el.text if content_el is not None and content_el.text else ''
                raw_desc    = desc_el.text    if desc_el    is not None and desc_el.text    else ''
                all_posts.append({
                    'title':       html.unescape(item.findtext('title', '')),
                    'link':        item.findtext('link', ''),
                    'pub_date':    item.findtext('pubDate', ''),
                    'description': strip_html(raw_desc),
                    'content':     raw_content,
                })
            print(f"{len(items)} posts")
            time.sleep(0.5)
        except Exception as e:
            print(f"Error: {e} — stopping.")
            break

    print(f"\nTotal posts collected: {len(all_posts)}")

    # ── Step 2: Filter to events, deduplicate ───────────────────────────────
    print("\nSTEP 2: Filtering to events...")
    event_posts = []
    seen_slugs  = set()

    for post in all_posts:
        title = post['title']
        desc  = post['description']
        slug  = url_to_slug(post['link'])

        if slug in seen_slugs:
            continue
        if not is_event(title, desc):
            print(f"  SKIP (non-event): {title[:60]}")
            continue
        if not is_latin_enough(title):
            print(f"  SKIP (Vietnamese): {title[:60]}")
            continue

        seen_slugs.add(slug)
        event_posts.append(post)
        print(f"  ✓ {title[:70]}")

    print(f"\nEvent posts after filtering: {len(event_posts)}")

    # ── Step 3: Fetch each post page + migrate images ───────────────────────
    print("\nSTEP 3: Fetching post pages and migrating images...")
    events_data = []

    for post in event_posts:
        slug  = url_to_slug(post['link'])
        title = post['title']
        print(f"\n  [{slug[:50]}]")

        # Fetch full page for extra images and body text
        full_html = post['content']
        try:
            pr = requests.get(post['link'], headers=HEADERS, timeout=30)
            if pr.status_code == 200:
                full_html += pr.text
        except Exception as e:
            print(f"    Page fetch failed: {e}")

        # Images
        wp_images = extract_images(full_html)
        print(f"    Images: {len(wp_images)}")

        # Body text (use RSS description if page fetch gave garbage)
        body = strip_html(full_html)
        if len(body) < 100:
            body = post['description']
        # Trim very long (keep first 3000 chars ≈ ~5 paragraphs)
        body = body[:3000]

        # Category
        category = classify_category(title, full_html)

        # Migrate images
        r2_images = []
        for wp_url in wp_images:
            r2_url = migrate_image(s3, wp_url, slug)
            if r2_url:
                r2_images.append(r2_url)
                print(f"    ✓ {wp_url.split('/')[-1].split('?')[0]}")

        # Parse ISO date for sorting
        try:
            dt       = datetime.strptime(post['pub_date'][:16].strip(), '%a, %d %b %Y')
            date_iso = dt.strftime('%Y-%m-%d')
        except Exception:
            date_iso = '2020-01-01'

        events_data.append({
            'slug':        slug,
            'title':       title,
            'displayDate': post['description'],
            'dateISO':     date_iso,
            'pubDate':     post['pub_date'],
            'category':    category,
            'location':    'hồ chí minh',
            'description': body,
            'images':      r2_images,
            'thumbnail':   r2_images[0] if r2_images else '',
            'wpLink':      post['link'],
        })
        time.sleep(0.3)

    # Sort newest first
    events_data.sort(key=lambda e: e['dateISO'], reverse=True)

    # ── Step 4: Write output ─────────────────────────────────────────────────
    out_path = os.path.join(os.path.dirname(__file__), '..', 'events-data.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(events_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"Done! {len(events_data)} events saved to events-data.json")
    print("\nFull list (newest first):")
    for e in events_data:
        print(f"  {e['dateISO']}  {e['category']:<40}  {e['title'][:50]}")

if __name__ == '__main__':
    main()
