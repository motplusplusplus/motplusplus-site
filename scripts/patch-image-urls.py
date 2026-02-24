#!/usr/bin/env python3
"""Replace all WordPress CDN image URLs with R2 URLs in the source code."""

import os
import re

R2_BASE = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev"
WP_BASE = "https://motplusplusplus.com/wp-content/uploads/"

# Complete mapping: wordpress_path → r2_key
# (strip the WP_BASE prefix to get the path, then map to r2_key)
URL_MAP = {
    # Aliansyah Caniago
    "2024/09/aliansyah-caniago-portrait-edited.jpg": "motplus/collective/aliansyah-caniago/portrait.jpg",
    "2024/09/image_1236502914-2880735566-e1729230292790.jpg": "motplus/collective/aliansyah-caniago/work-01.jpg",
    "2024/09/image_1236502911.jpg": "motplus/collective/aliansyah-caniago/work-02.jpg",
    "2024/09/image_123650291.jpg": "motplus/collective/aliansyah-caniago/work-03.jpg",
    "2024/09/image_67156993.jpg": "motplus/collective/aliansyah-caniago/work-04.jpg",
    "2024/09/image_1236502912.jpg": "motplus/collective/aliansyah-caniago/work-05.jpg",
    "2024/09/image_1236502913.jpg": "motplus/collective/aliansyah-caniago/work-06.jpg",
    "2024/09/image_1236502915.jpg": "motplus/collective/aliansyah-caniago/work-07.jpg",
    # Cam Xanh
    "2024/10/whatsapp-image-2024-10-24-at-14.24.32.jpeg": "motplus/collective/cam-xanh/portrait.jpg",
    "2019/12/originalphoto-598620532.837176-2689450228-e1729755540751.jpeg": "motplus/collective/cam-xanh/work-01.jpg",
    "2017/09/north-60cm-x-60cm-x-10cm-marker-on-silk-cocoons-wood-and-plexiglass-box-2017-4235313200-e1729755579994.jpg": "motplus/collective/cam-xanh/work-02.jpg",
    "2017/09/twannual-2nd-september-2017-_home-_-nha5.jpg": "motplus/collective/cam-xanh/work-03.jpg",
    "2019/06/cam-xanh-mot-doi-gai-999-9-clouds-2886507088-e1729755624783.jpeg": "motplus/collective/cam-xanh/work-04.jpg",
    "2019/06/cam-xanh-instagram-entrance-for-mot-doi-gai.jpg": "motplus/collective/cam-xanh/work-05.jpg",
    "2019/06/cam-xanh-mot-doi-gai-flower-market1-2165958030-e1729755650679.jpg": "motplus/collective/cam-xanh/work-06.jpg",
    "2019/12/whatsapp-image-2019-12-03-at-17.14.55-2163963779-e1729755729877.jpeg": "motplus/collective/cam-xanh/work-07.jpg",
    # Cian Duggan
    "2024/11/whatsapp-image-2024-11-01-at-14.20.05.jpeg": "motplus/collective/cian-duggan/portrait.jpg",
    "2024/11/othermother-2019-enamel-on-concrete.jpg": "motplus/collective/cian-duggan/work-01.jpg",
    "2024/11/ever-matter-no-matter-triptych-2022-enamel-on-uv-printed-plexiglass-100cm-x-168cm-3-panels.jpg": "motplus/collective/cian-duggan/work-02.jpg",
    "2024/11/birdsong-breath-2023-enamel-on-plexiglass-40-cm-x-50-cm.jpg": "motplus/collective/cian-duggan/work-03.jpg",
    "2024/11/a-new-smell-of-salty-soil-2023-enamel-on-uv-printed-plexiglass-125cm-x-100cm.jpg": "motplus/collective/cian-duggan/work-04.jpg",
    "2024/11/a-glass-passage-2022-enamel-on-uv-printed-plexiglass-50cm-x-40cm.jpg": "motplus/collective/cian-duggan/work-05.jpg",
    "2024/11/a-fragrant-cave-2023-enamel-on-plexiglass-40cm-x-50cm.jpg": "motplus/collective/cian-duggan/work-06.jpg",
    "2024/11/singing-for-the-sirens-2023-enamel-on-uv-printed-plexiglass-100cm-x-149cm.jpg": "motplus/collective/cian-duggan/work-07.jpg",
    # Kim Duy
    "2024/10/17373363_1665984906762617_639537065_o-edited.jpg": "motplus/collective/kim-duy/portrait.jpg",
    "2024/09/field-of-schredded-paper-installation-view.jpg": "motplus/collective/kim-duy/work-01.jpg",
    "2024/09/field-of-shredded-paper-details.jpg": "motplus/collective/kim-duy/work-02.jpg",
    "2024/09/img_6168.jpg": "motplus/collective/kim-duy/work-03.jpg",
    "2024/09/vietnamese-dictionary-1-edited.jpg": "motplus/collective/kim-duy/work-04.jpg",
    "2024/09/vietnamese-dictionary.jpg": "motplus/collective/kim-duy/work-05.jpg",
    "2024/09/a.b.s.t.r.a.c.t.i.o.n-installation-view1.jpg": "motplus/collective/kim-duy/work-06.jpg",
    "2024/09/a.b.s.t.r.a.c.t.i.o.n-installation-view2.jpg": "motplus/collective/kim-duy/work-07.jpg",
    # Le Phi Long
    "2024/09/received_584807488780020-edited.jpeg": "motplus/collective/le-phi-long/portrait.jpg",
    "2024/09/visibleinvisible-map201804.2018-2280634525-e1727244185794.jpeg": "motplus/collective/le-phi-long/work-01.jpg",
    "2024/09/hic-domus-est-dei_phi-long-le-artist_01-3675252259-e1727244232397.png": "motplus/collective/le-phi-long/work-02.png",
    "2024/09/image-8-1941942321-e1727244245862.jpeg": "motplus/collective/le-phi-long/work-03.jpg",
    "2024/09/image-3309110367-e1727244252660.jpeg": "motplus/collective/le-phi-long/work-04.jpg",
    "2024/09/img_1828-1221126439-e1727244263961.jpeg": "motplus/collective/le-phi-long/work-05.jpg",
    "2024/09/dscf7179-2-1865375392-e1727244299121.jpeg": "motplus/collective/le-phi-long/work-06.jpg",
    "2024/09/in02-850585292-e1727244344399.jpeg": "motplus/collective/le-phi-long/work-07.jpg",
    "2024/09/img_3680.jpeg": "motplus/collective/le-phi-long/work-08.jpg",
    "2024/09/dscf7129-2385631041-e1727244388773.jpeg": "motplus/collective/le-phi-long/work-09.jpg",
    "2024/09/hic-domus-est-dei_phi-long-le-artist_010-1449632181-e1727244407852.png": "motplus/collective/le-phi-long/work-10.png",
    # Wu Chi-Tsung
    "2024/10/2019-dust_light-interdiction_kunstfest-weimar_germany_03credit-to-sylvia-lee-edited.jpg": "motplus/collective/wu-chi-tsung/portrait.jpg",
    "2024/10/wire-vi_2021_jing-atmospheres_sean-kelly-gallery_new-york_e990b5e7b5b2e7b6b2e585ad_e5a283_e5b09ae587b1e588a9e8979de5bb8a_e7b490e7b484-1.jpg": "motplus/collective/wu-chi-tsung/work-01.jpg",
    "2024/10/dust-002-40-basel-unlimited-2023-01s-1-4248789341-e1729234295339.jpg": "motplus/collective/wu-chi-tsung/work-02.jpg",
    "2024/10/drawing-studies-1.jpg": "motplus/collective/wu-chi-tsung/work-03.jpg",
    "2024/10/cc00340measurement-of-the-other-e28093-contemporary-art-from-taiwan-soka-art-center-beijing-cn_2010-1.jpg": "motplus/collective/wu-chi-tsung/work-04.jpg",
    "2024/10/s_cyano-collage-024e6b0b0e5b1b1e99b86e4b98be4ba8ce58d81e59b9b_180x360_2018-1.jpg": "motplus/collective/wu-chi-tsung/work-05.jpg",
    "2024/10/s_cyano-collage-001-e6b0b0e5b1b1e99b86e4b98be4b880_180x407_2016-1.jpg": "motplus/collective/wu-chi-tsung/work-06.jpg",
    "2024/10/cyano-collage-121-e6b0b0e5b1b1e99b86e4b98be4b880e799bee4ba8ce58d81e4b880_360x360-e59c93_2021.png": "motplus/collective/wu-chi-tsung/work-07.png",
    "2024/10/s_wrinkled-texture-127-e79ab4e6b395e7bf92e4bd9c127_72x88cm_2022-1.jpg": "motplus/collective/wu-chi-tsung/work-08.jpg",
    "2024/10/s_wrinkled-texture-96_e79ab4e6b395e7bf92e4bd9c-96_92x44.1_2021-1.jpg": "motplus/collective/wu-chi-tsung/work-09.jpg",
    # MoTsound
    "2025/09/fb-event-2.jpg": "motplus/motsound/25-poster.jpg",
    "2024/10/sketch-for-future-basketball_ig1-2388393968-e1730358066394.jpg": "motplus/motsound/24-poster.jpg",
    "2024/07/dscf5259.jpg": "motplus/motsound/24-photo-01.jpg",
    "2024/07/dscf5195.jpg": "motplus/motsound/24-photo-02.jpg",
    "2024/07/dscf5199.jpg": "motplus/motsound/24-photo-03.jpg",
    "2024/07/dscf5202.jpg": "motplus/motsound/24-photo-04.jpg",
    "2024/07/dscf5220.jpg": "motplus/motsound/24-photo-05.jpg",
    "2024/07/dscf5239.jpg": "motplus/motsound/24-photo-06.jpg",
    "2024/07/dscf5242.jpg": "motplus/motsound/24-photo-07.jpg",
    "2024/07/dscf5255.jpg": "motplus/motsound/24-photo-08.jpg",
    "2024/10/20240412_211218.jpg": "motplus/motsound/23-poster.jpg",
    "2024/10/20240412_200311.jpg": "motplus/motsound/23-photo-01.jpg",
    "2024/10/20240412_204540.jpg": "motplus/motsound/23-photo-02.jpg",
    "2024/10/20240412_214649.jpg": "motplus/motsound/23-photo-03.jpg",
    "2024/10/20240412_223022.jpg": "motplus/motsound/23-photo-04.jpg",
    "2024/04/screenshot_20241031_145605_gallery.jpg": "motplus/motsound/23-photo-05.jpg",
    "2024/04/screenshot_20241031_145624_gallery.jpg": "motplus/motsound/23-photo-06.jpg",
    "2024/10/screen-shot-2024-10-31-at-15.29.03-326233084-e1730363417415.png": "motplus/motsound/22-poster.png",
    "2024/10/screen-shot-2024-10-31-at-16.06.57-2048950795-e1730365890397.png": "motplus/motsound/21-poster.png",
    "2024/10/screen-shot-2024-10-31-at-15.23.46.png": "motplus/motsound/20-poster.png",
    "2020/11/dscf4697-1.jpg": "motplus/motsound/16-poster.jpg",
    "2020/09/motsound-15-arenaissance-newsletter-copy-01-2115828726-e1730960447253.jpg": "motplus/motsound/15-poster.jpg",
    "2020/02/screenshot-2024-11-07-at-1.25.37e280afpm-3200530695-e1730961079716.png": "motplus/motsound/14-poster.png",
    "2020/01/screenshot-2024-11-07-at-1.28.16e280afpm-870710423-e1730961344873.png": "motplus/motsound/13-poster.png",
    "2019/12/img_3791-1941243902-e1730961162660.jpg": "motplus/motsound/12-poster.jpg",
    "2019/08/motsound_11_2.jpg": "motplus/motsound/11-poster.jpg",
    "2019/04/79c2290b-aed7-4a92-937b-aad395c3cf7f.jpg": "motplus/motsound/10-poster.jpg",
    "2019/03/linhhafornow_2_20181202-e6b5a3e88e8e-1.jpg": "motplus/motsound/09-poster.jpg",
    "2024/11/originalphoto-555680801.436318-2274474061-e1730961975834.jpg": "motplus/motsound/08-poster.jpg",
    "2018/05/screenshot-2024-11-07-at-1.53.38e280afpm-4080227694-e1730962647391.png": "motplus/motsound/06-poster.png",
    "2018/03/img_3793-2646304466-e1730963326520.jpg": "motplus/motsound/04-poster.jpg",
    "2017/05/motso1.jpg": "motplus/motsound/01-poster.jpg",
    # General
    "2024/10/20240521_204150-e1748507392604.jpg": "motplus/general/homepage-programs.jpg",
    "2024/10/20240208_205134.jpg": "motplus/general/homepage-residents.jpg",
    "2024/10/20240314_193142.jpg": "motplus/general/homepage-events.jpg",
    "2024/10/a.farmlogo_500x500-1-2.jpg": "motplus/general/afarm-logo.jpg",
}

SOURCE_DIRS = [
    "/Users/andrewwalther/Documents/motplus/app",
    "/Users/andrewwalther/Documents/motplus/components",
    "/Users/andrewwalther/Documents/motplus/lib",
]

EXTENSIONS = {".tsx", ".ts", ".js", ".jsx"}


def patch_file(path, replacements):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content
    for old, new in replacements:
        content = content.replace(old, new)

    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


def build_replacements():
    pairs = []
    for wp_path, r2_key in URL_MAP.items():
        old = WP_BASE + wp_path
        new = f"{R2_BASE}/{r2_key}"
        pairs.append((old, new))
        # Also cover ?w= variants WordPress sometimes includes
        pairs.append((old + "?w=1024", new))
        pairs.append((old + "?w=768", new))
        pairs.append((old + "?w=819", new))
        pairs.append((old + "?w=821", new))
        pairs.append((old + "?w=825", new))
        pairs.append((old + "?w=850", new))
        pairs.append((old + "?w=576", new))
        pairs.append((old + "?w=767", new))
    return pairs


def main():
    replacements = build_replacements()
    patched = []
    total_changes = 0

    for src_dir in SOURCE_DIRS:
        for root, dirs, files in os.walk(src_dir):
            # skip node_modules just in case
            dirs[:] = [d for d in dirs if d != "node_modules"]
            for fname in files:
                if os.path.splitext(fname)[1] not in EXTENSIONS:
                    continue
                fpath = os.path.join(root, fname)
                changed = patch_file(fpath, replacements)
                if changed:
                    patched.append(fpath.replace("/Users/andrewwalther/Documents/motplus/", ""))
                    total_changes += 1

    print(f"\n✓ Patched {total_changes} file(s):")
    for p in patched:
        print(f"  {p}")

    # Check for any remaining WordPress URLs in source
    remaining = []
    for src_dir in SOURCE_DIRS:
        for root, dirs, files in os.walk(src_dir):
            dirs[:] = [d for d in dirs if d != "node_modules"]
            for fname in files:
                if os.path.splitext(fname)[1] not in EXTENSIONS:
                    continue
                fpath = os.path.join(root, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                if "motplusplusplus.com/wp-content" in content:
                    remaining.append(fpath.replace("/Users/andrewwalther/Documents/motplus/", ""))

    if remaining:
        print(f"\n⚠  WordPress URLs still found in:")
        for r in remaining:
            print(f"  {r}")
    else:
        print("\n✓ No WordPress image URLs remaining in source code.")


if __name__ == "__main__":
    main()
