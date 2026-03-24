#!/usr/bin/env python3
"""
Build an index of all image files on the external drive for fast lookup.
"""
import os
import json
import subprocess

def build_index():
    """Build a dict: filename (lowercase) -> list of full paths"""
    index = {}

    # Primary search locations
    search_dirs = [
        "/Volumes/MoT/EXPORTED DATA/exported from instagram/instagram-a.farm.saigon-2026-03-16-rm8HxNgw",
        "/Volumes/MoT/EXPORTED DATA/exported from instagram/instagram-motplusplusplus-2026-03-16-ExKPitQg",
        "/Volumes/MoT/EXPORTED DATA/exported from google drive a.farm",
        "/Volumes/MoT/EXPORTED DATA/wordpress",
        "/Volumes/MoT",  # Also search rest of drive
    ]

    print("Building drive file index...", flush=True)

    # Use find to recursively list all jpg/jpeg/png files
    # But limit /Volumes/MoT search depth to avoid redundancy
    all_files = set()

    for search_dir in search_dirs[:4]:  # First 4 dirs fully
        if not os.path.exists(search_dir):
            print(f"  Skipping (not found): {search_dir}")
            continue
        print(f"  Indexing: {search_dir}")
        result = subprocess.run(
            ['find', search_dir, '-type', 'f', '(', '-iname', '*.jpg', '-o', '-iname', '*.jpeg', '-o', '-iname', '*.png', ')'],
            capture_output=True, text=True
        )
        for line in result.stdout.splitlines():
            line = line.strip()
            if line:
                all_files.add(line)

    # Also search specific other parts of the drive
    other_dirs = [
        "/Volumes/MoT/event @centec 21:12:22",
        "/Volumes/MoT/4M photography",
        "/Volumes/MoT/alexia",
        "/Volumes/MoT/artist talk",
        "/Volumes/MoT/available artworks",
        "/Volumes/MoT/CAM XANH",
        "/Volumes/MoT/CAM XANH FOR TAIPEI EXHIBITION 2021",
        "/Volumes/MoT/HA password01 performance",
        "/Volumes/MoT/Gioi thieu ve MoT+++",
    ]
    for d in other_dirs:
        if os.path.exists(d):
            print(f"  Indexing: {d}")
            result = subprocess.run(
                ['find', d, '-type', 'f', '(', '-iname', '*.jpg', '-o', '-iname', '*.jpeg', '-o', '-iname', '*.png', ')'],
                capture_output=True, text=True
            )
            for line in result.stdout.splitlines():
                line = line.strip()
                if line:
                    all_files.add(line)

    print(f"  Found {len(all_files)} total image files")

    # Build index by filename (lowercase)
    for path in all_files:
        filename = os.path.basename(path).lower()
        # Also strip extension variants
        name_no_ext = os.path.splitext(filename)[0]

        if filename not in index:
            index[filename] = []
        index[filename].append(path)

    print(f"  Unique filenames: {len(index)}")
    return index

if __name__ == '__main__':
    index = build_index()
    json.dump(index, open('/Users/andrewwalther/Documents/motplus/scripts/drive_index.json', 'w'), indent=2)
    print("Saved to scripts/drive_index.json")
