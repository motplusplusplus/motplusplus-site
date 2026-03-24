#!/usr/bin/env python3
"""
Audit all event images in events-data.json for broken URLs.
Uses boto3 head_object to check each R2 key.
"""

import json
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
import sys

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

def key_from_url(url):
    if url.startswith(R2_PUBLIC_BASE + '/'):
        return url[len(R2_PUBLIC_BASE) + 1:]
    return None

def check_key_exists(key):
    try:
        s3.head_object(Bucket=R2_BUCKET, Key=key)
        return True
    except ClientError as e:
        if e.response['Error']['Code'] in ('404', 'NoSuchKey', '403'):
            return False
        raise

data = json.load(open('/Users/andrewwalther/Documents/motplus/events-data.json'))

broken = {}  # slug -> list of broken urls
working = {}  # slug -> list of working urls
skipped = {}  # slug -> list of skipped urls (non-R2 or pattern C)

SKIP_KNOWN = {
    'motplus/events/seff-ii/17853744778575035.jpg',
    'motplus/events/seff-ii/17896999966377473.jpg',
    'motplus/events/seff-ii/18077539597127012.jpg',
    'motplus/events/seff-ii/17865890731490107.jpg',
}

total_checked = 0
total_broken = 0
total_working = 0
total_skipped = 0

print(f"Checking {sum(len(e.get('images',[])) for e in data)} images across {len([e for e in data if e.get('images')])} events...", flush=True)

for i, event in enumerate(data):
    slug = event.get('slug', f'event-{i}')
    images = event.get('images', [])
    if not images:
        continue

    for url in images:
        key = key_from_url(url)

        if key is None:
            # Non-R2 URL or different base
            skipped.setdefault(slug, []).append(url)
            total_skipped += 1
            continue

        # Skip pattern C (static assets, not event documentation)
        if key.startswith('motplus/general/') or (not key.startswith('motplus/events/') and not key.startswith('motplus/instagram/')):
            skipped.setdefault(slug, []).append(url)
            total_skipped += 1
            continue

        # Skip known missing SEFF II images
        if key in SKIP_KNOWN:
            skipped.setdefault(slug, []).append(url)
            total_skipped += 1
            continue

        total_checked += 1
        exists = check_key_exists(key)

        if exists:
            working.setdefault(slug, []).append(url)
            total_working += 1
        else:
            broken.setdefault(slug, []).append(url)
            total_broken += 1

        if total_checked % 100 == 0:
            print(f"  Checked {total_checked} so far... ({total_broken} broken)", flush=True)

print(f"\n=== AUDIT COMPLETE ===")
print(f"Total images checked (R2 event/instagram keys): {total_checked}")
print(f"  Working: {total_working}")
print(f"  Broken: {total_broken}")
print(f"  Skipped (non-R2 or static): {total_skipped}")
print(f"\nBroken by event slug:")
for slug, urls in sorted(broken.items()):
    print(f"  {slug} ({len(urls)} broken):")
    for u in urls:
        print(f"    {u}")

# Save results
results = {
    'broken': broken,
    'working': working,
    'skipped': skipped,
    'total_checked': total_checked,
    'total_broken': total_broken,
    'total_working': total_working,
    'total_skipped': total_skipped,
}
json.dump(results, open('/Users/andrewwalther/Documents/motplus/scripts/audit_results.json', 'w'), indent=2)
print("\nResults saved to scripts/audit_results.json")
