#!/usr/bin/env python3
"""
Extract A.Farm resident portraits from WordPress media folder and upload to R2.
"""

import json
import os
import subprocess
import shutil
from pathlib import Path

# Paths
ARTISTS_JSON = "/Users/andrewwalther/Documents/motplus/artists-data.json"
MEDIA_DIR = "/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media/2024/10"
R2_BASE = "motplus/artists"
R2_PUBLIC_URL = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"

# Local file mapping from WordPress media export
# Pattern: s{season}_{slug}.{ext} -> slug
PORTRAIT_FILES = {
    "bagus-mazasupa-anwarridwan": "s0_bagus-mazasupa-anwarridwan.jpg",
    "ben-valentine": "s0_ben-valentine.jpg",
    "cian-duggan": "s0_cian-duggan.jpg",
    "john-edmond-smyth": "s0_john-edmond-smyth.jpg",
    "kim-duy": "s0_kim-duy.jpg",
    "latthapon-korkiatarkul": "s0_latthapon-korkiatarkul.jpg",
    "luca-lum": "s0_luca-lum.jpg",
    "maung-day": "s0_maung-day.jpg",
    "nguyen-duc-phuong": "s0_nguyen-duc-phuong.jpg",
    "tram-luong": "s0_tram-luong.jpg",
    "tricia-nguyen-thanh-trang": "s0_tricia-nguyen-thanh-trang.jpg",
    "alisa-chunchue": "s1_alisa-chunchue.jpg",
    "constance-meffre": "s1_constance-meffre.jpg",
    "cora-von-zezschwitz-tilman-hoepfl": "s1_cora-von-zezschwitz-tilman-hoepfl.jpg",
    "karen-thao-nguyen-la": "s1_karen-thao-nguyen-la.png",
    "lan-anh-le": "s1_lan-anh-le.jpg",
    "lem-trag": "s1_lem-trag.jpg",
    "mariana-tubio-blasio": "s1_mariana-tubio-blasio.jpg",
    "matthew-brannon": "s1_matthew-brannon.jpg",
    "natalia-ludmila": "s1_natalia-ludmila.jpg",
    "scott-anderson": "s1_scott-anderson.jpg",
    "scott-farrand": "s1_scott-farrand.jpg",
    "tuyen-nguyen": "s1_tuyen-nguyen.png",
    "z1-studio": "s1_z1-studio.jpg",
    "aram-han-sifuentes": "s2_aram-han-sifuentes.jpg",
    "eden-barrena": "s2_eden-barrena.jpg",
    "kanich-khajohnsri": "s2_kanich-khajohnsri-.jpg",
    "levi-masuli": "s2_levi-masuli.jpg",
    "matteo-biella": "s2_matteo-biella.jpg",
    "nguyen-le-phuong-linh": "s2_nguyen-le-phuong-linh.jpg",
    "rachel-tonthat": "s2_rachel-tonthat.jpg",
    "roberto-sifuentes": "s2_roberto-sifuentes.jpg",
    "tina-thu": "s2_tina-thu.jpg",
    "weston-teruya": "s2_weston-teruya.jpg",
    "chu-hao-pei": "s3_chu-hao-pei.jpg",
    "claire-bloomfield": "s3_claire-bloomfield.jpg",
    "kayla-kurin": "s3_kayla-kurin.jpg",
    "ly-trang": "s3_ly-trang.jpg",
    "nghia-dang": "s3_nghia-dang.png",
    "saverio-tonoli": "s3_saverio-tonoli.jpg",
    "yeonjeong": "s3_yeonjeong.jpg",
    "espen-iden": "s4_espen-iden.jpg",
    "damon-duc-pham": "s5_damon-duc-pham.png",
    "david-willis": "s5_david-willis.jpg",
}

def upload_to_r2(local_path, r2_key):
    """Upload file to R2 using wrangler."""
    content_type = "image/jpeg"
    if local_path.endswith(".png"):
        content_type = "image/png"

    cmd = [
        "npx", "wrangler", "r2", "object", "put",
        f"site-general/{r2_key}",
        "--file", local_path,
        "--content-type", content_type,
        "--remote"
    ]
    env = os.environ.copy()
    env["CLOUDFLARE_ACCOUNT_ID"] = "31a35595add67ae1366b3f6420432773"
    env["CLOUDFLARE_API_TOKEN"] = "0y5cIePwh8kUz1aBnCZmYIuFJF1IVarrr7RDvWrD"

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env, cwd="/Users/andrewwalther/Documents/motplus")
        if result.returncode == 0:
            return True
        else:
            print(f"  R2 upload failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"  R2 upload error: {e}")
        return False

def main():
    # Load artists data
    with open(ARTISTS_JSON, 'r') as f:
        artists = json.load(f)

    # Build slug -> artist index
    artist_by_slug = {a['slug']: a for a in artists}

    # Process each slug with a portrait file
    updated = []
    for slug, filename in PORTRAIT_FILES.items():
        ext = ".jpg"  # Default to jpg
        if filename.endswith(".png"):
            ext = ".png"

        # Check if artist exists
        if slug not in artist_by_slug:
            print(f"Slug '{slug}' not found in artists-data.json")
            continue

        artist = artist_by_slug[slug]

        # Skip if already has photo
        if artist.get('photo'):
            print(f"Skipping {slug} - already has photo")
            continue

        # Check if source file exists
        local_path = os.path.join(MEDIA_DIR, filename)
        if not os.path.exists(local_path):
            print(f"Source file not found: {local_path}")
            continue

        print(f"Processing: {slug}")

        # Upload to R2
        r2_key = f"{R2_BASE}/{slug}/portrait{ext}"
        if not upload_to_r2(local_path, r2_key):
            continue

        # Update artist record
        photo_url = f"{R2_PUBLIC_URL}/{r2_key}"
        artist['photo'] = photo_url
        updated.append(slug)
        print(f"  -> {photo_url}")

    # Save updated artists data
    if updated:
        with open(ARTISTS_JSON, 'w') as f:
            json.dump(artists, f, indent=2)
        print(f"\nUpdated {len(updated)} artists with portraits")
    else:
        print("\nNo updates made")

if __name__ == "__main__":
    main()
