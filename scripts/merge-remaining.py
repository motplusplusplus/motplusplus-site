#!/usr/bin/env python3
"""
Merge remaining duplicate/split event entries:
1. Baby Reni bilingual pair
2. Nhap-vai exact duplicate pair
3. Song nay biet mai / Living today bilingual pair
4. Performance Plus 2019 (4 entries → 1)
5. Remove funded-residency events
"""
import json, os, re

EVENTS_FILE   = os.path.join(os.path.dirname(__file__), '..', 'events-data.json')
REDIRECTS_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', '_redirects')


def clean_bilingual(desc):
    """Remove 'English | Tiếng Việt' header and duplicated nav/footer content."""
    desc = re.sub(r'^English \| Tiếng Vi[eệ]t\s*', '', desc)
    # Cut at "EventTitle – MoT+++" which signals start of site nav boilerplate
    desc = re.split(r'\s+[–—-]\s+MoT\+\+\+', desc)[0]
    return desc.strip()


def clean_perfplus(desc):
    """Remove the 'introduction | events | ...' nav header from performance plus entries."""
    desc = re.sub(r'^introduction \| events \| artists-in-residence \| guest artists\s*', '', desc)
    return desc.strip()


def merge_images(base, extra):
    seen = set(base)
    merged = list(base)
    for img in extra:
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

    # ── 1. Baby Reni: bilingual merge ─────────────────────────────────────
    keep = by_slug['open-studio-by-baby-reni']
    remove = by_slug['mo-xuong-cua-baby-reni']

    keep['description'] = clean_bilingual(keep['description'])
    keep['vnTitle'] = remove['title']   # "Mở Xưởng của Baby Reni"
    keep['vnDescription'] = clean_bilingual(remove['description'])
    keep['images'] = merge_images(keep.get('images', []), remove.get('images', []))
    if not keep.get('thumbnail') and remove.get('thumbnail'):
        keep['thumbnail'] = remove['thumbnail']

    slugs_to_remove.add('mo-xuong-cua-baby-reni')
    new_redirects.append('/events/mo-xuong-cua-baby-reni /events/open-studio-by-baby-reni 301')
    print('[bilingual] Baby Reni merged. EN images:', len(keep['images']))

    # ── 2. Nhap-vai: -2 has EN desc, original has VN desc ─────────────────
    # Keep the slug WITHOUT -2; use -2's EN as description, original's VN as vnDescription
    keep_nhap = by_slug['nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do']
    remove_nhap = by_slug['nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do-2']

    vn_desc = clean_bilingual(keep_nhap['description'])   # original = VN
    en_desc = clean_bilingual(remove_nhap['description'])  # -2 = EN

    keep_nhap['description'] = en_desc
    keep_nhap['vnDescription'] = vn_desc
    keep_nhap['sortDate'] = '2025-08-02'   # the event date, not publish date
    keep_nhap['images'] = merge_images(keep_nhap.get('images', []), remove_nhap.get('images', []))
    if not keep_nhap.get('thumbnail') and remove_nhap.get('thumbnail'):
        keep_nhap['thumbnail'] = remove_nhap['thumbnail']

    slugs_to_remove.add('nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do-2')
    new_redirects.append(
        '/events/nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do-2 '
        '/events/nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do 301'
    )
    print('[bilingual] Nhap-vai merged. EN desc len:', len(en_desc))

    # ── 3. Living Today / Song nay biet mai: bilingual pair ───────────────
    keep_ltft = by_slug['living-today-for-tomorrow']
    remove_song = by_slug['song-nay-biet-mai']

    keep_ltft['description'] = clean_bilingual(keep_ltft['description'])
    keep_ltft['vnTitle'] = remove_song['title']
    keep_ltft['vnDescription'] = clean_bilingual(remove_song['description'])
    keep_ltft['images'] = merge_images(keep_ltft.get('images', []), remove_song.get('images', []))
    if not keep_ltft.get('thumbnail') and remove_song.get('thumbnail'):
        keep_ltft['thumbnail'] = remove_song['thumbnail']

    slugs_to_remove.add('song-nay-biet-mai')
    new_redirects.append('/events/song-nay-biet-mai /events/living-today-for-tomorrow 301')
    print('[bilingual] Living Today merged. VN title:', keep_ltft['vnTitle'][:50])

    # ── 4. Performance Plus 2019: merge 4 entries → introduction ──────────
    intro   = by_slug['performance-plus-2019-introduction']
    evts    = by_slug['performance-plus-2019-events']
    air     = by_slug['performance-plus-2019-artists-in-residence']
    guests  = by_slug['performance-plus-2019-guest-artists']

    # Reassemble one clear description
    intro_text  = clean_perfplus(intro['description'])
    events_text = clean_perfplus(evts['description'])
    air_text    = clean_perfplus(air['description'])
    guest_text  = clean_perfplus(guests['description'])

    merged_desc = (
        intro_text.rstrip() +
        '\n\nEvents\n\n' + events_text.rstrip() +
        '\n\nArtists in Residence\n\n' + air_text.rstrip() +
        '\n\nGuest Artists\n\n' + guest_text.rstrip()
    )
    intro['title'] = 'Performance Plus 2019'
    intro['description'] = merged_desc
    intro['images'] = merge_images(
        merge_images(merge_images(intro.get('images',[]), evts.get('images',[])),
                     air.get('images',[])),
        guests.get('images',[])
    )
    if not intro.get('thumbnail'):
        for src in [evts, air, guests]:
            if src.get('thumbnail'):
                intro['thumbnail'] = src['thumbnail']
                break

    for slug in ['performance-plus-2019-events', 'performance-plus-2019-artists-in-residence',
                 'performance-plus-2019-guest-artists']:
        slugs_to_remove.add(slug)
        new_redirects.append(f'/events/{slug} /events/performance-plus-2019-introduction 301')
    print('[merge] Performance Plus 2019: 4 → 1')

    # ── 5. Remove funded residency events ─────────────────────────────────
    funded = ['funded-residency-for-leipzig-based-artists',
              'funded-residency-for-vietnamese-artists',
              'self-funded-residency-program']
    for slug in funded:
        if slug in by_slug:
            slugs_to_remove.add(slug)
            print(f'[remove] {slug}')

    # ── Apply removals and re-sort ─────────────────────────────────────────
    events = [e for e in events if e['slug'] not in slugs_to_remove]
    events.sort(key=lambda e: e['sortDate'], reverse=True)

    with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print(f'\nRemoved {len(slugs_to_remove)} entries. {len(events)} events remain.')

    # ── Append redirects ───────────────────────────────────────────────────
    with open(REDIRECTS_FILE, encoding='utf-8') as f:
        existing = f.read()

    lines_to_add = [r for r in new_redirects if r.split()[0] not in existing]
    if lines_to_add:
        with open(REDIRECTS_FILE, 'a', encoding='utf-8') as f:
            f.write('\n# remaining bilingual/duplicate merge redirects\n')
            for line in lines_to_add:
                f.write(line + '\n')
        print(f'Added {len(lines_to_add)} redirect(s).')
    else:
        print('No new redirects needed.')


if __name__ == '__main__':
    main()
