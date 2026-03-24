#!/usr/bin/env python3
"""
Update events-data.json: remove URLs that couldn't be found on the drive.
"""

import json
import shutil
from datetime import datetime

# Load not-found list
upload_results = json.load(open('/Users/andrewwalther/Documents/motplus/scripts/upload_results.json'))
not_found_urls = set(url for slug, url in upload_results['not_found'])

print(f"URLs to remove: {len(not_found_urls)}")

# Load events data
events_data = json.load(open('/Users/andrewwalther/Documents/motplus/events-data.json'))

# Backup
backup_path = f'/Users/andrewwalther/Documents/motplus/events-data.json.backup-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
shutil.copy('/Users/andrewwalther/Documents/motplus/events-data.json', backup_path)
print(f"Backup saved to: {backup_path}")

# Update each event
removed_count = 0
affected_events = []

for event in events_data:
    slug = event.get('slug', '')
    images = event.get('images', [])
    if not images:
        continue

    new_images = [url for url in images if url not in not_found_urls]
    removed = len(images) - len(new_images)

    if removed > 0:
        event['images'] = new_images
        removed_count += removed
        affected_events.append((slug, removed, len(new_images)))
        print(f"  {slug}: removed {removed} URLs, {len(new_images)} remain")

print(f"\nTotal removed: {removed_count}")
print(f"Events affected: {len(affected_events)}")

# Also verify that not_found URLs aren't referenced anywhere else
all_remaining_images = []
for event in events_data:
    all_remaining_images.extend(event.get('images', []))

# Check nothing from not_found remains
remaining_broken = [url for url in all_remaining_images if url in not_found_urls]
print(f"Remaining references to not-found URLs: {len(remaining_broken)}")
for url in remaining_broken:
    print(f"  STILL PRESENT: {url}")

# Save updated data
with open('/Users/andrewwalther/Documents/motplus/events-data.json', 'w', encoding='utf-8') as f:
    json.dump(events_data, f, ensure_ascii=False, indent=2)

print(f"\nevents-data.json updated successfully.")

# Final stats
total_images = sum(len(e.get('images', [])) for e in events_data)
events_with_images = len([e for e in events_data if e.get('images')])
print(f"Final state: {len(events_data)} events, {events_with_images} with images, {total_images} total image URLs")
