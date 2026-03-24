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

import os, json, subprocess, time, urllib.request, tempfile
import face_recognition
import cv2
import numpy as np

# ── CONFIG ────────────────────────────────────────────────────────────────────
REFERENCE_DIR   = "/Volumes/MoT/miscellaneous/L and TM photos to train bot to erase face "
EVENTS_JSON     = "/Users/andrewwalther/Documents/motplus/events-data.json"
TOKEN           = "0y5cIePwh8kUz1aBnCZmYIuFJF1IVarrr7RDvWrD"
ACCOUNT_ID      = "31a35595add67ae1366b3f6420432773"
BUCKET          = "site-general"
R2_BASE         = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/"
REPORT_FILE     = "/tmp/blur_report.json"
PROGRESS_FILE   = "/tmp/blur_progress.json"
THRESHOLD       = 0.5       # Lower = stricter (0.4 very strict, 0.6 lenient)
BLUR_KERNEL     = 51        # Blur strength (odd number, higher = more blur)
MOTPLUS_DIR     = "/Users/andrewwalther/Documents/motplus"
# ─────────────────────────────────────────────────────────────────────────────

PHOTO_EXTS = {'.jpg', '.jpeg', '.png'}

def load_reference_encodings():
    """
    Load face encodings from reference photos.
    Returns list of (name, encoding) tuples.
    Tries to auto-detect person by filename: files with 'luke' → Luke, others → Tra My.
    """
    encodings = []
    if not os.path.exists(REFERENCE_DIR):
        print(f"ERROR: Reference directory not found: {REFERENCE_DIR}")
        return encodings

    files = [f for f in os.listdir(REFERENCE_DIR)
             if os.path.splitext(f.lower())[1] in PHOTO_EXTS and not f.startswith('.')]

    print(f"Loading {len(files)} reference photos...")
    for fname in files:
        path = os.path.join(REFERENCE_DIR, fname)
        try:
            img = face_recognition.load_image_file(path)
            encs = face_recognition.face_encodings(img)
            if encs:
                # Guess person from filename (screenshots — use first face found per image)
                # Since all reference photos are of Luke (man) or Tra My (woman),
                # we encode all as targets to blur (both are being removed)
                encodings.append(encs[0])
        except Exception as e:
            print(f"  Skip {fname}: {e}")

    print(f"  Loaded {len(encodings)} reference encodings")
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
    env = {**os.environ, 'CLOUDFLARE_API_TOKEN': TOKEN, 'CLOUDFLARE_ACCOUNT_ID': ACCOUNT_ID}
    checked = 0

    for url in sorted(all_urls):
        if url in progress:
            continue

        r2_key = url[len(R2_BASE):]

        try:
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                tmp_path = tmp.name

            urllib.request.urlretrieve(url, tmp_path)
            modified, num_blurred = process_image(tmp_path, reference_encodings)

            if modified is not None and num_blurred > 0:
                out_path = tmp_path + '_blurred.jpg'
                cv2.imwrite(out_path, modified, [cv2.IMWRITE_JPEG_QUALITY, 88])
                res = subprocess.run(
                    ['npx', 'wrangler', 'r2', 'object', 'put', f'{BUCKET}/{r2_key}',
                     '--remote', '--file', out_path, '--content-type', 'image/jpeg'],
                    capture_output=True, text=True, env=env, cwd=MOTPLUS_DIR
                )
                if res.returncode == 0:
                    print(f"  BLURRED ({num_blurred} faces): {r2_key.split('/')[-1]}")
                    report['blurred'].append({'url': url, 'faces_blurred': num_blurred})
                    progress[url] = 'blurred'
                else:
                    print(f"  UPLOAD FAILED: {r2_key.split('/')[-1]}")
                    progress[url] = 'error'
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
    print(f"  Report: {REPORT_FILE}")


if __name__ == "__main__":
    main()
