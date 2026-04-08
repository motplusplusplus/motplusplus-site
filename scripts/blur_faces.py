#!/usr/bin/env python3
"""
blur_faces.py — Identify and blur specific people's faces across all site images.

Usage:
    python3 scripts/blur_faces.py

Setup:
    - Put reference photos in REFERENCE_DIR (defined below), organized by person name
    - The script loads face encodings from references, then scans all R2 images
    - High-confidence matches (above THRESHOLD) are blurred and re-uploaded to R2
    - A report is saved to /tmp/blur_report.json

Requirements:
    pip install face_recognition opencv-python pillow
    (face_recognition_models __init__.py may need patching for Python 3.12+)

Notes:
    - Downloads each R2 image, checks for matching faces, blurs, re-uploads
    - Only processes images already referenced in events-data.json
    - Skips images already processed (tracked in /tmp/blur_progress.json)
    - Safe to re-run: will resume from last position
"""

import os, json, subprocess, time, tempfile
import face_recognition
import cv2
import numpy as np
import boto3
import requests

# ── CONFIG ────────────────────────────────────────────────────────────────────
REFERENCE_DIR   = "/Volumes/MoT/miscellaneous/L and TM photos to train bot to erase face "
EVENTS_JSON     = "/Users/andrewwalther/Documents/motplus/events-data.json"
TOKEN           = "0y5cIePwh8kUz1aBnCZmYIuFJF1IVarrr7RDvWrD"
ACCOUNT_ID      = "31a35595add67ae1366b3f6420432773"
ACCESS_KEY      = "83343e12beb2f0aed8d48bc3047814a2"
SECRET_KEY      = "8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56"
BUCKET          = "site-general"
R2_BASE         = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/"
ENDPOINT_URL    = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"
REPORT_FILE     = "/tmp/blur_report.json"
PROGRESS_FILE   = "/tmp/blur_progress.json"
MANIFEST_FILE   = "/Users/andrewwalther/Documents/motplus/scripts/face-blur-manifest.json"
THRESHOLD       = 0.5       # Lower = stricter (0.4 very strict, 0.6 lenient)
BLUR_KERNEL     = 51        # Blur strength (odd number, higher = more blur)
MOTPLUS_DIR     = "/Users/andrewwalther/Documents/motplus"
# ─────────────────────────────────────────────────────────────────────────────

def make_s3():
    return boto3.client(
        "s3",
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name="auto",
    )

def save_original_to_r2(s3, r2_key):
    """Copy the current R2 object to <stem>__orig.<ext> before blurring."""
    ext = os.path.splitext(r2_key)[1].lower()
    orig_key = r2_key[:len(r2_key)-len(ext)] + "__orig" + ext
    # Only copy if orig doesn't already exist
    try:
        s3.head_object(Bucket=BUCKET, Key=orig_key)
        return orig_key  # already saved
    except:
        pass
    s3.copy_object(
        Bucket=BUCKET,
        CopySource={"Bucket": BUCKET, "Key": r2_key},
        Key=orig_key,
    )
    return orig_key

PHOTO_EXTS = {'.jpg', '.jpeg', '.png'}

# Only Luke's reference photos — Asian women excluded to prevent false positives.
# Add Tra My files here once better reference photos are available.
_NB = "\u202f"  # narrow no-break space used by macOS in screenshot filenames
LUKE_ONLY_FILES = {
    f"Screenshot 2026-03-17 at 12.44.14{_NB}PM.png",
    f"Screenshot 2026-03-17 at 12.49.51{_NB}PM.png",
    f"Screenshot 2026-03-17 at 12.55.14{_NB}PM.png",
    f"Screenshot 2026-03-17 at 12.59.37{_NB}PM.png",
    f"Screenshot 2026-03-17 at 1.00.19{_NB}PM.png",
    f"Screenshot 2026-03-17 at 1.02.09{_NB}PM.png",
    f"Screenshot 2026-03-17 at 1.07.09{_NB}PM.png",
    f"Screenshot 2026-03-17 at 1.15.43{_NB}PM.png",
    f"Screenshot 2026-03-17 at 1.20.08{_NB}PM.png",
    f"Screenshot 2026-03-17 at 1.21.49{_NB}PM.png",
    f"Screenshot 2026-03-17 at 1.24.56{_NB}PM.png",
    f"Screenshot 2026-03-17 at 1.40.50{_NB}PM.png",
}

def load_reference_encodings():
    encodings = []
    if not os.path.exists(REFERENCE_DIR):
        print(f"ERROR: Reference directory not found: {REFERENCE_DIR}")
        return encodings

    print(f"Loading {len(LUKE_ONLY_FILES)} Luke reference photos...")
    for fname in sorted(LUKE_ONLY_FILES):
        path = os.path.join(REFERENCE_DIR, fname)
        try:
            img = face_recognition.load_image_file(path)
            encs = face_recognition.face_encodings(img)
            if encs:
                encodings.append(encs[0])
            else:
                print(f"  no face detected: {fname}")
        except Exception as e:
            print(f"  Skip {fname}: {e}")

    print(f"  Loaded {len(encodings)} Luke encodings")
    return encodings


def blur_face(image_bgr, top, right, bottom, left, kernel=BLUR_KERNEL):
    """Apply gaussian blur to a face region."""
    face_img = image_bgr[top:bottom, left:right]
    k = kernel if kernel % 2 == 1 else kernel + 1
    blurred = cv2.GaussianBlur(face_img, (k, k), 0)
    image_bgr[top:bottom, left:right] = blurred
    return image_bgr


def process_image(local_path, reference_encodings):
    """
    Check image for matching faces. Returns (modified_image, num_blurred) or (None, 0).
    """
    try:
        img_rgb = face_recognition.load_image_file(local_path)
        # Resize for speed if large
        h, w = img_rgb.shape[:2]
        scale = 1.0
        if max(h, w) > 1600:
            scale = 1600 / max(h, w)
            small = cv2.resize(img_rgb, (int(w*scale), int(h*scale)))
        else:
            small = img_rgb

        locations = face_recognition.face_locations(small, model="hog")
        if not locations:
            return None, 0

        encodings = face_recognition.face_encodings(small, locations)
        img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

        num_blurred = 0
        for (top, right, bottom, left), enc in zip(locations, encodings):
            distances = face_recognition.face_distance(reference_encodings, enc)
            min_dist = float(np.min(distances))
            if min_dist <= THRESHOLD:
                # Scale location back to original size
                if scale != 1.0:
                    top    = int(top    / scale)
                    right  = int(right  / scale)
                    bottom = int(bottom / scale)
                    left   = int(left   / scale)
                # Add padding
                pad = int((bottom - top) * 0.15)
                top    = max(0, top    - pad)
                left   = max(0, left   - pad)
                bottom = min(img_bgr.shape[0], bottom + pad)
                right  = min(img_bgr.shape[1], right  + pad)
                img_bgr = blur_face(img_bgr, top, right, bottom, left)
                num_blurred += 1

        if num_blurred > 0:
            return img_bgr, num_blurred
        return None, 0

    except Exception as e:
        print(f"    Error processing: {e}")
        return None, 0


def main():
    # Load reference encodings
    reference_encodings = load_reference_encodings()
    if not reference_encodings:
        print("No reference encodings loaded — aborting.")
        return

    # Load events data
    with open(EVENTS_JSON) as f:
        events = json.load(f)

    # Collect all unique R2 image URLs
    all_urls = set()
    for event in events:
        for url in event.get('images', []):
            if url.startswith(R2_BASE) and any(url.lower().endswith(e) for e in PHOTO_EXTS):
                all_urls.add(url)
    print(f"Total unique R2 images to check: {len(all_urls)}")

    # Load progress
    progress = {}
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            progress = json.load(f)
    already_done = len([k for k, v in progress.items() if v in ('ok', 'blurred', 'error', 'no_faces')])
    print(f"Already processed: {already_done}, remaining: {len(all_urls) - already_done}")

    report = {'blurred': [], 'errors': []}
    checked = 0
    sess = requests.Session()
    sess.headers['User-Agent'] = 'Mozilla/5.0'

    # Load or init manifest
    manifest = []
    if os.path.exists(MANIFEST_FILE):
        with open(MANIFEST_FILE) as f:
            manifest = json.load(f)
    manifest_keys = {m['url'] for m in manifest}

    s3 = make_s3()

    for url in sorted(all_urls):
        if url in progress:
            continue

        r2_key = url[len(R2_BASE):]

        try:
            resp = sess.get(url, timeout=15)
            resp.raise_for_status()
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                tmp.write(resp.content)
                tmp_path = tmp.name
            modified, num_blurred = process_image(tmp_path, reference_encodings)

            if modified is not None and num_blurred > 0:
                # 1. Save original in R2 before overwriting
                orig_key = save_original_to_r2(s3, r2_key)

                # 2. Upload blurred version
                out_path = tmp_path + '_blurred.jpg'
                cv2.imwrite(out_path, modified, [cv2.IMWRITE_JPEG_QUALITY, 88])
                with open(out_path, 'rb') as fh:
                    s3.put_object(
                        Bucket=BUCKET,
                        Key=r2_key,
                        Body=fh.read(),
                        ContentType='image/jpeg',
                        CacheControl='public, max-age=31536000',
                    )
                print(f"  BLURRED ({num_blurred} faces): {r2_key.split('/')[-1]}")
                report['blurred'].append({'url': url, 'faces_blurred': num_blurred})
                progress[url] = 'blurred'

                # 3. Record in manifest
                if url not in manifest_keys:
                    manifest.append({
                        'url': url,
                        'r2_key': r2_key,
                        'orig_key': orig_key,
                        'orig_url': R2_BASE + orig_key,
                        'faces_blurred': num_blurred,
                        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                    })
                    manifest_keys.add(url)
                    with open(MANIFEST_FILE, 'w') as f:
                        json.dump(manifest, f, indent=2)

                os.unlink(out_path)
            else:
                progress[url] = 'no_faces'

            os.unlink(tmp_path)

        except Exception as e:
            print(f"  ERROR {url.split('/')[-1]}: {e}")
            progress[url] = 'error'
            report['errors'].append({'url': url, 'error': str(e)})

        checked += 1
        if checked % 100 == 0:
            print(f"\n[{checked}/{len(all_urls)}] Progress saved...")
            with open(PROGRESS_FILE, 'w') as f:
                json.dump(progress, f)
            with open(REPORT_FILE, 'w') as f:
                json.dump(report, f, indent=2)
        time.sleep(0.05)

    # Save final
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f)
    with open(REPORT_FILE, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\nDone. Checked {checked} images.")
    print(f"  Blurred: {len(report['blurred'])}")
    print(f"  Errors: {len(report['errors'])}")
    print(f"  Manifest: {MANIFEST_FILE}")
    print(f"  Report: {REPORT_FILE}")


if __name__ == "__main__":
    main()
