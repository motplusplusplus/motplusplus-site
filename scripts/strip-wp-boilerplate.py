#!/usr/bin/env python3
"""
strip-wp-boilerplate.py

Strips WordPress footer boilerplate from Sanity event descriptions.
SAFE BY DEFAULT — pass --run to apply changes.

Usage:
  python3 scripts/strip-wp-boilerplate.py           # dry run
  python3 scripts/strip-wp-boilerplate.py --run     # live
"""
import sys, os, json, time
import requests

DRY_RUN      = "--run" not in sys.argv
TOKEN        = os.environ.get("SANITY_WRITE_TOKEN", "")
PROJECT_ID   = "t5nsm79o"
DATASET      = "production"
API_VERSION  = "2026-03-20"
API_BASE     = f"https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}"

# Ordered list of markers — cut description at the FIRST match
BOILERPLATE_MARKERS = [
    " Programs Residents News & Events",
    " Programs\nResidents\nNews",
    "\nPrograms\n",
    "Programs Residents News",
    " Comment Subscribe",
    "\nComment\n",
    " Contact Us ",
    "\nContact Us\n",
    "Contact Us a.farm",
    "Contact Us contact@",
    " Log in Copy shortlink",
    " Subscribe Subscribed MoT+++",
    "Manage subscriptions Collapse this bar",
]

def strip_boilerplate(text: str) -> str:
    if not text:
        return text
    best = len(text)
    for marker in BOILERPLATE_MARKERS:
        idx = text.find(marker)
        if idx != -1 and idx < best:
            best = idx
    return text[:best].strip()

def fetch_events():
    query = '*[_type == "event" && (description match "*a.farm.saigon@gmail.com*" || description match "*Comment Subscribe*" || description match "*motplusplus.com*Contact*")]{"_id": _id, "slug": slug.current, "description": description, "vnDescription": vnDescription}'
    resp = requests.get(
        f"{API_BASE}/data/query/{DATASET}",
        params={"query": query},
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["result"]

def patch_description(doc_id, description, vn_description):
    mutations = []
    if description is not None:
        mutations.append({"patch": {"id": doc_id, "set": {"description": description}}})
    if vn_description is not None:
        mutations.append({"patch": {"id": doc_id, "set": {"vnDescription": vn_description}}})
    resp = requests.post(
        f"{API_BASE}/data/mutate/{DATASET}",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
        json={"mutations": mutations},
        timeout=30,
    )
    resp.raise_for_status()

def main():
    if not DRY_RUN and not TOKEN:
        print("ERROR: SANITY_WRITE_TOKEN not set.")
        sys.exit(1)

    print(f"{'[DRY RUN] ' if DRY_RUN else ''}Stripping WordPress boilerplate from descriptions\n")

    events = fetch_events()
    print(f"Found {len(events)} events with boilerplate\n")

    patched = 0
    unchanged = 0

    for e in events:
        slug = e.get("slug", e["_id"])
        desc = e.get("description") or ""
        vn_desc = e.get("vnDescription") or ""

        clean_desc = strip_boilerplate(desc)
        clean_vn = strip_boilerplate(vn_desc)

        desc_changed = clean_desc != desc
        vn_changed = clean_vn != vn_desc and vn_desc

        if not desc_changed and not vn_changed:
            unchanged += 1
            continue

        removed_chars = len(desc) - len(clean_desc)
        print(f"  {slug}")
        if desc_changed:
            print(f"    desc: {len(desc)} → {len(clean_desc)} chars (removed {removed_chars})")
            print(f"    ...{repr(desc[len(clean_desc)-40:len(clean_desc)+20])}")
        if vn_changed:
            print(f"    vnDesc: {len(vn_desc)} → {len(clean_vn)} chars")

        if not DRY_RUN:
            patch_description(
                e["_id"],
                clean_desc if desc_changed else None,
                clean_vn if vn_changed else None,
            )
            time.sleep(0.15)

        patched += 1

    print(f"\nDone. {'Would patch' if DRY_RUN else 'Patched'}: {patched}, Unchanged: {unchanged}")
    if DRY_RUN:
        print("Run with --run to apply.")

if __name__ == "__main__":
    main()
