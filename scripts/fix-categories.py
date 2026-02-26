#!/usr/bin/env python3
"""
Fix event categories in events-data.json.
The scraper's classifier was too simple — reclassify all events properly.
"""
import json, os, re

IN  = os.path.join(os.path.dirname(__file__), '..', 'events-data.json')
OUT = IN

def classify(title, description, slug):
    t  = title.lower()
    d  = (description or '').lower()
    s  = slug.lower()

    # ── MoTsound ─────────────────────────────────────────────────────────────
    if re.search(r'mot\s*sound', t) or 'motsound' in t:
        return 'MoTsound'

    # ── +1 performance ────────────────────────────────────────────────────────
    perf = [
        'performance plus', 'big day of performances', 'little night of performances',
        'performance, presentation', 'dusk dance', 'screen time | performance',
        'poetry plus | performance', 'cam xanh | run run run',
        'cam xanh | chaoart', 'tanya amador',
        'mot doi gai', 'ru marshall', 'weston teruya',
    ]
    if any(k in t for k in perf):
        return '+1 performance'
    if 'performance plus 2019' in d and 'performance plus 2019' not in t:
        return '+1 performance'

    # ── +1 nice place for experimentation ────────────────────────────────────
    exp = [
        'workshop', 'talk & discussion', 'talk |', '| a talk', 'a talk by',
        'discussion', 'reading station', 'mango tree', 'film screening', 'film screeni',
        'eta (estimated', 'causal capture', 'open call', 'funded residency',
        'self-funded residency', 'residency for', 'ai, reimagined', 'cyanotype',
        'codesurfing', 'lướt code', 'michael atavar', 'heARTalk',
        'calligraphic regimes', 'a neighbor is a canvas', 'residency reflection',
        'naturecult', 'renaissance international school',
    ]
    if any(k in t for k in exp):
        return '+1 nice place for experimentation'

    # ── +a.farm ───────────────────────────────────────────────────────────────
    farm = [
        'open studio', 'mo xuong', 'mở xưởng', 'artist-in-residence',
        'saigon dreaming', 'crossing a shoreless sea', 'ian strange',
        'may open studio', 'april open studio', 'between land & sea',
        'giữa đất và biển',
    ]
    if any(k in t for k in farm):
        return '+a.farm'
    # resident bio pages
    resident_bio_slugs = [
        'noah-spivak', 'juan-leduc-riley', 'kaki', 'nguyen-giao-xuan',
        'van-anh-le', 'coco', 'lai-minh-ngoc', 'linh-le', 'le-d-chung',
        'ania-reynolds', 'anh-tran', 'linh-vh-nguyen', 'shiro-masuyama',
        'thom-nguyen', 'ian-strange', 'exxonnubile', 'x-o-', 'aylin-derya',
        'virginie-tan', 'baby-reni', 'duy-nguyen', 'ru-marshall',
        'nguyen-hoa', 'vicente-arrese', 'alex-williams', 'lau-wang-tat',
        'narelle-zhao', 'annabelle-yep', 'linh-san', 'damon-duc-pham',
        'mascha-serga', 'blake-palmer', 'david-willis', 'laura-philips',
        'anh-vo', 'chau-kim-sanh', 'bert-ackley', 'espen-iden',
        'kayla-kurin', 'claire-bloomfield', 'yeonjeong', 'saverio-tonoli',
        'ly-trang', 'chu-hao-pei', 'nghia-dang', 'lananh-le',
        'xxavier-edward-carter', 'do-nguyen-lap-xuan', 'samira-jamouchi',
        'aliansyah-caniago', 'dang-thuy-anh', 'flinh', 'masayuki-miyaji',
        'shayekh-mohammed-arif', 'zach-sch', 'ayumi-adachi',
        'sikarnt-skoolisariyaporn', 'eden-barrena', 'matteo-biella',
        'tina-thu', 'rachel-tonthat', 'roberto-sifuentes', 'aram-han-sifuentes',
        'kanich-khajohnsri', 'levi-masuli', 'nguyen-le-phuong-linh',
        'natalia-ludmila', 'z1-studio', 'constance-meffre',
        'lan-anh-le', 'mariana-tubio', 'matthew-brannon', 'scott-anderson',
        'cora-von', 'scott-farrand', 'tuyen-nguyen', 'alisa-chunchue',
        'karen-thao', 'lem-trag', 'latthapon', 'luca-lum', 'tricia-nguyen',
        'bagus-mazasupa', 'ben-valentine', 'nguyen-duc-phuong',
        'cian-duggan', 'john-edmond-smyth', 'kim-duy', 'tram-luong',
        'maung-day', 'le-hien-minh',
    ]
    if any(k in s for k in resident_bio_slugs):
        return '+a.farm'

    # ── +1 contemporary project ───────────────────────────────────────────────
    cont = [
        'exhibition', 'solo exhibition', 'group show', 'art fair', 'swab',
        'seeking severance', 'once upon a time', 'frozen data', 'dữ liệu',
        'flowers | tran', 'những bông hoa', 'hypnotising chickens', 'gà gật',
        'water resistance', 'nước |', 'reunification flowers', 'hoa thống nhất',
        'love in the time of cholera', 'between land & sea',
        'othermother', 'rainy season | mùa mưa',
        'girl in red', 'gái mặc đỏ',
        'password 0~1', 'all animals are equal',
        'california dreaming', 'while the soil slumbers',
        'play temple', 'time borrowed, space transited',
        'trash ♻', 'post vidai', 'nguyen art foundation',
        'a. farm | one world', 'a.farm | one world',
        'home | land', 'entrances | cian',
        'it seems to be | dao', 'it seems to be | đào',
        'artist talk', 'artist-in-residence', 'sống nay biết mai', 'living, today',
        'coco', 'tingling sensation', 'giữa những chớp bóng',
        'nhập vai ký ức', 'nuoc |', 'nước | water',
        'saigon dreaming',   # solo show at a.farm
        'the museum', '+1 museum',
        'performance, presentation & discussion',  # artist talk
    ]
    if any(k in t for k in cont):
        return '+1 contemporary project'

    # ── MoTsound (catch wider sound patterns) ────────────────────────────────
    if 'motsoound' in s or re.search(r'mot-sound', s) or 'arenaissance' in s or 'aschismism' in s or 'amoment' in s or 'adom' in s or 'anoise' in s or 'aconvergence' in s or 'amoeba' in s:
        return 'MoTsound'
    # numbered events: "mot sound #N"
    if re.search(r'#\d+', t) and ('sound' in t or 'mot' in t):
        return 'MoTsound'

    # ── Default to +a.farm ────────────────────────────────────────────────────
    return '+a.farm'


def main():
    with open(IN, encoding='utf-8') as f:
        events = json.load(f)

    before = {}
    from collections import Counter
    for e in events:
        before[e['category']] = before.get(e['category'], 0) + 1

    for e in events:
        e['category'] = classify(e['title'], e['description'], e['slug'])

    after = Counter(e['category'] for e in events)

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print("Category changes:")
    print(f"  Before: {dict(sorted(before.items()))}")
    print(f"  After:  {dict(sorted(after.items()))}")
    print(f"\nSaved {len(events)} events.")


if __name__ == '__main__':
    main()
