#!/usr/bin/env python3
"""
upload-trash-images.py

Processes and uploads +1 Trash artwork images to Cloudflare R2.
- Resizes to max 1600px on longest side, JPEG quality 85
- Skips images smaller than 300px on shortest side
- Uploads to motplus/trash/[artist-slug]/[filename].jpg
- Outputs a JSON file of {key: public_url} for use by create-trash-sanity-docs.js

Usage: python3 scripts/upload-trash-images.py
"""

import boto3
import json
import os
import sys
from pathlib import Path
from PIL import Image
import io

# ── R2 config ─────────────────────────────────────────────────────────────────
ACCOUNT_ID = '31a35595add67ae1366b3f6420432773'
ACCESS_KEY = '83343e12beb2f0aed8d48bc3047814a2'
SECRET_KEY = '8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56'
BUCKET = 'site-general'
PUBLIC_URL_BASE = 'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev'
R2_PREFIX = 'motplus/trash'
MAX_PX = 1600
QUALITY = 85
MIN_SHORTEST_SIDE = 300

s3 = boto3.client(
    's3',
    endpoint_url=f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
)

# ── Image sources ──────────────────────────────────────────────────────────────
# Format: (artist_slug, dest_filename, source_path)
IMAGES = [
    # Kim Duy — Field of Shredded Paper
    ('kim-duy', 'field-of-shredded-paper-01.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Field of shredded paper.jpg'),
    ('kim-duy', 'field-of-shredded-paper-02.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Field of shredded paper1.jpg'),
    ('kim-duy', 'field-of-shredded-paper-details.jpg',
     '/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media/2024/09/field-of-shredded-paper-details.jpg'),

    # Kim Duy — Text
    ('kim-duy', 'text-01.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Text.jpg'),
    ('kim-duy', 'text-02.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Text1.jpg'),
    ('kim-duy', 'text-03.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Text2.jpg'),
    ('kim-duy', 'text-04.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Text3.jpg'),
    ('kim-duy', 'text-05.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Text4.jpg'),
    ('kim-duy', 'text-06.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Text5.jpg'),
    ('kim-duy', 'text-07.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Text6.jpg'),
    ('kim-duy', 'text-08.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Text7.jpg'),

    # Kim Duy — Untitled (untitled)
    ('kim-duy', 'untitled-untitled.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Untitled (untitled)>>>Kim Duy >>>MoT+++2018.jpg'),

    # Kim Duy — o.T
    ('kim-duy', 'ot.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/o.T>>>Kim Duy >>>MoT+++2018.jpg'),

    # Kim Duy — From Flowers to Bone (both are good size)
    ('kim-duy', 'from-flowers-to-bone-01.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/From Flowers to Bone.jpg'),
    ('kim-duy', 'from-flowers-to-bone-02.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/From Flowers to Bone1.jpg'),

    # Kim Duy — Letter to King Khai Dinh
    ('kim-duy', 'letter-to-king-khai-dinh-01.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Letter to King Khai Dinh.jpg'),
    ('kim-duy', 'letter-to-king-khai-dinh-02.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Letter to King Khai Dinh1.jpg'),
    ('kim-duy', 'letter-to-king-khai-dinh-03.jpg',
     '/Volumes/MoT/available artworks/Kim Duy/Letter to King Khai Dinh2.jpg'),

    # Wu Chi Tsung — Cyano-Collage 065
    ('wu-chi-tsung', 'cyano-collage-065-01.jpg',
     '/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media/2024/10/s_cyano-collage-001-e6b0b0e5b1b1e99b86e4b98be4b880_180x407_2016.jpg'),
    ('wu-chi-tsung', 'cyano-collage-065-02.jpg',
     '/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media/2024/10/cyano-collage-121-e6b0b0e5b1b1e99b86e4b98be4b880e799bee4ba8ce58d81e4b880_360x360-e59c93_2021.png'),

    # Wu Chi Tsung — Wire V
    ('wu-chi-tsung', 'wire-v-01.jpg',
     '/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media/2020/06/wu-chi-tsung-wire-v-40mot-astoria-4.jpg'),
    ('wu-chi-tsung', 'wire-v-02.jpg',
     '/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media/2024/10/wire-vi_2021_jing-atmospheres_sean-kelly-gallery_new-york_e990b5e7b5b2e7b6b2e585ad_e5a283_e5b09ae587b1e588a9e8979de5bb8a_e7b490e7b484.jpg'),

    # Phi Long Le — Hunting as a Metaphor for Politics
    ('phi-long-le', 'hunting-01.jpg',
     '/Volumes/MoT/available artworks/Phi Long Le/phi long Hunting as a metaphor for politics # 01.jpg'),
    ('phi-long-le', 'hunting-02.jpg',
     '/Volumes/MoT/available artworks/Phi Long Le/phi long Hunting as a metaphor for politics #2.jpg'),
    ('phi-long-le', 'hunting-03.jpg',
     '/Volumes/MoT/available artworks/Phi Long Le/phi long Hunting as a metaphor for politics # 03.jpg'),
    ('phi-long-le', 'hunting-04.jpg',
     '/Volumes/MoT/available artworks/Phi Long Le/phi long Hunting as a metaphor for politics # 04.jpg'),
    ('phi-long-le', 'hunting-05.jpg',
     '/Volumes/MoT/available artworks/Phi Long Le/phi long Hunting as a metaphor for politics # 05.jpg'),

    # Truong Tan — Untitled series
    ('truong-tan', 'untitled-000.jpg', '/tmp/truong_tan_img-000.jpg'),
    ('truong-tan', 'untitled-001.jpg', '/tmp/truong_tan_img-001.jpg'),
    ('truong-tan', 'untitled-002.jpg', '/tmp/truong_tan_img-002.jpg'),
    ('truong-tan', 'untitled-003.jpg', '/tmp/truong_tan_img-003.jpg'),
    ('truong-tan', 'untitled-004.jpg', '/tmp/truong_tan_img-004.jpg'),
    ('truong-tan', 'untitled-005.jpg', '/tmp/truong_tan_img-005.jpg'),
    ('truong-tan', 'untitled-006.jpg', '/tmp/truong_tan_img-006.jpg'),
    ('truong-tan', 'untitled-007.jpg', '/tmp/truong_tan_img-007.jpg'),
    ('truong-tan', 'untitled-008.jpg', '/tmp/truong_tan_img-008.jpg'),
    ('truong-tan', 'untitled-009.jpg', '/tmp/truong_tan_img-009.jpg'),

    # Aliansyah Caniago — Hunters and Gatherers vol. 1
    ('aliansyah-caniago', 'hunters-and-gatherers-vol1.jpg',
     '/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media/2020/06/alin_-hunters-and-gatherers-vol.-1_group-show_2020.jpg'),

    # Cam Xanh — FIO series
    ('cam-xanh', 'fio-f-for-freedom.jpg',
     '/Volumes/MoT/trash space at saigon domaine/artworks/CAM XANH FIO silk cocoons/FIO - F for freedom 2017  Marker on silk cocoons and acrylic on canvas Approx. 100 x 100 cm.jpg'),
    ('cam-xanh', 'fio-i-in-independence.jpg',
     '/Volumes/MoT/trash space at saigon domaine/artworks/CAM XANH FIO silk cocoons/FIO - I in independence 2017  Marker on silk cocoons and acrylic on canvas Approx. 100 x 100 cm .jpg'),
    ('cam-xanh', 'fio-o-off-orgasm.jpg',
     '/Volumes/MoT/trash space at saigon domaine/artworks/CAM XANH FIO silk cocoons/FIO - O off orgasm 2016.jpg'),
    ('cam-xanh', 'fio-silk-cocoons-01.jpg',
     '/Volumes/MoT/trash space at saigon domaine/artworks/CAM XANH FIO silk cocoons/FIO silk cocoons1.jpg'),
    ('cam-xanh', 'fio-silk-cocoons-02.jpg',
     '/Volumes/MoT/trash space at saigon domaine/artworks/CAM XANH FIO silk cocoons/FIO silk cocoons2.JPG'),

    # Phuong Linh — Cao Xa La
    ('phuong-linh', 'cao-xa-la-00.jpg',
     '/Volumes/MoT/available artworks/Phuong Linh /MoT+++ >>> cao - xa - la >>> Phuong Linh00.jpg'),
    ('phuong-linh', 'cao-xa-la-01.jpg',
     '/Volumes/MoT/available artworks/Phuong Linh /MoT+++ >>> cao - xa - la >>> Phuong Linh01.jpg'),
    ('phuong-linh', 'cao-xa-la-02.jpg',
     '/Volumes/MoT/available artworks/Phuong Linh /MoT+++ >>> cao - xa - la >>> Phuong Linh02.jpg'),
    ('phuong-linh', 'cao-xa-la-s2.jpg',
     '/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media/2024/10/s2_nguyen-le-phuong-linh.jpg'),
    ('phuong-linh', 'cao-xa-la-gq.jpg',
     '/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media/2020/06/gq-allergy-phuong_linh.jpg'),

    # Bang Nhat Linh — The Vacant Chair
    ('bang-nhat-linh', 'vacant-chair-01.jpg',
     '/Volumes/MoT/trash space at saigon domaine/artworks/bang nhat linh the vacant chair 30,000 USD/MoT+++P7. NhaSan Dec18-Jan8 20162.JPG'),
    ('bang-nhat-linh', 'vacant-chair-02.jpg',
     '/Volumes/MoT/trash space at saigon domaine/artworks/bang nhat linh the vacant chair 30,000 USD/MoT+++P7. NhaSan Dec18-Jan8 20163.JPG'),
    ('bang-nhat-linh', 'vacant-chair-03.jpg',
     '/Volumes/MoT/trash space at saigon domaine/artworks/bang nhat linh the vacant chair 30,000 USD/MoT+++P7. NhaSan Dec18-Jan8 20164.JPG'),
]


def process_image(source_path):
    """Load, resize, and return JPEG bytes. Returns None if too small."""
    with Image.open(source_path) as img:
        w, h = img.size
        shortest = min(w, h)
        if shortest < MIN_SHORTEST_SIDE:
            print(f'  SKIP (too small: {w}x{h})')
            return None

        # Convert to RGB (handles PNG with alpha, CMYK, etc.)
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')

        # Resize if needed
        longest = max(w, h)
        if longest > MAX_PX:
            scale = MAX_PX / longest
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            print(f'  Resized {w}x{h} → {new_w}x{new_h}')
        else:
            print(f'  Size OK: {w}x{h} (no resize needed)')

        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=QUALITY, optimize=True)
        buf.seek(0)
        return buf.read()


def upload_to_r2(key, data):
    """Upload bytes to R2, return public URL."""
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=data,
        ContentType='image/jpeg',
    )
    return f'{PUBLIC_URL_BASE}/{key}'


def main():
    results = {}  # key → public_url
    skipped = []
    errors = []

    for artist_slug, dest_filename, source_path in IMAGES:
        r2_key = f'{R2_PREFIX}/{artist_slug}/{dest_filename}'
        short_key = f'{artist_slug}/{dest_filename}'
        print(f'\n→ {short_key}')
        print(f'  Source: {source_path}')

        if not os.path.exists(source_path):
            print(f'  SKIP (file not found)')
            skipped.append(short_key)
            continue

        try:
            data = process_image(source_path)
            if data is None:
                skipped.append(short_key)
                continue

            url = upload_to_r2(r2_key, data)
            results[short_key] = url
            print(f'  Uploaded → {url}')

        except Exception as e:
            print(f'  ERROR: {e}')
            errors.append({'key': short_key, 'error': str(e)})

    # Write results JSON for the Sanity script
    output_path = Path(__file__).parent / 'trash-image-urls.json'
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f'\n{"="*60}')
    print(f'Done. {len(results)} uploaded, {len(skipped)} skipped, {len(errors)} errors.')
    print(f'URLs written to: {output_path}')

    if errors:
        print('\nErrors:')
        for e in errors:
            print(f'  {e["key"]}: {e["error"]}')

    if skipped:
        print('\nSkipped:')
        for s in skipped:
            print(f'  {s}')


if __name__ == '__main__':
    main()
