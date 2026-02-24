#!/usr/bin/env python3
"""
MoT+++ image migration: WordPress CDN → Cloudflare R2 site-general bucket.

Each entry: (source_url, r2_key)
- source_url: original WordPress CDN URL
- r2_key:     path inside the bucket (no leading slash)

After upload, the public URL will be:
  https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/<r2_key>
"""

import boto3
import urllib.request
import urllib.error
import os
import sys
import mimetypes
import time

# ── R2 credentials ────────────────────────────────────────────────────────────
ACCOUNT_ID   = "31a35595add67ae1366b3f6420432773"
ACCESS_KEY   = "83343e12beb2f0aed8d48bc3047814a2"
SECRET_KEY   = "8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56"
BUCKET       = "site-general"
R2_ENDPOINT  = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"
PUBLIC_BASE  = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"
TMP_DIR      = "/tmp/motplus-img-migration"

# ── Full image manifest ────────────────────────────────────────────────────────
# Format: (source_url, r2_key)
# WordPress ?w= query params are stripped automatically during download.
MANIFEST = [

    # ── COLLECTIVE ─────────────────────────────────────────────────────────────

    # Aliansyah Caniago
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/aliansyah-caniago-portrait-edited.jpg",
     "motplus/collective/aliansyah-caniago/portrait.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/image_1236502914-2880735566-e1729230292790.jpg",
     "motplus/collective/aliansyah-caniago/work-01.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/image_1236502911.jpg",
     "motplus/collective/aliansyah-caniago/work-02.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/image_123650291.jpg",
     "motplus/collective/aliansyah-caniago/work-03.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/image_67156993.jpg",
     "motplus/collective/aliansyah-caniago/work-04.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/image_1236502912.jpg",
     "motplus/collective/aliansyah-caniago/work-05.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/image_1236502913.jpg",
     "motplus/collective/aliansyah-caniago/work-06.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/image_1236502915.jpg",
     "motplus/collective/aliansyah-caniago/work-07.jpg"),

    # Cam Xanh
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/whatsapp-image-2024-10-24-at-14.24.32.jpeg",
     "motplus/collective/cam-xanh/portrait.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2019/12/originalphoto-598620532.837176-2689450228-e1729755540751.jpeg",
     "motplus/collective/cam-xanh/work-01.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2017/09/north-60cm-x-60cm-x-10cm-marker-on-silk-cocoons-wood-and-plexiglass-box-2017-4235313200-e1729755579994.jpg",
     "motplus/collective/cam-xanh/work-02.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2017/09/twannual-2nd-september-2017-_home-_-nha5.jpg",
     "motplus/collective/cam-xanh/work-03.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2019/06/cam-xanh-mot-doi-gai-999-9-clouds-2886507088-e1729755624783.jpeg",
     "motplus/collective/cam-xanh/work-04.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2019/06/cam-xanh-instagram-entrance-for-mot-doi-gai.jpg",
     "motplus/collective/cam-xanh/work-05.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2019/06/cam-xanh-mot-doi-gai-flower-market1-2165958030-e1729755650679.jpg",
     "motplus/collective/cam-xanh/work-06.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2019/12/whatsapp-image-2019-12-03-at-17.14.55-2163963779-e1729755729877.jpeg",
     "motplus/collective/cam-xanh/work-07.jpg"),

    # Cian Duggan
    ("https://motplusplusplus.com/wp-content/uploads/2024/11/whatsapp-image-2024-11-01-at-14.20.05.jpeg",
     "motplus/collective/cian-duggan/portrait.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/11/othermother-2019-enamel-on-concrete.jpg",
     "motplus/collective/cian-duggan/work-01.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/11/ever-matter-no-matter-triptych-2022-enamel-on-uv-printed-plexiglass-100cm-x-168cm-3-panels.jpg",
     "motplus/collective/cian-duggan/work-02.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/11/birdsong-breath-2023-enamel-on-plexiglass-40-cm-x-50-cm.jpg",
     "motplus/collective/cian-duggan/work-03.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/11/a-new-smell-of-salty-soil-2023-enamel-on-uv-printed-plexiglass-125cm-x-100cm.jpg",
     "motplus/collective/cian-duggan/work-04.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/11/a-glass-passage-2022-enamel-on-uv-printed-plexiglass-50cm-x-40cm.jpg",
     "motplus/collective/cian-duggan/work-05.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/11/a-fragrant-cave-2023-enamel-on-plexiglass-40cm-x-50cm.jpg",
     "motplus/collective/cian-duggan/work-06.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/11/singing-for-the-sirens-2023-enamel-on-uv-printed-plexiglass-100cm-x-149cm.jpg",
     "motplus/collective/cian-duggan/work-07.jpg"),

    # Kim Duy
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/17373363_1665984906762617_639537065_o-edited.jpg",
     "motplus/collective/kim-duy/portrait.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/field-of-schredded-paper-installation-view.jpg",
     "motplus/collective/kim-duy/work-01.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/field-of-shredded-paper-details.jpg",
     "motplus/collective/kim-duy/work-02.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/img_6168.jpg",
     "motplus/collective/kim-duy/work-03.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/vietnamese-dictionary-1-edited.jpg",
     "motplus/collective/kim-duy/work-04.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/vietnamese-dictionary.jpg",
     "motplus/collective/kim-duy/work-05.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/a.b.s.t.r.a.c.t.i.o.n-installation-view1.jpg",
     "motplus/collective/kim-duy/work-06.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/a.b.s.t.r.a.c.t.i.o.n-installation-view2.jpg",
     "motplus/collective/kim-duy/work-07.jpg"),

    # Le Phi Long
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/received_584807488780020-edited.jpeg",
     "motplus/collective/le-phi-long/portrait.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/visibleinvisible-map201804.2018-2280634525-e1727244185794.jpeg",
     "motplus/collective/le-phi-long/work-01.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/hic-domus-est-dei_phi-long-le-artist_01-3675252259-e1727244232397.png",
     "motplus/collective/le-phi-long/work-02.png"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/image-8-1941942321-e1727244245862.jpeg",
     "motplus/collective/le-phi-long/work-03.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/image-3309110367-e1727244252660.jpeg",
     "motplus/collective/le-phi-long/work-04.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/img_1828-1221126439-e1727244263961.jpeg",
     "motplus/collective/le-phi-long/work-05.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/dscf7179-2-1865375392-e1727244299121.jpeg",
     "motplus/collective/le-phi-long/work-06.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/in02-850585292-e1727244344399.jpeg",
     "motplus/collective/le-phi-long/work-07.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/img_3680.jpeg",
     "motplus/collective/le-phi-long/work-08.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/dscf7129-2385631041-e1727244388773.jpeg",
     "motplus/collective/le-phi-long/work-09.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/09/hic-domus-est-dei_phi-long-le-artist_010-1449632181-e1727244407852.png",
     "motplus/collective/le-phi-long/work-10.png"),

    # Wu Chi-Tsung
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/2019-dust_light-interdiction_kunstfest-weimar_germany_03credit-to-sylvia-lee-edited.jpg",
     "motplus/collective/wu-chi-tsung/portrait.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/wire-vi_2021_jing-atmospheres_sean-kelly-gallery_new-york_e990b5e7b5b2e7b6b2e585ad_e5a283_e5b09ae587b1e588a9e8979de5bb8a_e7b490e7b484-1.jpg",
     "motplus/collective/wu-chi-tsung/work-01.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/dust-002-40-basel-unlimited-2023-01s-1-4248789341-e1729234295339.jpg",
     "motplus/collective/wu-chi-tsung/work-02.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/drawing-studies-1.jpg",
     "motplus/collective/wu-chi-tsung/work-03.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/cc00340measurement-of-the-other-e28093-contemporary-art-from-taiwan-soka-art-center-beijing-cn_2010-1.jpg",
     "motplus/collective/wu-chi-tsung/work-04.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/s_cyano-collage-024e6b0b0e5b1b1e99b86e4b98be4ba8ce58d81e59b9b_180x360_2018-1.jpg",
     "motplus/collective/wu-chi-tsung/work-05.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/s_cyano-collage-001-e6b0b0e5b1b1e99b86e4b98be4b880_180x407_2016-1.jpg",
     "motplus/collective/wu-chi-tsung/work-06.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/cyano-collage-121-e6b0b0e5b1b1e99b86e4b98be4b880e799bee4ba8ce58d81e4b880_360x360-e59c93_2021.png",
     "motplus/collective/wu-chi-tsung/work-07.png"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/s_wrinkled-texture-127-e79ab4e6b395e7bf92e4bd9c127_72x88cm_2022-1.jpg",
     "motplus/collective/wu-chi-tsung/work-08.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/s_wrinkled-texture-96_e79ab4e6b395e7bf92e4bd9c-96_92x44.1_2021-1.jpg",
     "motplus/collective/wu-chi-tsung/work-09.jpg"),

    # ── MOTSOUND ───────────────────────────────────────────────────────────────

    ("https://motplusplusplus.com/wp-content/uploads/2025/09/fb-event-2.jpg",
     "motplus/motsound/25-poster.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2024/10/sketch-for-future-basketball_ig1-2388393968-e1730358066394.jpg",
     "motplus/motsound/24-poster.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/07/dscf5259.jpg",
     "motplus/motsound/24-photo-01.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/07/dscf5195.jpg",
     "motplus/motsound/24-photo-02.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/07/dscf5199.jpg",
     "motplus/motsound/24-photo-03.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/07/dscf5202.jpg",
     "motplus/motsound/24-photo-04.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/07/dscf5220.jpg",
     "motplus/motsound/24-photo-05.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/07/dscf5239.jpg",
     "motplus/motsound/24-photo-06.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/07/dscf5242.jpg",
     "motplus/motsound/24-photo-07.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/07/dscf5255.jpg",
     "motplus/motsound/24-photo-08.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2024/10/20240412_211218.jpg",
     "motplus/motsound/23-poster.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/20240412_200311.jpg",
     "motplus/motsound/23-photo-01.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/20240412_204540.jpg",
     "motplus/motsound/23-photo-02.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/20240412_214649.jpg",
     "motplus/motsound/23-photo-03.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/20240412_223022.jpg",
     "motplus/motsound/23-photo-04.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/04/screenshot_20241031_145605_gallery.jpg",
     "motplus/motsound/23-photo-05.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/04/screenshot_20241031_145624_gallery.jpg",
     "motplus/motsound/23-photo-06.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2024/10/screen-shot-2024-10-31-at-15.29.03-326233084-e1730363417415.png",
     "motplus/motsound/22-poster.png"),

    ("https://motplusplusplus.com/wp-content/uploads/2024/10/screen-shot-2024-10-31-at-16.06.57-2048950795-e1730365890397.png",
     "motplus/motsound/21-poster.png"),

    ("https://motplusplusplus.com/wp-content/uploads/2024/10/screen-shot-2024-10-31-at-15.23.46.png",
     "motplus/motsound/20-poster.png"),

    ("https://motplusplusplus.com/wp-content/uploads/2020/11/dscf4697-1.jpg",
     "motplus/motsound/16-poster.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2020/09/motsound-15-arenaissance-newsletter-copy-01-2115828726-e1730960447253.jpg",
     "motplus/motsound/15-poster.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2020/02/screenshot-2024-11-07-at-1.25.37e280afpm-3200530695-e1730961079716.png",
     "motplus/motsound/14-poster.png"),

    ("https://motplusplusplus.com/wp-content/uploads/2020/01/screenshot-2024-11-07-at-1.28.16e280afpm-870710423-e1730961344873.png",
     "motplus/motsound/13-poster.png"),

    ("https://motplusplusplus.com/wp-content/uploads/2019/12/img_3791-1941243902-e1730961162660.jpg",
     "motplus/motsound/12-poster.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2019/08/motsound_11_2.jpg",
     "motplus/motsound/11-poster.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2019/04/79c2290b-aed7-4a92-937b-aad395c3cf7f.jpg",
     "motplus/motsound/10-poster.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2019/03/linhhafornow_2_20181202-e6b5a3e88e8e-1.jpg",
     "motplus/motsound/09-poster.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2024/11/originalphoto-555680801.436318-2274474061-e1730961975834.jpg",
     "motplus/motsound/08-poster.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2018/05/screenshot-2024-11-07-at-1.53.38e280afpm-4080227694-e1730962647391.png",
     "motplus/motsound/06-poster.png"),

    ("https://motplusplusplus.com/wp-content/uploads/2018/03/img_3793-2646304466-e1730963326520.jpg",
     "motplus/motsound/04-poster.jpg"),

    ("https://motplusplusplus.com/wp-content/uploads/2017/05/motso1.jpg",
     "motplus/motsound/01-poster.jpg"),

    # ── HOMEPAGE / GENERAL ─────────────────────────────────────────────────────
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/20240521_204150-e1748507392604.jpg",
     "motplus/general/homepage-programs.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/20240208_205134.jpg",
     "motplus/general/homepage-residents.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/20240314_193142.jpg",
     "motplus/general/homepage-events.jpg"),
    ("https://motplusplusplus.com/wp-content/uploads/2024/10/a.farmlogo_500x500-1-2.jpg",
     "motplus/general/afarm-logo.jpg"),
]


def strip_query(url):
    """Remove ?w= and other query params from WordPress URLs."""
    return url.split("?")[0]


def content_type(r2_key):
    ext = os.path.splitext(r2_key)[1].lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(ext, "image/jpeg")


def download(url, local_path):
    clean_url = strip_query(url)
    req = urllib.request.Request(clean_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    with open(local_path, "wb") as f:
        f.write(data)
    return len(data)


def main():
    os.makedirs(TMP_DIR, exist_ok=True)

    s3 = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name="auto",
    )

    total = len(MANIFEST)
    ok = 0
    failed = []
    url_map = {}  # old_url → new_r2_url

    print(f"\n{'─'*60}")
    print(f"  MoT+++ image migration → R2 site-general")
    print(f"  {total} images to process")
    print(f"{'─'*60}\n")

    for i, (src_url, r2_key) in enumerate(MANIFEST, 1):
        local_file = os.path.join(TMP_DIR, r2_key.replace("/", "_"))
        new_url = f"{PUBLIC_BASE}/{r2_key}"
        clean_src = strip_query(src_url)

        print(f"[{i:3}/{total}] {r2_key}")

        try:
            # Download
            size = download(src_url, local_file)

            # Upload
            with open(local_file, "rb") as f:
                s3.put_object(
                    Bucket=BUCKET,
                    Key=r2_key,
                    Body=f,
                    ContentType=content_type(r2_key),
                )

            size_kb = size / 1024
            print(f"         ✓  {size_kb:.0f} KB → {new_url}")
            url_map[clean_src] = new_url
            # also map the ?w= variant
            url_map[src_url] = new_url
            ok += 1

        except Exception as e:
            print(f"         ✗  FAILED: {e}")
            failed.append((src_url, r2_key, str(e)))

        time.sleep(0.1)  # polite rate limiting

    print(f"\n{'─'*60}")
    print(f"  Done: {ok}/{total} uploaded successfully")
    if failed:
        print(f"  Failed ({len(failed)}):")
        for url, key, err in failed:
            print(f"    {key}: {err}")
    print(f"{'─'*60}\n")

    # Write URL map for code patching step
    map_path = os.path.join(TMP_DIR, "url_map.txt")
    with open(map_path, "w") as f:
        for old, new in url_map.items():
            f.write(f"{old}\t{new}\n")
    print(f"URL map written to: {map_path}")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
