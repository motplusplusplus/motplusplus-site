#!/usr/bin/env python3
"""
batch-upload-images.py

Uploads documentation photos to Sanity for multiple events.
Fixes the Causal Capture conflict (moves DSCF photos to x-o/exxonnubile bio pages).

SAFE BY DEFAULT — pass --run to apply changes.

Usage:
  python3 scripts/batch-upload-images.py           # dry run
  python3 scripts/batch-upload-images.py --run     # live
"""
import sys, os, json, time
from pathlib import Path
from io import BytesIO

try:
    from PIL import Image
    import requests
except ImportError:
    print("pip install Pillow requests")
    sys.exit(1)

DRY_RUN      = "--run" not in sys.argv
SANITY_TOKEN = os.environ.get("SANITY_WRITE_TOKEN", "")
PROJECT_ID   = "t5nsm79o"
DATASET      = "production"
API_VERSION  = "2026-03-20"
SANITY_API   = f"https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}"
MAX_PX       = 1600
QUALITY      = 85
WP           = Path("/Volumes/MoT/EXPORTED DATA/wordpress/wordpress-media")

# ──────────────────────────────────────────────────────────────
# Helper: convert any image to JPEG bytes
# ──────────────────────────────────────────────────────────────
def to_jpeg(path: Path) -> bytes:
    img = Image.open(path).convert("RGB")
    if max(img.size) > MAX_PX:
        img.thumbnail((MAX_PX, MAX_PX), Image.LANCZOS)
    out = BytesIO()
    img.save(out, format="JPEG", quality=QUALITY, optimize=True)
    return out.getvalue()

# ──────────────────────────────────────────────────────────────
# Helper: upload a file to Sanity, return asset _id
# ──────────────────────────────────────────────────────────────
def upload_image(path: Path) -> str:
    jpg = to_jpeg(path)
    resp = requests.post(
        f"{SANITY_API}/assets/images/{DATASET}",
        headers={"Authorization": f"Bearer {SANITY_TOKEN}",
                 "Content-Type": "image/jpeg",
                 "X-Sanity-Label": path.stem + ".jpg"},
        data=jpg, timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["document"]["_id"]

# ──────────────────────────────────────────────────────────────
# Helper: get a document's _id and current uploadedImages
# ──────────────────────────────────────────────────────────────
def get_doc(slug: str):
    query = f'*[_type=="event" && slug.current=="{slug}"][0]{{_id, uploadedImages}}'
    resp = requests.get(
        f"{SANITY_API}/data/query/{DATASET}",
        params={"query": query},
        headers={"Authorization": f"Bearer {SANITY_TOKEN}"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("result")

# ──────────────────────────────────────────────────────────────
# Helper: patch uploadedImages on a doc
# ──────────────────────────────────────────────────────────────
def set_images(doc_id: str, asset_ids: list):
    images = [{"_type": "image", "asset": {"_type": "reference", "_ref": aid}} for aid in asset_ids]
    mutation = {"mutations": [{"patch": {"id": doc_id, "set": {"uploadedImages": images}}}]}
    resp = requests.post(
        f"{SANITY_API}/data/mutate/{DATASET}",
        headers={"Authorization": f"Bearer {SANITY_TOKEN}", "Content-Type": "application/json"},
        json=mutation, timeout=30,
    )
    resp.raise_for_status()

# ──────────────────────────────────────────────────────────────
# Helper: append new images to existing uploadedImages
# ──────────────────────────────────────────────────────────────
def append_images(doc_id: str, existing: list, new_asset_ids: list):
    existing_ids = [img["asset"]["_ref"] for img in (existing or []) if img.get("asset")]
    all_ids = existing_ids + [aid for aid in new_asset_ids if aid not in existing_ids]
    set_images(doc_id, all_ids)

# ══════════════════════════════════════════════════════════════
# BATCH DEFINITIONS
# Each batch: (slug, [file paths], description)
# ══════════════════════════════════════════════════════════════

def get_batches():
    WP_OCT25 = WP / "2025/10"
    WP_JUN25 = WP / "2025/06"
    WP_JUL25 = WP / "2025/07"
    WP_AUG25 = WP / "2025/08"
    WP_SEP24 = WP / "2024/09"
    WP_OCT24 = WP / "2024/10"
    WP_NOV24 = WP / "2024/11"
    WP_NOV25 = WP / "2025/11"
    WP_FEB25 = WP / "2025/02"
    WP_APR25 = WP / "2025/04"
    IG_MOTPLUS = Path("/Volumes/MoT/EXPORTED DATA/exported from instagram/instagram-motplusplusplus-2026-03-16-ExKPitQg/media/posts/202601")

    return [
        # ── Juan Leduc Riley bio ──
        {
            "slug": "juan-leduc-riley",
            "files": [
                WP_OCT25 / "juan-leduc-riley_open-studio_02.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_03.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_04.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_07.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_10.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_11.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_13.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_16.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_19.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_20.jpg",
                WP_OCT25 / "juan-leduc-riley_open-studio_24.jpg",
            ],
            "desc": "Juan Leduc Riley bio — open studio documentation",
        },
        # ── Thom Nguyen bio ──
        {
            "slug": "thom-nguyen",
            "files": [
                WP_JUN25 / "thomexhibition-_space03e.jpg",
                WP_JUN25 / "thomexhibition-_space04e.jpg",
                WP_JUN25 / "thomexhibition-_space07e.jpg",
            ],
            "desc": "Thom Nguyen bio — exhibition space photos",
        },
        # ── Ania Reynolds bio ──
        {
            "slug": "ania-reynolds",
            "files": [
                WP_JUN25 / "img_5939.jpg",
                WP_JUN25 / "img_5946.jpg",
                WP_JUN25 / "img_5984.jpg",
                WP_JUN25 / "img_5995.jpg",
                WP_JUN25 / "img_6013.jpg",
                WP_JUN25 / "img_6015.jpg",
            ],
            "desc": "Ania Reynolds bio — Saigon Dreaming open studio",
        },
        # ── Le D. Chung bio — 6pm in the afternoon exhibition ──
        {
            "slug": "le-d-chung",
            "files": sorted([
                p for p in WP_JUL25.iterdir()
                if "6pm-in-the-afternoon" in p.name and p.suffix.lower() in (".jpg", ".jpeg")
                and "-1." not in p.name and "-1-" not in p.name and "-2." not in p.name
            ]) + [WP_JUL25 / "a.farm_le-d.-chung_ex.1_2025_210-x-96-x-52-cm_1.jpg"],
            "desc": "Lê Đ. Chung bio — 6pm in the afternoon solo exhibition",
        },
        # ── Lau Wang Tat bio ──
        {
            "slug": "lau-wang-tat",
            "files": [
                WP_SEP24 / "a.b.s.t.r.a.c.t.i.o.n-installation-view1.jpg",
                WP_SEP24 / "a.b.s.t.r.a.c.t.i.o.n-installation-view2.jpg",
                WP_SEP24 / "dscf5293.jpg",
                WP_SEP24 / "image_123650291.jpg",
                WP_SEP24 / "image_1236502911.jpg",
                WP_SEP24 / "image_1236502912.jpg",
                WP_SEP24 / "image_1236502913.jpg",
                WP_SEP24 / "image_1236502915.jpg",
                WP_SEP24 / "image_67156993.jpg",
            ],
            "desc": "Lau Wang Tat bio — Time Borrowed, Space Transited",
        },
        # ── Time Borrowed, Space Transited event page ──
        {
            "slug": "time-borrowed-space-transited-with-lau-wang-tat",
            "files": [
                WP_SEP24 / "a.b.s.t.r.a.c.t.i.o.n-installation-view1.jpg",
                WP_SEP24 / "a.b.s.t.r.a.c.t.i.o.n-installation-view2.jpg",
                WP_SEP24 / "dscf5293.jpg",
                WP_SEP24 / "image_123650291.jpg",
                WP_SEP24 / "image_1236502911.jpg",
                WP_SEP24 / "image_1236502912.jpg",
                WP_SEP24 / "image_1236502913.jpg",
                WP_SEP24 / "image_1236502915.jpg",
                WP_SEP24 / "image_67156993.jpg",
                WP_SEP24 / "in02-850585292-e1727244344399.jpeg",
                WP_SEP24 / "img_1828-1221126439-e1727244263961.jpeg",
                WP_SEP24 / "img_3680.jpeg",
                WP_SEP24 / "img_6168.jpg",
                WP_SEP24 / "originalphoto-598612637.522422.jpg",
                WP_SEP24 / "originalphoto-598614346.983115.jpg",
            ],
            "desc": "Time Borrowed, Space Transited event — documentation",
        },
        # ── kaki bio — Season 8 open studios ──
        {
            "slug": "kaki",
            "files": [
                p for p in WP_NOV25.iterdir()
                if p.suffix.lower() in (".jpg", ".jpeg", ".png")
                and "fb-event" not in p.name
            ],
            "desc": "Kaki bio — Season 8 open studios",
        },
        # ── Nguyen Giao Xuan bio — Season 8 open studios ──
        {
            "slug": "nguyen-giao-xuan",
            "files": [
                p for p in WP_NOV25.iterdir()
                if p.suffix.lower() in (".jpg", ".jpeg", ".png")
                and "fb-event" not in p.name
            ],
            "desc": "Nguyễn Giao Xuân bio — Season 8 open studios",
        },
        # ── Minimal Prayer — Duy Nguyen (Feb 11 2025) ──
        {
            "slug": "minimal-prayer-duy-nguyen",
            "files": [
                WP_FEB25 / "img_3176.jpg",
                WP_FEB25 / "img_3185-1.jpg",
                WP_FEB25 / "img_3194-1.jpg",
                WP_FEB25 / "img_3198.jpg",
                WP_FEB25 / "img_3203.jpg",
                WP_FEB25 / "img_3204.jpg",
                WP_FEB25 / "img_3208.jpg",
                WP_FEB25 / "img_3209.jpg",
                WP_FEB25 / "img_8250.jpg",
                WP_FEB25 / "img_8270.jpg",
                WP_FEB25 / "minimal-prayer-fb-1.png",
            ],
            "desc": "Minimal Prayer — Duy Nguyen — confirmed Feb 11 2025 EXIF",
        },
        # ── Residency Reflection — Vicente Arresse (Nov 16-19 2024) ──
        {
            "slug": "residency-reflection-by-leipzig-based-artist-vicente-arresse",
            "files": [
                WP_NOV24 / "dsc04337.jpg",
                WP_NOV24 / "dsc04339.jpg",
                WP_NOV24 / "dsc04409.jpg",
                WP_NOV24 / "dsc04450.jpg",
                WP_NOV24 / "dsc04464.jpg",
                WP_NOV24 / "dsc04585.jpg",
                WP_NOV24 / "dsc04603.jpg",
                WP_OCT24 / "dsc04462.jpg",
            ],
            "desc": "Residency Reflection — Vicente Arresse — EXIF Nov 16-19 2024 confirmed",
        },
        # ── In Between Frames / 6pm in the afternoon — Le D. Chung event page ──
        {
            "slug": "in-between-frames-i-dream-the-dreams-i-have-been-dreaming",
            "files": sorted([
                p for p in WP_JUL25.iterdir()
                if "6pm-in-the-afternoon" in p.name and p.suffix.lower() in (".jpg", ".jpeg")
                and "-1." not in p.name and "-1-" not in p.name and "-2." not in p.name
            ]) + [WP_JUL25 / "a.farm_le-d.-chung_ex.1_2025_210-x-96-x-52-cm_1.jpg"],
            "desc": "In Between Frames event — Le D. Chung 6pm in the afternoon, EXIF Jul 26-Aug 2 2025",
        },
        # ── Causal Capture Film Screening — flyer + screening-night photo ──
        {
            "slug": "film-screening-causal-capture",
            "files": [
                WP_APR25 / "causal-capture-fb-event.png",
                WP_APR25 / "causal-capture-fb-event-1.png",
                WP_APR25 / "dscf0610.jpg",
            ],
            "desc": "Causal Capture — event flyers + confirmed Apr 11 2025 photo (dscf0610)",
        },
        # ── Nhập vai Ký ức — Tâm Đỗ (Aug 2 2025) — EXIF shows 2019 (camera clock wrong) ──
        {
            "slug": "nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do",
            "files": [WP_AUG25 / f"{i}.jpg" for i in range(1, 11)],
            "desc": "Nhập vai Ký ức — Tâm Đỗ — 10 photos from WP 2025/08 (EXIF 2019, camera clock likely wrong)",
        },
        # ── Save the Date / Artist Talk — Nov 28 2024 — flyer only ──
        {
            "slug": "save-the-date-artist-talk-with-nguyen-hoa-vicente-arrese-and-que",
            "files": [
                WP_NOV24 / "artisttalk_november-03.png",
            ],
            "desc": "Artist Talk — Nguyễn Hoá, Vicente Arrese, Quế — event flyer",
        },
        # ── SHOW|off — Instagram photos (only source, compressed 36-225KB) ──
        {
            "slug": "show-off-cam-xanh-andrew-newell-walther",
            "files": [
                p for p in IG_MOTPLUS.iterdir()
                if p.suffix.lower() in (".jpg", ".jpeg")
                and not p.name.startswith("._")
            ] if IG_MOTPLUS.exists() else [],
            "desc": "SHOW|off — 6 Instagram-compressed JPEGs from @motplusplus (only documentation that exists)",
        },
    ]


# ══════════════════════════════════════════════════════════════
# FIX: Transfer Causal Capture images to x-o + exxonnubile
# These 12 DSCF images belong to the Open Studio April 8 event
# ══════════════════════════════════════════════════════════════
CAUSAL_CAPTURE_ASSET_IDS = [
    "image-f674844bd687b599ee63e0c53ad0f4121afed4db-1080x956-jpg",
    "image-2ba5ae4d9b68c53b45656e9dfcd2197248a1d096-1600x1067-jpg",
    "image-78fec18d507a1f82c32a126c7751c19a5aac4cac-1600x1067-jpg",
    "image-f88964a0046b2e76617402f19023ed143dfeac59-1600x1067-jpg",
    "image-bc166173dd7c27c5dc7b408537db7ce15656a173-1600x1067-jpg",
    "image-8eb0a728614a6f7a6e5b5dbf123f7191d503bd1a-1600x1067-jpg",
    "image-c27476a8b38b513b54a7780465ae62d680858d47-1600x1067-jpg",
    "image-6b544aade7f5ae0d9d60ae55dedf5e3c62d99d2a-1600x1067-jpg",
    "image-356c412847f8cbbc9cf3cc5aca53dc06eeec9d74-1600x1067-jpg",
    "image-04b7e93f62bbb53df579ee75959ed9daf9e2c262-1600x1067-jpg",
    "image-0877814ad1ecbf36e14c365c2f8c8aaba20eb42e-1600x1067-jpg",
    "image-179e4de19853559422fa2ab9a5785906d2197d1c-1600x1067-jpg",
]


def fix_causal_capture():
    print("\n── Causal Capture conflict fix ──")
    print("  Moving 12 DSCF images from film-screening-causal-capture → x-o/exxonnubile bio pages")
    print(f"  film-screening-causal-capture: would be cleared (12 images)")
    for slug in ["exxonnubile-julia-weiner", "x-o-veron-xio"]:
        print(f"  {slug}: would receive 12 images")

    if DRY_RUN:
        return

    # Set images on x-o and exxonnubile bio pages
    for slug in ["exxonnubile-julia-weiner", "x-o-veron-xio"]:
        doc = get_doc(slug)
        if not doc:
            print(f"  ✗ {slug} not found")
            continue
        set_images(doc["_id"], CAUSAL_CAPTURE_ASSET_IDS)
        print(f"  ✓ {slug}: set 12 images")
        time.sleep(0.2)

    # Clear causal capture (known _id)
    set_images("event-film-screening-causal-capture", [])
    print(f"  ✓ film-screening-causal-capture: cleared")


def main():
    if not DRY_RUN and not SANITY_TOKEN:
        print("ERROR: SANITY_WRITE_TOKEN not set.")
        sys.exit(1)

    print(f"{'[DRY RUN] ' if DRY_RUN else ''}Batch image upload to Sanity\n")

    # Fix causal capture first
    fix_causal_capture()

    # Upload batches
    batches = get_batches()
    for batch in batches:
        slug = batch["slug"]
        files = [p for p in batch["files"] if isinstance(p, Path) and p.exists()]
        missing = [p for p in batch["files"] if isinstance(p, Path) and not p.exists()]

        print(f"\n── {slug} ──")
        print(f"  {batch['desc']}")
        print(f"  {len(files)} files found, {len(missing)} missing")
        if missing:
            for m in missing[:3]:
                print(f"    ✗ {m.name}")

        if not files:
            print("  → no files, skipping")
            continue

        if DRY_RUN:
            for f in files:
                print(f"    → would upload {f.name}")
            continue

        # Get doc (only in live mode)
        doc = get_doc(slug)
        if not doc:
            print(f"  ✗ Sanity doc not found for {slug}")
            continue

        existing = doc.get("uploadedImages") or []
        new_ids = []
        for fpath in files:
            try:
                asset_id = upload_image(fpath)
                new_ids.append(asset_id)
                print(f"    ✓ {fpath.name} → {asset_id[:32]}...")
                time.sleep(0.15)
            except Exception as e:
                print(f"    ✗ {fpath.name}: {e}")

        if new_ids:
            append_images(doc["_id"], existing, new_ids)
            print(f"  → patched {slug} with {len(new_ids)} new images")
            time.sleep(0.2)

    print(f"\n{'[DRY RUN] Run with --run to apply.' if DRY_RUN else 'Done.'}")


if __name__ == "__main__":
    main()
