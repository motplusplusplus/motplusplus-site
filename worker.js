// Legacy event-announcement slugs (e.g. "introducing resident X") that were
// migrated to /profiles/[slug] bio pages and excluded from /events/ static
// generation (see BIO_SLUGS in lib/events.ts). Their old /events/[slug] URLs
// 404 — some are still indexed by search engines — so we 301 them to the
// profile page that now holds this content. Verified individually: each of
// these slugs resolves to a working /profiles/[slug]/ page.
const EVENT_TO_PROFILE_SLUGS = new Set([
  "alisa-chunchue", "anh-tran", "anh-vo", "ania-reynolds", "annabelle-yep", "aram-han-sifuentes",
  "aylin-derya-stahl", "bagus-mazasupa-anwarridwan", "ben-valentine", "bert-ackley", "bert-nguyen-san", "blake-palmer",
  "boynton-yue", "chau-kim-sanh", "chu-hao-pei", "cian-duggan", "claire-bloomfield", "coco",
  "constance-meffre", "cora-von-zezschwitz-tilman-hoepfl", "damon-duc-pham", "david-willis", "duy-nguyen", "eden-barrena",
  "enkhbold-togmidshiirev", "espen-iden", "exxonnubile-julia-weiner", "ian-strange", "irene-ha", "john-edmond-smyth",
  "juan-leduc-riley", "kaki", "kanich-khajohnsri", "karen-thao-nguyen-la", "kayla-kurin", "kim-duy",
  "lai-minh-ngoc", "lan-anh-le", "lap-xuan", "latthapon-korkiatarkul", "lau-wang-tat", "laura-philips",
  "le-d-chung", "lem-trag", "levi-masuli", "linh-le", "linh-san", "linh-vh-nguyen",
  "luca-lum", "ly-trang", "lyon-nguyen", "mariana-tubio-blasio", "mascha-serga", "matteo-biella",
  "matthew-brannon", "maung-day", "michael-atavar", "montez-press", "narelle-zhao", "natalia-ludmila",
  "nghia-dang", "ngo-thanh-bac", "nguyen-duc-phuong", "nguyen-giao-xuan", "nguyen-hoa", "nguyen-le-phuong-linh",
  "nhan-phan", "noah-spivak", "pug-alex-williams", "rachel-tonthat", "roberto-sifuentes", "ru-marshall",
  "saverio-tonoli", "scott-anderson", "scott-farrand", "shiro-masuyama", "song-nguyen", "tam-do",
  "thom-nguyen", "tina-thu", "tram-luong", "tran-minh-duc", "tran-uy-duc", "tricia-nguyen-thanh-trang",
  "tuyen-nguyen", "van-anh-le", "vicente-arrese", "virginie-tan", "weston-teruya", "wu-chi-tsung",
  "x-o-veron-xio", "yeonjeong", "yui-nguyen", "z1-studio",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Legacy event-announcement URLs for individual residents → bio pages
    const eventSlugMatch = path.match(/^\/events\/([^/]+)\/?$/);
    if (eventSlugMatch && EVENT_TO_PROFILE_SLUGS.has(eventSlugMatch[1])) {
      url.pathname = `/profiles/${eventSlugMatch[1]}/`;
      return Response.redirect(url.toString(), 301);
    }

    // /residents/* → /profiles/*
    if (path === '/residents' || path.startsWith('/residents/')) {
      url.pathname = path.replace(/^\/residents/, '/profiles');
      return Response.redirect(url.toString(), 301);
    }

    // /artists/* → /profiles/*
    if (path === '/artists' || path.startsWith('/artists/')) {
      url.pathname = path.replace(/^\/artists/, '/profiles');
      return Response.redirect(url.toString(), 301);
    }

    // Consolidated duplicate profiles → canonical profile
    const PROFILE_REDIRECTS = {
      '/profiles/pug-alex-williams': '/profiles/alex-williams/',
      '/profiles/do-nguyen-lap-xuan': '/profiles/lap-xuan/',
      '/profiles/scobi-wan': '/profiles/alec-schachner/',
      '/profiles/writher': '/profiles/nguyen-hong-giang/',
      '/profiles/dan-nguyen-demonslayer': '/profiles/dan-nguyen/',
    };
    const canonicalProfile = PROFILE_REDIRECTS[path.replace(/\/$/, '')];
    if (canonicalProfile) {
      url.pathname = canonicalProfile;
      return Response.redirect(url.toString(), 301);
    }

    // Old WordPress URLs: /YYYY/MM/DD/slug → /events/slug
    const wpMatch = path.match(/^\/\d{4}\/\d{2}\/\d{2}\/(.+)$/);
    if (wpMatch) {
      url.pathname = `/events/${wpMatch[1]}`;
      return Response.redirect(url.toString(), 301);
    }

    // Serve static assets (respects _redirects, _headers, etc.)
    return env.ASSETS.fetch(request);
  },
};
