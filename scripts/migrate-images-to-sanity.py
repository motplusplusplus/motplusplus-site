#!/usr/bin/env python3
"""
migrate-images-to-sanity.py

Migrates all event images from Cloudflare R2 → Sanity image assets.
For each event in events-data.json that has a Sanity document:
  1. Downloads each R2 image
  2. Converts to JPEG (max 1600px, quality 85) — handles PNGs automatically
  3. Uploads to Sanity as an image asset
  4. Patches the Sanity event document's `uploadedImages` field

SAFE BY DEFAULT — pass --run to write anything to Sanity.
Skips events that already have uploadedImages (pass --overwrite to replace).
Fully resumable — already-uploaded images are tracked in a manifest.

Usage:
  python3 scripts/migrate-images-to-sanity.py              # dry run
  python3 scripts/migrate-images-to-sanity.py --run        # live
  python3 scripts/migrate-images-to-sanity.py --run --slug open-studio-x-o-exxonnubile  # single event test
  python3 scripts/migrate-images-to-sanity.py --run --overwrite  # redo events with existing images

SANITY_WRITE_TOKEN must be set in environment.
"""

import sys
import os
import json
import time
import hashlib
import urllib.request
import urllib.error
from pathlib import Path
from io import BytesIO

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

# ── Config ─────────────────────────────────────────────────────────────────────
DRY_RUN   = "--run" not in sys.argv
OVERWRITE = "--overwrite" in sys.argv
ONLY_SLUG = None
for i, arg in enumerate(sys.argv):
    if arg == "--slug" and i + 1 < len(sys.argv):
        ONLY_SLUG = sys.argv[i + 1]

SANITY_TOKEN   = os.environ.get("SANITY_WRITE_TOKEN", "")
PROJECT_ID     = "t5nsm79o"
DATASET        = "production"
API_VERSION    = "2026-03-20"
SANITY_API     = f"https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}"
MAX_PX         = 1600
QUALITY        = 85
RATE_LIMIT_DELAY = 0.3   # seconds between Sanity API calls

SCRIPT_DIR     = Path(__file__).parent
ROOT           = SCRIPT_DIR.parent
DATA_FILE      = ROOT / "events-data.json"
MANIFEST_FILE  = SCRIPT_DIR / "sanity-image-migration-manifest.json"
LOG_FILE       = SCRIPT_DIR / "sanity-image-migration-log.jsonl"

# Slugs to skip (VN mirrors, bio pages, hidden)
SKIP_SLUGS = {
    "boynton-yue","michael-atavar","tam-do","ru-marshall","noah-spivak",
    "juan-leduc-riley","kaki","nguyen-giao-xuan","van-anh-le","coco",
    "lai-minh-ngoc","le-d-chung","ania-reynolds","anh-tran","linh-vh-nguyen",
    "shiro-masuyama","thom-nguyen","ian-strange","exxonnubile-julia-weiner",
    "x-o-veron-xio","aylin-derya-stahl","virginie-tan","irene-ha","duy-nguyen",
    "nguyen-hoa","vicente-arresse","alex-williams","lau-wang-tat","narelle-zhao",
    "annabelle-yep","linh-san","damon-duc-pham","mascha-serga","blake-palmer",
    "david-willis","laura-philips","bert-ackley","espen-iden","cam-xanh",
    "mike-kilgore","chloe-sai-breil-dupont","tam-khoa-vu","nguyen-duc-hung",
    "marjana-janevska","nikola-h-mounoud","pauline-payen","celina-huynh",
    "darren-mckenzie","griff-jurchak",
}

SKIP_LOGO_STEMS = [
    'logomot','a.farmlogo','s-1-edited','amanaki_png','artboard',
    'web-e1760','web-1-e1760','3nam-2','ajar','artrepublik','codesurfing',
    'formapubli','kirti','marg1n','matca','nbs','rr-1','vanguard','wdg',
]

def is_logo(url):
    f = url.split("/")[-1].lower()
    return any(s in f for s in SKIP_LOGO_STEMS)

def is_vn_mirror(slug):
    return slug.endswith("-vn") or slug in {
        "cho-ngay-doan-tuyet-celina-huynh",
        "loi-moi-ung-tuyen-choi-voi-feedback-workshop-xay-dung-am-thanh-cung-nikola-h-mounoud",
        "chuong-trinh-luu-tru-a-farm-duoc-tai-tro-danh-cho-nghe-si-viet-nam",
    }

def sanity_headers():
    return {
        "Authorization": f"Bearer {SANITY_TOKEN}",
        "Content-Type": "application/json",
    }

def load_manifest():
    if MANIFEST_FILE.exists():
        return json.loads(MANIFEST_FILE.read_text())
    return {}  # { r2_url: sanity_asset_id }

def save_manifest(manifest):
    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2))

def log_event(data):
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(data) + "\n")

def download_image(url):
    req = urllib.request.Request(url, headers={"User-Agent": "MoT+++ migration"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()

def to_jpeg(data: bytes) -> bytes:
    img = Image.open(BytesIO(data)).convert("RGB")
    if max(img.size) > MAX_PX:
        img.thumbnail((MAX_PX, MAX_PX), Image.LANCZOS)
    out = BytesIO()
    img.save(out, format="JPEG", quality=QUALITY, optimize=True)
    return out.getvalue()

def upload_to_sanity(jpg_data: bytes, filename: str) -> str:
    """Upload image bytes to Sanity, return asset _id."""
    url = f"{SANITY_API}/assets/images/{DATASET}"
    resp = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {SANITY_TOKEN}",
            "Content-Type": "image/jpeg",
            "X-Sanity-Label": filename,
        },
        data=jpg_data,
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["document"]["_id"]

def get_sanity_event(slug):
    """Return the Sanity event doc or None."""
    query = f'*[_type=="event" && slug.current=="{slug}"][0]{{_id, uploadedImages}}'
    resp = requests.get(
        f"{SANITY_API}/data/query/{DATASET}",
        params={"query": query},
        headers=sanity_headers(),
        timeout=15,
    )
    if resp.status_code != 200:
        return None
    result = resp.json().get("result")
    return result

def patch_uploaded_images(doc_id, image_refs):
    """Replace uploadedImages on the Sanity event document."""
    mutation = {
        "mutations": [{
            "patch": {
                "id": doc_id,
                "set": {
                    "uploadedImages": image_refs
                }
            }
        }]
    }
    resp = requests.post(
        f"{SANITY_API}/data/mutate/{DATASET}",
        headers=sanity_headers(),
        json=mutation,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()

def main():
    if not DRY_RUN and not SANITY_TOKEN:
        print("ERROR: SANITY_WRITE_TOKEN environment variable not set.")
        print("Run: SANITY_WRITE_TOKEN=sk... python3 scripts/migrate-images-to-sanity.py --run")
        sys.exit(1)

    print(f"{'[DRY RUN] ' if DRY_RUN else ''}R2 → Sanity image migration")
    if ONLY_SLUG:
        print(f"  Single event: {ONLY_SLUG}")
    if OVERWRITE:
        print(f"  --overwrite: will redo events that already have uploadedImages")
    print()

    events = json.loads(DATA_FILE.read_text())
    manifest = load_manifest()

    # Filter to processable events
    to_process = []
    for e in events:
        slug = e.get("slug", "")
        if ONLY_SLUG and slug != ONLY_SLUG:
            continue
        if slug in SKIP_SLUGS or is_vn_mirror(slug):
            continue
        images = [u for u in (e.get("images") or []) if not is_logo(u)]
        if not images:
            continue
        to_process.append((e, images))

    print(f"Events to process: {len(to_process)}")
    if not to_process:
        print("Nothing to do.")
        return

    stats = {"events_done": 0, "events_skipped": 0, "images_uploaded": 0,
             "images_from_cache": 0, "errors": 0}

    for idx, (event, images) in enumerate(to_process):
        slug = event["slug"]
        print(f"\n[{idx+1}/{len(to_process)}] {slug} ({len(images)} images)")

        # Check Sanity document exists
        sanity_doc = None
        if not DRY_RUN:
            sanity_doc = get_sanity_event(slug)
            if not sanity_doc:
                print(f"  ⚠ No Sanity document — skipping")
                stats["events_skipped"] += 1
                continue
            # Check if already has uploadedImages
            existing = sanity_doc.get("uploadedImages") or []
            if existing and not OVERWRITE:
                print(f"  ⚠ Already has {len(existing)} uploadedImages — skipping (use --overwrite to redo)")
                stats["events_skipped"] += 1
                continue
            time.sleep(RATE_LIMIT_DELAY)

        image_refs = []
        event_errors = 0

        for i, url in enumerate(images):
            filename = url.split("/")[-1].rsplit(".", 1)[0] + ".jpg"
            print(f"  [{i+1}/{len(images)}] {filename}", end=" ", flush=True)

            if DRY_RUN:
                print(f"→ would upload")
                image_refs.append({"_type": "image", "asset": {"_type": "reference", "_ref": "PENDING"}})
                continue

            # Check manifest cache
            if url in manifest:
                asset_id = manifest[url]
                print(f"→ cached ({asset_id[:20]}...)")
                stats["images_from_cache"] += 1
            else:
                try:
                    # Download
                    raw = download_image(url)
                    # Convert to JPEG
                    jpg = to_jpeg(raw)
                    # Upload to Sanity
                    asset_id = upload_to_sanity(jpg, filename)
                    manifest[url] = asset_id
                    save_manifest(manifest)  # save after each upload
                    print(f"→ ✓ {asset_id[:20]}... ({len(jpg)//1024}KB)")
                    stats["images_uploaded"] += 1
                    time.sleep(RATE_LIMIT_DELAY)

                except urllib.error.HTTPError as e:
                    if e.code == 404:
                        print(f"→ 404 (not in R2, skipping)")
                    else:
                        print(f"→ ✗ HTTP {e.code}")
                        stats["errors"] += 1
                    event_errors += 1
                    continue
                except Exception as ex:
                    print(f"→ ✗ {ex}")
                    stats["errors"] += 1
                    event_errors += 1
                    continue

            # First image: mark as poster if it's the thumbnail or only image
            is_poster = (i == 0)
            image_refs.append({
                "_type": "image",
                "asset": {"_type": "reference", "_ref": asset_id},
                "isPoster": is_poster,
            })

        if DRY_RUN:
            stats["events_done"] += 1
            continue

        if not image_refs:
            print(f"  ⚠ No images uploaded, skipping patch")
            stats["events_skipped"] += 1
            continue

        # Patch Sanity document
        try:
            patch_uploaded_images(sanity_doc["_id"], image_refs)
            print(f"  ✓ patched Sanity doc with {len(image_refs)} images")
            stats["events_done"] += 1
            log_event({"slug": slug, "doc_id": sanity_doc["_id"],
                       "images": len(image_refs), "errors": event_errors})
            time.sleep(RATE_LIMIT_DELAY)
        except Exception as ex:
            print(f"  ✗ patch failed: {ex}")
            stats["errors"] += 1

    print(f"\n{'=' * 50}")
    if DRY_RUN:
        print(f"[DRY RUN] Would process {stats['events_done']} events")
        print(f"  Total images that would be uploaded: {sum(len([u for u in (e.get('images') or []) if not is_logo(u)]) for e, _ in to_process)}")
        print(f"\nRun with --run to execute.")
        if ONLY_SLUG:
            print(f"Tip: test on one event first:")
            print(f"  SANITY_WRITE_TOKEN=sk... python3 scripts/migrate-images-to-sanity.py --run --slug {to_process[0][0]['slug']}")
    else:
        print(f"Done.")
        print(f"  Events migrated:   {stats['events_done']}")
        print(f"  Events skipped:    {stats['events_skipped']}")
        print(f"  Images uploaded:   {stats['images_uploaded']}")
        print(f"  Images from cache: {stats['images_from_cache']}")
        print(f"  Errors:            {stats['errors']}")
        print(f"  Manifest:          {MANIFEST_FILE}")
        print(f"  Log:               {LOG_FILE}")
        if stats['errors'] > 0:
            print(f"\n⚠ There were errors. Script is resumable — rerun to retry failed images.")

if __name__ == "__main__":
    main()
