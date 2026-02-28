#!/usr/bin/env python3
"""
Merge bilingual duplicate event pairs into single entries with vnTitle / vnDescription.
- For bilingual pairs: VN entry's title → vnTitle, description → vnDescription on EN entry
- For exact duplicates (same title): merge images only
- Deletes the removed slugs and adds redirects to _redirects
"""
import json, os, re

EVENTS_FILE   = os.path.join(os.path.dirname(__file__), '..', 'events-data.json')
REDIRECTS_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', '_redirects')

# (keep_slug, remove_slug, type)
# type "bilingual": VN title/desc folded into vnTitle/vnDescription on EN entry
# type "exact":     same title, just merge images, no vnTitle needed
PAIRS = [
    # ── Exact duplicates (same bilingual title, -2 is the stale copy) ──────
    ("mango-tree-reading-station-tram-doc-cay-xoai",
     "mango-tree-reading-station-tram-doc-cay-xoai-2",
     "exact"),
    ("the-calligraphic-regimes-of-contemporary-vietnamese-art-a-reading-discussion-with-pamela-n-corey",
     "the-calligraphic-regimes-of-contemporary-vietnamese-art-a-reading-discussion-with-pamela-n-corey-2",
     "exact"),
    ("crossing-a-shoreless-sea-bang-qua-trung-duong-open-studio-by-noah-spivak",
     "crossing-a-shoreless-sea-bang-qua-trung-duong-open-studio-by-noah-spivak-2",
     "exact"),
    ("ai-reimagined-tai-tuong-tuong-ai-a-workshop-with-cung-van-anh-le",
     "ai-reimagined-tai-tuong-tuong-ai-a-workshop-with-cung-van-anh-le-2",
     "exact"),
    ("giua-nhung-chop-bong-toi-mo-tiep-nhung-giac-mo-in-between-frames-i-dream-the-dreams-i-have-been-dreaming",
     "giua-nhung-chop-bong-toi-mo-tiep-nhung-giac-mo-in-between-frames-i-dream-the-dreams-i-have-been-dreaming-2",
     "exact"),

    # ── True bilingual pairs (keep EN slug, fold VN into vnTitle/vnDescription) ──
    ("a-tingling-sensation-under-the-skin-by-kaki-the-burden-of-becoming-by-nguyen-giao-xuan-season-8-open-studios",
     "ram-ran-duoi-lan-da-boi-kaki-thuc-tai-chong-chat-boi-nguyen-giao-xuan-mo-xuong-mua-8",
     "bilingual"),
    ("codesurfing-a-search-for-a-poetical-technology-a-talk-by-nhan-phan-yui-nguyen",
     "luot-code-hanh-trinh-di-tim-tinh-tho-trong-cong-nghe-buoi-tro-chuyen-cua-nhan-phan-yui-nguyen",
     "bilingual"),
    ("sombras-nada-mas-shadows-nothing-more",
     "sombras-nada-mas-chi-con-cai-bong-mo-xuong-cung-juan-leduc-riley",
     "bilingual"),
    ("seeking-severance-celina-huynh",
     "cho-ngay-doan-tuyet-celina-huynh",
     "bilingual"),
    ("nuoc-water-resistance-a-solo-exhibition-by-thom-nguyen",
     "nuoc-water-resistance-mot-trien-lam-ca-nhan-cua-thom-nguyen",
     "bilingual"),
    ("saigon-dreaming-open-studio-by-ania-reynolds",
     "saigon-dreaming-mo-xuong-cua-ania-reynolds",
     "bilingual"),
    ("cyanotype-workshop-with-linh-vh-nguyen",
     "cyanotype-workshop-cung-linh-vh-nguyen",
     "bilingual"),
    ("may-open-studio",
     "mo-xuong-thang-nam",
     "bilingual"),
    ("hypnotising-chickens-recent-video-art-from-vietnam-and-tasmania",
     "ga-gat-cac-tac-pham-video-moi-tu-viet-nam-va-tasmania",
     "bilingual"),
    ("eta-estimated-time-of-arrival-film-screening",
     "buoi-chieu-phim-eta-estimated-time-of-arrival",
     "bilingual"),
    ("film-screening-causal-capture",
     "buoi-chieu-phim-causal-capture",
     "bilingual"),
    ("open-studio-x-o-exxonnubile",
     "mo-xuong-cua-x-o-va-exxonnubile",
     "bilingual"),
    ("april-open-studio-virginie-tan-aylin-derya-stahl",
     "mo-xuong-thang-tu-virginie-tan-aylin-derya-stahl",
     "bilingual"),
    ("between-land-sea-ink-rock-paintings-by-saverio-tonoli",
     "giua-dat-va-bien-tranh-ve-muc-tren-da-boi-saverio-tonoli",
     "bilingual"),
    ("frozen-data-lananh-le",
     "du-lieu-dong-bang-lananh-le",
     "bilingual"),
    ("dusk-dance-for-saigon-river-emmanuelle-huynh",
     "vu-dieu-hoang-hon-ben-song-sai-gon-emmanuelle-huynh",
     "bilingual"),
    ("poetry-plus-frozen-data",
     "tho-du-lieu-bi-dong-bang",
     "bilingual"),
    ("cam-xanh-run-run-run-ongoing-collaborative-performance",
     "cam-xanh-run-run-run-trinh-dien-tiep-noi-va-ket-hop",
     "bilingual"),
    ("flowers-tran-minh-duc",
     "nhung-bong-hoa-tran-minh-duc",
     "bilingual"),
]


def merge_images(base_images: list, extra_images: list) -> list:
    seen = set(base_images)
    merged = list(base_images)
    for img in extra_images:
        if img not in seen:
            seen.add(img)
            merged.append(img)
    return merged


def main():
    with open(EVENTS_FILE, encoding='utf-8') as f:
        events = json.load(f)

    by_slug = {e['slug']: e for e in events}
    slugs_to_remove = set()
    new_redirects = []

    for keep_slug, remove_slug, kind in PAIRS:
        keep = by_slug.get(keep_slug)
        remove = by_slug.get(remove_slug)

        if not keep:
            print(f"  MISSING keep slug: {keep_slug}")
            continue
        if not remove:
            print(f"  MISSING remove slug: {remove_slug}")
            continue

        # Merge images
        keep['images'] = merge_images(keep.get('images', []), remove.get('images', []))
        if not keep.get('thumbnail') and remove.get('thumbnail'):
            keep['thumbnail'] = remove['thumbnail']

        if kind == 'bilingual':
            # Fold VN title and description into vnTitle / vnDescription
            if not keep.get('vnTitle'):
                keep['vnTitle'] = remove['title']
            if not keep.get('vnDescription') and remove.get('description'):
                keep['vnDescription'] = remove['description']
            print(f"  [bilingual] kept: {keep_slug}")
            print(f"             vnTitle: {keep['vnTitle'][:60]}")
        else:
            print(f"  [exact dup] kept: {keep_slug}")

        slugs_to_remove.add(remove_slug)
        new_redirects.append(f"/events/{remove_slug} /events/{keep_slug} 301")

    # Remove merged events
    events = [e for e in events if e['slug'] not in slugs_to_remove]

    # Re-sort newest first
    events.sort(key=lambda e: e['sortDate'], reverse=True)

    with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print(f"\nRemoved {len(slugs_to_remove)} entries. {len(events)} events remain.")

    # Append redirects to _redirects (avoid duplicates)
    with open(REDIRECTS_FILE, encoding='utf-8') as f:
        existing = f.read()

    added = 0
    lines_to_add = []
    for r in new_redirects:
        src = r.split()[0]
        if src not in existing:
            lines_to_add.append(r)
            added += 1

    if lines_to_add:
        with open(REDIRECTS_FILE, 'a', encoding='utf-8') as f:
            f.write('\n# bilingual merge redirects\n')
            for line in lines_to_add:
                f.write(line + '\n')
        print(f"Added {added} redirect(s) to _redirects.")
    else:
        print("No new redirects needed (all already present).")


if __name__ == '__main__':
    main()
