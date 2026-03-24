#!/usr/bin/env python3
"""
Find missing event images on the drive and upload them to R2.
"""

import json
import os
import re
import subprocess
import sys
from io import BytesIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from PIL import Image

# R2 credentials
R2_ACCOUNT_ID = "31a35595add67ae1366b3f6420432773"
R2_ACCESS_KEY = "83343e12beb2f0aed8d48bc3047814a2"
R2_SECRET = "8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56"
R2_BUCKET = "site-general"
R2_PUBLIC_BASE = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"

s3 = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET,
    config=Config(signature_version='s3v4'),
    region_name='auto'
)

MAX_DIMENSION = 1600
JPEG_QUALITY = 85

SKIP_KNOWN = {
    'motplus/events/seff-ii/17853744778575035.jpg',
    'motplus/events/seff-ii/17896999966377473.jpg',
    'motplus/events/seff-ii/18077539597127012.jpg',
    'motplus/events/seff-ii/17865890731490107.jpg',
}

# Instagram export locations
IG_AFARM_BASE = "/Volumes/MoT/EXPORTED DATA/exported from instagram/instagram-a.farm.saigon-2026-03-16-rm8HxNgw"
IG_MOT_BASE = "/Volumes/MoT/EXPORTED DATA/exported from instagram/instagram-motplusplusplus-2026-03-16-ExKPitQg"
GDRIVE_BASE = "/Volumes/MoT/EXPORTED DATA/exported from google drive a.farm"
WP_BASE = "/Volumes/MoT/EXPORTED DATA/wordpress"


def resize_and_compress(src_path):
    """Resize image to max 1600px on longest side, return JPEG bytes at quality 85."""
    with Image.open(src_path) as img:
        # Convert to RGB (handles RGBA, palette modes, etc.)
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')

        w, h = img.size
        max_dim = max(w, h)

        if max_dim > MAX_DIMENSION:
            scale = MAX_DIMENSION / max_dim
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = img.resize((new_w, new_h), Image.LANCZOS)

        buf = BytesIO()
        img.save(buf, format='JPEG', quality=JPEG_QUALITY, optimize=True)
        buf.seek(0)
        return buf.read()


def upload_to_r2(key, data_bytes):
    """Upload bytes to R2 under the given key."""
    s3.put_object(
        Bucket=R2_BUCKET,
        Key=key,
        Body=data_bytes,
        ContentType='image/jpeg',
    )


def verify_upload(key):
    """Verify the uploaded file exists in R2."""
    try:
        s3.head_object(Bucket=R2_BUCKET, Key=key)
        return True
    except ClientError:
        return False


def find_ig_file_in_export(filename_no_ext):
    """Search instagram exports for a file by its numeric ID."""
    for ig_base in [IG_AFARM_BASE, IG_MOT_BASE]:
        posts_dir = os.path.join(ig_base, 'media', 'posts')
        if not os.path.exists(posts_dir):
            continue
        for month_dir in os.listdir(posts_dir):
            month_path = os.path.join(posts_dir, month_dir)
            if not os.path.isdir(month_path):
                continue
            for ext in ['.jpg', '.jpeg', '.png']:
                candidate = os.path.join(month_path, filename_no_ext + ext)
                if os.path.exists(candidate):
                    return candidate
        # Also check media/other
        other_dir = os.path.join(ig_base, 'media', 'other')
        if os.path.exists(other_dir):
            for ext in ['.jpg', '.jpeg', '.png']:
                candidate = os.path.join(other_dir, filename_no_ext + ext)
                if os.path.exists(candidate):
                    return candidate
    return None


def find_file_in_index(filename, drive_index):
    """Look up a filename in the drive index."""
    fname_lower = filename.lower()
    if fname_lower in drive_index:
        return drive_index[fname_lower]
    # Try without extension match
    return None


def find_file_broad(filename, drive_index):
    """Try multiple strategies to find a file."""
    # 1. Direct index lookup
    paths = find_file_in_index(filename, drive_index)
    if paths:
        return paths[0]

    filename_no_ext = os.path.splitext(filename)[0]

    # 2. If numeric, search IG exports directly
    if re.match(r'^\d+$', filename_no_ext):
        path = find_ig_file_in_export(filename_no_ext)
        if path:
            return path

    # 3. Try alternate extensions
    for ext in ['.jpg', '.jpeg', '.JPG', '.JPEG', '.png', '.PNG']:
        alt_name = filename_no_ext + ext
        paths = find_file_in_index(alt_name, drive_index)
        if paths:
            return paths[0]

    return None


# =================== MAIN ===================

# Load audit results
audit = json.load(open('/Users/andrewwalther/Documents/motplus/scripts/audit_results.json'))
broken = audit['broken']

# Load drive index
print("Loading drive index...", flush=True)
drive_index = json.load(open('/Users/andrewwalther/Documents/motplus/scripts/drive_index.json'))
print(f"  Drive index has {len(drive_index)} unique filenames", flush=True)

# Results tracking
uploaded = []  # (slug, url, source_path)
not_found = []  # (slug, url)
upload_errors = []  # (slug, url, error)

total_broken = sum(len(urls) for urls in broken.values())
print(f"\nProcessing {total_broken} broken images across {len(broken)} events...\n", flush=True)

processed = 0
for slug, urls in sorted(broken.items()):
    for url in urls:
        processed += 1
        key = url.replace(R2_PUBLIC_BASE + '/', '')
        filename = key.split('/')[-1]

        # Skip known missing
        if key in SKIP_KNOWN:
            not_found.append((slug, url))
            continue

        # Find the file
        src_path = find_file_broad(filename, drive_index)

        if src_path is None:
            not_found.append((slug, url))
            if processed % 50 == 0 or not_found and len(not_found) <= 5:
                print(f"  [{processed}/{total_broken}] NOT FOUND: {slug}/{filename}", flush=True)
            continue

        # Resize and upload
        try:
            data = resize_and_compress(src_path)
            upload_to_r2(key, data)

            if not verify_upload(key):
                upload_errors.append((slug, url, "verify failed"))
                print(f"  [{processed}/{total_broken}] VERIFY FAILED: {slug}/{filename}", flush=True)
                continue

            uploaded.append((slug, url, src_path))
            if processed % 25 == 0 or len(uploaded) <= 10:
                print(f"  [{processed}/{total_broken}] UPLOADED: {slug}/{filename} <- {os.path.basename(src_path)}", flush=True)

        except Exception as e:
            upload_errors.append((slug, url, str(e)))
            print(f"  [{processed}/{total_broken}] ERROR: {slug}/{filename}: {e}", flush=True)

print(f"\n=== UPLOAD COMPLETE ===")
print(f"Total broken: {total_broken}")
print(f"  Uploaded successfully: {len(uploaded)}")
print(f"  Not found on drive: {len(not_found)}")
print(f"  Upload errors: {len(upload_errors)}")

print(f"\nNot found ({len(not_found)}):")
for slug, url in not_found:
    filename = url.split('/')[-1]
    print(f"  {slug}: {filename}")

if upload_errors:
    print(f"\nUpload errors ({len(upload_errors)}):")
    for slug, url, err in upload_errors:
        print(f"  {slug}: {url.split('/')[-1]}: {err}")

# Save results
results = {
    'uploaded': [(s, u, p) for s, u, p in uploaded],
    'not_found': [(s, u) for s, u in not_found],
    'upload_errors': [(s, u, e) for s, u, e in upload_errors],
}
json.dump(results, open('/Users/andrewwalther/Documents/motplus/scripts/upload_results.json', 'w'), indent=2)
print("\nSaved to scripts/upload_results.json")
