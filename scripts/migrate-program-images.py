#!/usr/bin/env python3
"""
Migrate contemporary project and performance program images to R2.
"""

import boto3
import requests
import os

R2_ENDPOINT = "https://31a35595add67ae1366b3f6420432773.r2.cloudflarestorage.com"
R2_ACCESS_KEY = "83343e12beb2f0aed8d48bc3047814a2"
R2_SECRET = "8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56"
R2_BUCKET = "site-general"
R2_PUBLIC_BASE = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"

IMAGES = {
    # +1 Contemporary Project (12 exhibitions, one image each)
    "motplus/contemporary/tuyp-tran-once-upon-a-time.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2024/08/strings-of-destiny.jpg",
    "motplus/contemporary/girl-in-red.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2023/11/img_3794-65008497-e1730963939983.jpg",
    "motplus/contemporary/love-in-time-of-cholera.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2022/10/20221007_201317.jpg",
    "motplus/contemporary/reunification-flowers.png":
        "https://motplusplusplus.com/wp-content/uploads/2022/09/screenshot-2024-11-07-at-1.23.37e280afpm-1375313127-e1730963677668.png",
    "motplus/contemporary/swab-barcelona-2020.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2020/10/g3a1327.jpg",
    "motplus/contemporary/password-01.png":
        "https://motplusplusplus.com/wp-content/uploads/2020/06/ly-hoang-ly_faithfully-flat_1.png",
    "motplus/contemporary/frozen-data-lananh-le.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2020/01/aqua4-1.jpg",
    "motplus/contemporary/othermother-cian-duggan.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/10/dscf0937.jpg",
    "motplus/contemporary/rainy-season-kim-duy.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/09/kim-duy-mot-studio-image.jpg",
    "motplus/contemporary/mot-doi-gai-cam-xanh.jpeg":
        "https://motplusplusplus.com/wp-content/uploads/2019/06/cam-xanh-mot-doi-gai-999-9-clouds-2886507088-e1729755624783.jpeg",
    "motplus/contemporary/home-land-taiwan-2017.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2017/09/twannual-2nd-september-2017-_home-_-nha5.jpg",
    "motplus/contemporary/regis-golay-renaissance.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2017/07/regis-golay-room-at-renaissance_3-2-277155804-e1730963920785.jpg",

    # +1 Performance / Nice Place for Experimentation (15 images)
    "motplus/performance/dusk-dance-01.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2020/02/unnamed-1.jpg",
    "motplus/performance/dusk-dance-emmanuelle-huynh.jpeg":
        "https://motplusplusplus.com/wp-content/uploads/2020/02/img_6810.jpeg",
    "motplus/performance/bdp5.jpeg":
        "https://motplusplusplus.com/wp-content/uploads/2019/12/originalphoto-598620532.837176-2689450228-e1729755540751.jpeg",
    "motplus/performance/maria-sowter-little-night.jpeg":
        "https://motplusplusplus.com/wp-content/uploads/2019/12/maria-sowter_the-diary-of-anais-nin-volume-two-sometimes-looking-out-is-looking-in_191219_2.jpeg",
    "motplus/performance/xxavier-edward-carter-bdp4.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/12/xxavier-edward-carter-big-day-of-performances-4-40-a.-farm-december-14-2019_6.jpg",
    "motplus/performance/tanya-amador-round-table.jpeg":
        "https://motplusplusplus.com/wp-content/uploads/2019/12/whatsapp-image-2019-12-03-at-17.14.55-2163963779-e1729755729877.jpeg",
    "motplus/performance/shayekh-bdp3.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/12/shayekh-mohammed-arif_big-day-of-performances-3_071219_1-1.jpg",
    "motplus/performance/cam-xanh-chaoart.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/12/img_1003-3812557717-e1730964129698.jpg",
    "motplus/performance/performance-plus-2019.png":
        "https://motplusplusplus.com/wp-content/uploads/2019/12/screenshot-2024-11-07-at-2.23.43e280afpm-4290034923-e1730964319332.png",
    "motplus/performance/bdp1-opening.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/11/img_5551.jpg",
    "motplus/performance/mi-mimi-poetry-plus.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/11/mi-mimi_poetry-reading_1-1.jpg",
    "motplus/performance/ayumi-adachi-bdp1.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/11/5_bdp1_24nov2019_ayumi-adachi_4.jpg",
    "motplus/performance/bdp2-tanya-amador.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/12/originalphoto-598612484.014836.jpg",
    "motplus/performance/cam-xanh-run-run-run.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/04/471c4e61-22da-4379-b153-8cf8a51c30ad-1-3989871849-e1730964631932.jpg",
    "motplus/performance/artist-talk-singapore-2019.jpg":
        "https://motplusplusplus.com/wp-content/uploads/2019/01/artists-talk-singapore_2019-01-25_tanya-amador_p2.jpg",
}

def get_content_type(key):
    ext = os.path.splitext(key)[1].lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(ext, "image/jpeg")

def main():
    s3 = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET,
        region_name="auto",
    )

    success, fail = 0, 0
    url_map = []

    for r2_key, wp_url in IMAGES.items():
        clean_url = wp_url.split("?")[0]
        print(f"Downloading: {clean_url}")
        try:
            resp = requests.get(clean_url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            s3.put_object(
                Bucket=R2_BUCKET,
                Key=r2_key,
                Body=resp.content,
                ContentType=get_content_type(r2_key),
            )
            r2_url = f"{R2_PUBLIC_BASE}/{r2_key}"
            print(f"  ✓ {r2_key}")
            url_map.append((r2_key, r2_url))
            success += 1
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            fail += 1

    print(f"\n{'='*60}")
    print(f"Done: {success} success, {fail} failed")
    print("\nR2 URLs:")
    for key, url in url_map:
        print(f"  {key}: {url}")

if __name__ == "__main__":
    main()
