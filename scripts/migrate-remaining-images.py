#!/usr/bin/env python3
"""
Migrate remaining WordPress images to Cloudflare R2 site-general bucket.
Images not yet on R2: museum, residency, and advisory program images.
"""

import boto3
import requests
import os
import mimetypes
from urllib.parse import urlparse

R2_ENDPOINT = "https://31a35595add67ae1366b3f6420432773.r2.cloudflarestorage.com"
R2_ACCESS_KEY = "83343e12beb2f0aed8d48bc3047814a2"
R2_SECRET = "8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56"
R2_BUCKET = "site-general"
R2_PUBLIC_BASE = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"

IMAGES = {
    # +1 Museum by Any Other Name
    "motplus/museum/tran-minh-duc-flowers.jpg": "https://motplusplusplus.com/wp-content/uploads/2019/04/img_3796.jpg",
    "motplus/museum/cian-duggan-entrances.jpg": "https://motplusplusplus.com/wp-content/uploads/2018/11/img_3795.jpg",
    "motplus/museum/dao-tung-it-seems-to-be.jpg": "https://motplusplusplus.com/wp-content/uploads/2018/08/img_7349-2.jpg",
    "motplus/museum/afarm-museum-2017.png": "https://motplusplusplus.com/wp-content/uploads/2017/09/screenshot-2024-11-07-at-2.36.20e280afpm-2383568636-e1730965076103.png",

    # +1 Residency (Nov-Dec 2019 cohort)
    "motplus/residency/chu-has-pei.jpg": "https://motplusplusplus.com/wp-content/uploads/2023/07/chu-has-pei_1.jpg",
    "motplus/residency/xxavier-edward-carter.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/originalphoto-598612637.522422.jpg",
    "motplus/residency/do-nguyen-lap-xuan.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/originalphoto-598614346.983115.jpg",
    "motplus/residency/samira-jamouchi.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/samira-jamouchi-big-day-of-performances-4-40-a.-farm-december-14-2019_5.jpg",
    "motplus/residency/aliansyah-caniago.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/aliansyah-caniago-___-mot-password-01_2.jpg",
    "motplus/residency/dang-thuy-anh.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/dang-thuy-anh_3-1.jpg",
    "motplus/residency/flinh.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/flinh_2.jpg",
    "motplus/residency/masayuki-miyaji.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/masayuki-miyaji-big-day-of-performances-4-40-a.-farm-december-14-2019_5-1.jpg",
    "motplus/residency/shayekh-mohammed-arif.jpg": "https://motplusplusplus.com/wp-content/uploads/2019/12/shayekh-mohammed-arif_big-day-of-performances-3_071219_1-1.jpg",
    "motplus/residency/zach-sch.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/courtesy-tanya-amador_zach-sch_bdp2_dec-01_img_9592-252045718-e1726205423138.jpg",
    "motplus/residency/ayumi-adachi.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/2_bdp1_24nov2019_ayumi-adachi_1.jpg",
    "motplus/residency/sikarnt-skoolisariyaporn.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/09/sikarnt-skoolisariyaporn_big-day-of-performance-3_071219_8.jpg",

    # +1 Art Advisory
    "motplus/advisory/post-vidai.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/08/3o0x0067-1024x683-1.jpg",
    "motplus/advisory/nguyen-art-foundation.jpg": "https://motplusplusplus.com/wp-content/uploads/2024/08/van-phuc_2.jpg",
}

def get_content_type(key, url):
    ext = os.path.splitext(key)[1].lower()
    mapping = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    return mapping.get(ext, "image/jpeg")

def main():
    s3 = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET,
        region_name="auto",
    )

    results = []
    success = 0
    fail = 0

    for r2_key, wp_url in IMAGES.items():
        # Strip query params
        clean_url = wp_url.split("?")[0]
        print(f"Downloading: {clean_url}")
        try:
            resp = requests.get(clean_url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            content_type = get_content_type(r2_key, clean_url)
            s3.put_object(
                Bucket=R2_BUCKET,
                Key=r2_key,
                Body=resp.content,
                ContentType=content_type,
            )
            r2_url = f"{R2_PUBLIC_BASE}/{r2_key}"
            print(f"  ✓ {r2_key}")
            results.append(f"  {r2_key}: {r2_url}")
            success += 1
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            results.append(f"  FAILED {r2_key}: {e}")
            fail += 1

    print(f"\n{'='*60}")
    print(f"Done: {success} success, {fail} failed")
    print("\nR2 URL map:")
    for r in results:
        print(r)

if __name__ == "__main__":
    main()
