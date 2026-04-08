#!/usr/bin/env python3
"""
convert-r2-pngs.py

Finds all PNG images in events-data.json that actually exist in R2,
converts them to JPEG (max 1600px, quality 85), re-uploads to R2
under the same path but with .jpg extension, then updates events-data.json.

SAFE BY DEFAULT — pass --run to actually write anything.

Usage:
  python3 scripts/convert-r2-pngs.py          # dry run (no changes)
  python3 scripts/convert-r2-pngs.py --run     # live run
"""

import sys
import os
import json
import time
import tempfile
import urllib.request
import boto3
from PIL import Image
from io import BytesIO
from pathlib import Path

DRY_RUN = "--run" not in sys.argv

# ── R2 credentials ────────────────────────────────────────────────────────────
ACCOUNT_ID  = "31a35595add67ae1366b3f6420432773"
ACCESS_KEY  = "83343e12beb2f0aed8d48bc3047814a2"
SECRET_KEY  = "8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56"
BUCKET      = "site-general"
R2_ENDPOINT = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"
PUBLIC_BASE = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"
MAX_PX      = 1600
QUALITY     = 85

SCRIPT_DIR  = Path(__file__).parent
ROOT        = SCRIPT_DIR.parent
DATA_FILE   = ROOT / "events-data.json"
MANIFEST    = SCRIPT_DIR / "png-conversion-manifest.json"

def r2_client():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name="auto",
    )

def url_to_r2_key(url):
    return url.replace(PUBLIC_BASE + "/", "")

def check_url(url):
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status == 200
    except:
        return False

def convert_to_jpeg(data: bytes) -> bytes:
    img = Image.open(BytesIO(data)).convert("RGB")
    if max(img.size) > MAX_PX:
        img.thumbnail((MAX_PX, MAX_PX), Image.LANCZOS)
    out = BytesIO()
    img.save(out, format="JPEG", quality=QUALITY, optimize=True)
    return out.getvalue()

def main():
    print(f"{'[DRY RUN] ' if DRY_RUN else ''}PNG→JPG R2 conversion\n")

    events = json.loads(DATA_FILE.read_text())

    # Collect all unique PNG URLs
    png_urls = set()
    for e in events:
        for url in (e.get("images") or []):
            if url.lower().endswith(".png"):
                png_urls.add(url)
        t = e.get("thumbnail", "")
        if t.lower().endswith(".png"):
            png_urls.add(t)

    print(f"Found {len(png_urls)} unique PNG URLs in events-data.json")

    # Check which actually exist in R2
    print("Checking R2 availability...")
    existing = []
    missing  = []
    for url in sorted(png_urls):
        if check_url(url):
            existing.append(url)
        else:
            missing.append(url)
        sys.stdout.write(f"\r  checked {len(existing)+len(missing)}/{len(png_urls)}")
        sys.stdout.flush()
    print(f"\n  {len(existing)} exist in R2, {len(missing)} are 404 (will be skipped)")

    if not existing:
        print("Nothing to convert.")
        return

    s3 = r2_client() if not DRY_RUN else None
    manifest = {}
    converted = 0
    errors = 0

    for url in existing:
        old_key = url_to_r2_key(url)
        new_key = old_key.rsplit(".", 1)[0] + ".jpg"
        new_url = f"{PUBLIC_BASE}/{new_key}"

        print(f"\n  {old_key}")
        print(f"  → {new_key}")

        if DRY_RUN:
            manifest[url] = new_url
            converted += 1
            continue

        try:
            # Download PNG
            with urllib.request.urlopen(url, timeout=15) as r:
                png_data = r.read()

            # Convert
            jpg_data = convert_to_jpeg(png_data)

            # Upload new .jpg
            s3.put_object(
                Bucket=BUCKET,
                Key=new_key,
                Body=jpg_data,
                ContentType="image/jpeg",
            )

            manifest[url] = new_url
            converted += 1
            print(f"  ✓ uploaded ({len(jpg_data)//1024}KB)")
            time.sleep(0.1)

        except Exception as ex:
            print(f"  ✗ ERROR: {ex}")
            errors += 1

    # Save manifest
    MANIFEST.write_text(json.dumps(manifest, indent=2))
    print(f"\nManifest saved to {MANIFEST}")

    if DRY_RUN:
        print(f"\n[DRY RUN] Would convert {converted} PNGs → JPEGs in R2")
        print("Run with --run to apply.\n")
        return

    # Update events-data.json
    print(f"\nUpdating events-data.json ({converted} URLs)...")
    updated = 0
    for e in events:
        new_images = []
        for url in (e.get("images") or []):
            new_url = manifest.get(url, url)
            if new_url != url:
                updated += 1
            new_images.append(new_url)
        e["images"] = new_images
        if e.get("thumbnail") in manifest:
            e["thumbnail"] = manifest[e["thumbnail"]]
            updated += 1

    DATA_FILE.write_text(json.dumps(events, indent=2, ensure_ascii=False))
    print(f"  ✓ {updated} URL references updated in events-data.json")
    print(f"\nDone. {converted} converted, {errors} errors.")
    print("NOTE: Original PNGs are still in R2 — delete manually once verified.\n")

if __name__ == "__main__":
    main()
