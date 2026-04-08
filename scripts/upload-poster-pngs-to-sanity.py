#!/usr/bin/env python3
"""
upload-poster-pngs-to-sanity.py

Uploads the 10 recovered event poster/flyer PNGs from the WP media export
on the external drive to Sanity, prepending them as isPoster:true to each
event's uploadedImages array.

Run AFTER migrate-images-to-sanity.py has completed.

SAFE BY DEFAULT — pass --run to write anything.

Usage:
  python3 scripts/upload-poster-pngs-to-sanity.py          # dry run
  python3 scripts/upload-poster-pngs-to-sanity.py --run    # live

SANITY_WRITE_TOKEN must be set in environment.
"""

import sys, os, json, time
from pathlib import Path
from io import BytesIO

try:
    from PIL import Image
    import requests
except ImportError:
    print("pip install Pillow requests")
    sys.exit(1)

DRY_RUN      = "--run" not in sys.argv
SANITY_TOKEN = os.environ.get("SANITY_WRITE_TOKEN", "")
PROJECT_ID   = "t5nsm79o"
DATASET      = "production"
API_VERSION  = "2026-03-20"
SANITY_API   = f"https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}"
MAX_PX       = 1600
QUALITY      = 85
WP_MEDIA     = Path("/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media")

# Mapping: (drive_path, event_slug)
# fb-event.png from 2025/03 → april open studio (date 2025-03-30)
POSTER_MAP = [
    (WP_MEDIA / "2025/03/fb-event.png",         "april-open-studio-virginie-tan-aylin-derya-stahl"),
    (WP_MEDIA / "2025/05/fb-event-1.png",        "giua-nhung-chop-bong-toi-mo-tiep-nhung-giac-mo-in-between-frames-i-dream-the-dreams-i-have-been-dreaming"),
    (WP_MEDIA / "2025/05/fb-event-2.png",        "chuong-trinh-luu-tru-a-farm-duoc-tai-tro-danh-cho-nghe-si-viet-nam"),
    (WP_MEDIA / "2024/11/artisttalk_november-03.png", "save-the-date-artist-talk-with-nguyen-hoa-vicente-arrese-and-que"),
    (WP_MEDIA / "2025/05/tam.png",               "nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do"),
    (WP_MEDIA / "2025/01/ru-marshall-fb.png",    "performance-presentation-discussion"),
    (WP_MEDIA / "2025/03/between-land-sea-fb.png", "between-land-sea-ink-rock-paintings-by-saverio-tonoli"),
    (WP_MEDIA / "2025/02/irene-ha-open-studio-fb.png", "open-studio-by-baby-reni"),
    (WP_MEDIA / "2025/02/minimal-prayer-fb-1.png", "minimal-prayer-duy-nguyen"),
]

def to_jpeg(path: Path) -> bytes:
    img = Image.open(path).convert("RGB")
    if max(img.size) > MAX_PX:
        img.thumbnail((MAX_PX, MAX_PX), Image.LANCZOS)
    out = BytesIO()
    img.save(out, format="JPEG", quality=QUALITY, optimize=True)
    return out.getvalue()

def upload_to_sanity(jpg_data: bytes, filename: str) -> str:
    resp = requests.post(
        f"{SANITY_API}/assets/images/{DATASET}",
        headers={"Authorization": f"Bearer {SANITY_TOKEN}",
                 "Content-Type": "image/jpeg",
                 "X-Sanity-Label": filename},
        data=jpg_data, timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["document"]["_id"]

def get_sanity_event(slug):
    query = f'*[_type=="event" && slug.current=="{slug}"][0]{{_id, uploadedImages}}'
    resp = requests.get(f"{SANITY_API}/data/query/{DATASET}",
                        params={"query": query},
                        headers={"Authorization": f"Bearer {SANITY_TOKEN}"},
                        timeout=15)
    if resp.status_code != 200:
        return None
    return resp.json().get("result")

def prepend_poster(doc_id, asset_id, existing):
    poster_ref = {"_type": "image", "asset": {"_type": "reference", "_ref": asset_id}, "isPoster": True}
    # Remove any existing isPoster items, prepend new one
    cleaned = [img for img in (existing or []) if not img.get("isPoster")]
    new_images = [poster_ref] + cleaned
    mutation = {"mutations": [{"patch": {"id": doc_id, "set": {"uploadedImages": new_images}}}]}
    resp = requests.post(f"{SANITY_API}/data/mutate/{DATASET}",
                         headers={"Authorization": f"Bearer {SANITY_TOKEN}",
                                  "Content-Type": "application/json"},
                         json=mutation, timeout=30)
    resp.raise_for_status()

def main():
    if not DRY_RUN and not SANITY_TOKEN:
        print("ERROR: SANITY_WRITE_TOKEN not set.")
        sys.exit(1)

    print(f"{'[DRY RUN] ' if DRY_RUN else ''}Poster PNG → Sanity upload\n")

    for drive_path, slug in POSTER_MAP:
        print(f"  {drive_path.name} → {slug}")

        if not drive_path.exists():
            print(f"    ✗ File not found on drive: {drive_path}")
            continue

        if DRY_RUN:
            print(f"    → would upload and prepend as isPoster:true")
            continue

        # Get Sanity doc
        doc = get_sanity_event(slug)
        if not doc:
            print(f"    ✗ No Sanity document for slug: {slug}")
            continue

        # Convert and upload
        try:
            jpg = to_jpeg(drive_path)
            asset_id = upload_to_sanity(jpg, drive_path.stem + ".jpg")
            prepend_poster(doc["_id"], asset_id, doc.get("uploadedImages") or [])
            print(f"    ✓ uploaded + prepended ({len(jpg)//1024}KB, asset: {asset_id[:24]}...)")
            time.sleep(0.3)
        except Exception as ex:
            print(f"    ✗ ERROR: {ex}")

    if DRY_RUN:
        print(f"\nRun with --run to execute.")

if __name__ == "__main__":
    main()
