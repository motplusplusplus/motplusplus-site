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

// Inquiry-capture endpoint (task 01). Writes a Sanity `inquiry` document as the
// source of truth; the site forms fall back to mailto if this is unreachable.
// The write token lives ONLY as a Worker secret (SANITY_INQUIRY_TOKEN) — never
// in the repo or in NEXT_PUBLIC_*.
const INQUIRY_ALLOWED_ORIGINS = new Set([
  "https://motplusplusplus.com",
  "https://www.motplusplusplus.com",
]);

// Per-type whitelist of extra fields that may be stored, matching the Sanity
// `inquiry` schema's type-conditional fields. Anything not listed is dropped so
// a client can't inject arbitrary document fields. `general` is intentionally
// absent: the schema's `type` list has only these three values.
const INQUIRY_TYPE_FIELDS = {
  trash: ["artworkTitle", "artworkId"],
  residency: ["studioType", "startMonth", "duration", "portfolioUrl"],
  museum: ["locationName", "locationId", "hostEmail"],
};

function inquiryCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
  if (origin && INQUIRY_ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function inquiryJson(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...inquiryCorsHeaders(request) },
  });
}

async function handleInquiry(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: inquiryCorsHeaders(request) });
  }
  if (request.method !== "POST") {
    return inquiryJson({ error: "method not allowed" }, 405, request);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return inquiryJson({ error: "invalid json" }, 400, request);
  }

  const { type, name, email, message } = payload || {};
  if (!INQUIRY_TYPE_FIELDS[type]) {
    return inquiryJson({ error: "invalid type" }, 400, request);
  }
  if (typeof name !== "string" || name.trim() === "") {
    return inquiryJson({ error: "name is required" }, 400, request);
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return inquiryJson({ error: "a valid email is required" }, 400, request);
  }
  if (typeof message !== "string" || message.length > 5000) {
    return inquiryJson({ error: "message is too long" }, 400, request);
  }

  // whitelist the type-conditional fields (strings only)
  const extra = {};
  for (const key of INQUIRY_TYPE_FIELDS[type]) {
    if (typeof payload[key] === "string" && payload[key] !== "") {
      extra[key] = payload[key];
    }
  }

  const doc = {
    _type: "inquiry",
    type,
    status: "new",
    submittedAt: new Date().toISOString(),
    name: name.trim(),
    email: email.trim(),
    message: typeof message === "string" ? message : "",
    ...extra,
  };

  let sanityRes;
  try {
    sanityRes = await fetch(
      "https://t5nsm79o.api.sanity.io/v2026-03-20/data/mutate/production",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + env.SANITY_INQUIRY_TOKEN,
        },
        body: JSON.stringify({ mutations: [{ create: doc }] }),
      }
    );
  } catch {
    return inquiryJson({ error: "could not record inquiry" }, 502, request);
  }
  if (!sanityRes.ok) {
    return inquiryJson({ error: "could not record inquiry" }, 502, request);
  }

  return inquiryJson({ ok: true }, 200, request);
}

// Pricelist / +1 Trash price-reveal gate. The trashItem `price` values are
// deliberately NOT serialized into the static export (see app/pricelist/page.tsx,
// app/trash/page.tsx, app/trash/[slug]/page.tsx) -- otherwise they ship in the
// public HTML/flight payload where anyone can read them regardless of any
// client-side "password". Prices are delivered ONLY here, after a server-side
// check against the PRICELIST_PASSWORD secret. ONE endpoint serves BOTH trigger
// points -- the /pricelist password screen and the /trash seven-click modal --
// because they share one secret and one set of price data, keyed by document
// _id. Reads use Sanity's public read API at request time (same data the build
// reads; no token needed). Fail closed: if the secret is unset, every attempt
// is 401.
const PRICELIST_PRICE_QUERY =
  `*[_type == "trashItem" && active == true && (sold == true || (defined(price) && price != "")) && sold != true && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])]{ _id, price }`;

async function handlePricelist(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: inquiryCorsHeaders(request) });
  }
  if (request.method !== "POST") {
    return inquiryJson({ error: "method not allowed" }, 405, request);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return inquiryJson({ error: "invalid json" }, 400, request);
  }

  const password = payload && payload.password;
  if (typeof password !== "string" || !env.PRICELIST_PASSWORD || password !== env.PRICELIST_PASSWORD) {
    return inquiryJson({ error: "incorrect" }, 401, request);
  }

  const prices = {};
  try {
    const res = await fetch(
      `https://t5nsm79o.api.sanity.io/v2026-03-20/data/query/production?query=${encodeURIComponent(PRICELIST_PRICE_QUERY)}`
    );
    if (!res.ok) throw new Error("sanity query failed");
    const data = await res.json();
    for (const row of data.result || []) {
      if (row && row._id) prices[row._id] = typeof row.price === "string" ? row.price : "";
    }
  } catch {
    return inquiryJson({ error: "could not load prices" }, 502, request);
  }

  return inquiryJson({ ok: true, prices }, 200, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Inquiry-capture API — handled first. POST/OPTIONS never match a static
    // asset, so this is safe ahead of the redirect + asset-first routing below.
    if (path === "/api/inquiry") {
      return handleInquiry(request, env);
    }

    // Price-reveal gate for /pricelist and the /trash seven-click modal. POST
    // only, so (like /api/inquiry) it never shadows a static asset -- no
    // run_worker_first needed.
    if (path === "/api/pricelist") {
      return handlePricelist(request, env);
    }

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
      '/profiles/baby-reni': '/profiles/irene-ha/',
      '/profiles/vicente-arresse': '/profiles/vicente-arrese/',
      '/profiles/tran-luong': '/profiles/tram-luong/',
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
