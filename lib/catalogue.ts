/** The MoTcyclopedia and events catalogue (2026-11-22 redesign). Server only.
 *
 *  ONE build-time fetch of artists, events and works, memoised for the whole
 *  static export, from which /profiles, /profiles/[slug], /events,
 *  /events/[slug], the drift index and the wall index are all derived. Sources
 *  and precedence are unchanged (ARCHITECTURE.md §3): Sanity wins, then
 *  artists-data.json / events-data.json fill gaps, so no page that exists today
 *  drops out. Profiles and events are never hidden for lack of data (S7). */

import fs from 'node:fs';
import path from 'node:path';
import { buildClient, getAllEventsFromJson, getAllProfileWorks, getMotsoundPerformerEditions } from './sanity';
import { artistsFromData, CONSOLIDATED_BIO_SLUGS, getArtistSlugs } from './artists';
import { BIO_SLUGS, HIDDEN_SLUGS } from './events';
import { isJunkImage } from './junk-images';
import { isExcludedPerson } from './excludedPeople';
import { normalizeWork, type Work } from './trashWork';
import { computeBadges } from './badges';
import { probeImageSize } from './mediaProbe';
import { fold, sortKey } from './fold';
import { DISCIPLINE_LABELS } from './disciplines';

// ─── types ─────────────────────────────────────────────────────────────────

export type Img = {
  url: string;
  w?: number; h?: number;
  /** Sanity hotspot centre, 0..1 (crop focus for tiles) */
  fx?: number; fy?: number;
  credit?: string | null;
  caption?: string | null;
  alt?: string | null;
  poster?: boolean;
};

/** linked: a profile page exists (active). Inactive stubs keep their name, unlinked. */
export type PersonRef = { _id: string; name: string; slug: string | null; linked?: boolean };
export type Credit = { role: string; person: PersonRef };

export type Venue = { name: string; address?: string | null; city?: string | null; country?: string | null; mapUrl?: string | null };

export type CEvent = {
  _id: string;
  slug: string;
  title: string;
  vnTitle?: string | null;
  dateISO: string;
  endDateISO?: string | null;
  displayDate: string;
  year: number;
  category: string;
  location: string;
  venue: Venue | null;
  /** venue first, then any other venues the event used (event.otherVenues) */
  venues: Venue[];
  /** event.whereLabel: shown instead of the venue name wherever the location appears */
  whereLabel: string | null;
  /** event.pastVenues: places an ongoing program used before, with years; always shown as past */
  pastVenues: { venue: Venue; from: number | null; to: number | null }[];
  description: string;
  vnDescription: string;
  images: Img[];
  cover: Img | null;
  /** true when the only usable cover is a poster (never the event-page hero) */
  coverIsPoster: boolean;
  videos: string[];
  bandcampAlbumId?: string | null;
  wpLink?: string | null;
  credits: Credit[];
  partners: { name: string; url?: string | null; role?: string | null }[];
  isBioPage: boolean;
  listed: boolean;
  updatedAt: string;
};

export type Person = {
  _id: string | null;
  slug: string;
  name: string;
  aliases: string[];
  sortName: string;
  sortKey: string;
  letter: string;
  portrait: Img | null;
  portraitSource?: string | null;
  bio: unknown[] | string;
  hasBio: boolean;
  vnBio: unknown[] | string;
  pronouns?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  nationalities: string[];
  originCity?: string | null;
  basedIn: { city?: string | null; country?: string | null } | null;
  disciplines: string[];
  role?: string | null;
  links: { label: string; url: string }[];
  instagram?: string | null;
  photos: Img[];
  collectives: (PersonRef & { role?: string | null; since?: string | null })[];
  roster: (PersonRef & { role?: string | null; since?: string | null })[];
  /** derived */
  eventSlugs: string[];
  roles: string[];
  programs: string[];
  sinceYear: number | null;
  lastDate: string | null;
  isResident: boolean;
  isLena: boolean;
  updatedAt: string;
};

export type Catalogue = {
  people: Person[];
  peopleBySlug: Map<string, Person>;
  peopleById: Map<string, Person>;
  events: CEvent[];          // every event, incl. bio pages
  listed: CEvent[];          // the public archive, newest first
  eventsBySlug: Map<string, CEvent>;
  works: Work[];
  worksByPerson: Map<string, Work[]>;
  tiles: Map<string, Tile>;
};

/** What a person's 4:5 tile shows (P1): portrait → solo/duo event photo → a work → typographic. */
export type Tile = { img: Img; from: 'portrait' | 'event' | 'work' } | null;

// ─── helpers ───────────────────────────────────────────────────────────────

const plain = (b: unknown): string => Array.isArray(b)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? b.map((x: any) => (x?.children ?? []).map((c: any) => c?.text ?? '').join('')).join('\n\n')
  : typeof b === 'string' ? b : '';

const LOGO = /(^|[^a-z])(logo|logomot|a\.?farm-?logo|motplus-?logo|wordmark|favicon)([^a-z]|$)/i;
export const isLogoName = (s: string | null | undefined) => !!s && (LOGO.test(s) || isJunkImage(s));
const POSTER_NAME = /poster|fb-?event|banner|flyer|invit|announce/i;
// Legacy files the scraper copied into the wrong event folders (2026-11-22): ngo-1/lai-1 are
// Tram Luong's portrait (her archived post: TramLuong.jpg); ngo-2/lai-2 are one identical file
// in both folders, matching neither artist's archived post. Never shown for these events.
const MISFILED = new Set([
  'https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/events/ngo-thanh-bac/ngo-1.jpg',
  'https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/events/ngo-thanh-bac/ngo-2.jpg',
  'https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/events/artist-in-residence-lai-dieu-ha/lai-1.jpg',
  'https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/events/artist-in-residence-lai-dieu-ha/lai-2.jpg',
]);

const VN_SURNAMES = new Set('nguyen tran le pham hoang huynh phan vu vo dang bui do ho ngo duong ly dinh lam luu truong mai ta chau lai dao cao ha ton thai kieu trinh quach la luong doan vuong tang au diep phung thach khuc quan tieu giang nghiem kim trieu lu mac ong hua cu lieu tong'.split(' '));
/** Same rule as the Studio pre-fill (scripts/phase7-prefill-redesign-fields.mjs), for
 *  JSON-only people with no Sanity sortName. */
function guessSortName(name: string): string {
  const words = name.replace(/\s*\(.*?\)\s*/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return name;
  const f = words.map(w => fold(w).replace(/[^a-z]/g, ''));
  if (VN_SURNAMES.has(f[0])) return words[0];
  return words[words.length - 1];
}

function letterOf(s: string): string {
  const c = sortKey(s)[0] ?? '#';
  return /[a-z]/.test(c) ? c.toUpperCase() : '#';
}

const YT = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=[\w-]{11}|embed\/[\w-]{11}|live\/[\w-]{11}|shorts\/[\w-]{11})|youtu\.be\/[\w-]{11}|(?:player\.)?vimeo\.com\/(?:video\/)?\d+)[^\s)"'<>\]]*/g;
export function videoLinks(...texts: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const t of texts) for (const m of (t ?? '').match(YT) ?? []) out.add(m.replace(/[.,;:!?]+$/, '').replace(/^http:/, 'https:'));
  return [...out];
}

// Real pixel sizes of legacy (R2) images, which carry no metadata. Cached on disk
// between builds so a rebuild does not re-probe hundreds of URLs.
const PROBE_CACHE = path.join(process.cwd(), '.cache', 'probe-sizes.json');
let probeCache: Record<string, [number, number] | null> | null = null;
async function sizeOf(url: string): Promise<{ w: number; h: number } | null> {
  if (!probeCache) {
    try { probeCache = JSON.parse(fs.readFileSync(PROBE_CACHE, 'utf8')); } catch { probeCache = {}; }
  }
  if (url in probeCache!) { const v = probeCache![url]; return v ? { w: v[0], h: v[1] } : null; }
  const s = await probeImageSize(url);
  probeCache![url] = s ? [s.w, s.h] : null;
  return s;
}
function saveProbeCache() {
  try { fs.mkdirSync(path.dirname(PROBE_CACHE), { recursive: true }); fs.writeFileSync(PROBE_CACHE, JSON.stringify(probeCache ?? {})); } catch { /* best effort */ }
}
async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); }));
}

// ─── the query ─────────────────────────────────────────────────────────────

const IMG = `"url": asset->url, "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height, hotspot, "credit": photographerName, caption, alt`;

const QUERY = `{
  "artists": *[_type == "artist" && !(_id in path("drafts.**"))]{
    _id, active, originCity, "slug": slug.current, name, "aliases": aliases[].alias, alternateNames, pronouns, birthYear, deathYear,
    nationalities, basedIn, disciplines, disciplinesNeedReview, sortName, role, isAfarmResident, residencyStartDate,
    bio, vnBio, instagram, links, portraitSource, _updatedAt,
    "portrait": portrait{ ${IMG} },
    "uploads": uploadedImages[]{ ${IMG} },
    legacyImageUrls,
    "memberOf": memberOf[]{ role, since, "c": collective->{_id, name, "slug": slug.current, active} },
    "roster": *[_type == "artist" && active == true && count(memberOf[collective._ref == ^.^._id]) > 0]{_id, name, "slug": slug.current, "m": memberOf[collective._ref == ^.^._id][0]{role, since}},
  },
  "events": *[_type == "event" && active == true && !(_id in path("drafts.**"))]{
    _id, "slug": slug.current, title, vnTitle, dateISO, endDateISO, displayDate, category, location,
    "venue": venue->{name, address, city, country, mapUrl},
    "otherVenues": otherVenues[]->{name, address, city, country, mapUrl},
    whereLabel, "pastVenues": pastVenues[]{ from, to, "venue": venue->{name, address, city, country, mapUrl} },
    description, vnDescription, isBioPage, videoUrl, videos, bandcampAlbumId, wpLink, coverImage, _updatedAt,
    "uploads": uploadedImages[]{ _key, isPoster, "fn": asset->originalFilename, ${IMG} },
    legacyImageUrls,
    "credits": credits[]{ role, "p": person->{_id, name, "slug": slug.current, active} },
    "artistRefs": artists[]->{_id, name, "slug": slug.current, active},
    "partners": partners[]->{name, url, role},
  },
}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function toImg(i: Raw, extra: Partial<Img> = {}): Img | null {
  if (!i?.url) return null;
  return {
    url: i.url, w: i.w ?? undefined, h: i.h ?? undefined,
    fx: i.hotspot?.x, fy: i.hotspot?.y,
    credit: (i.credit ?? '').trim() || null,
    caption: (i.caption ?? '').trim() || null,
    alt: (i.alt ?? '').trim() || null,
    ...extra,
  };
}

const personRef = (p: Raw): PersonRef | null =>
  p?._id && p.name && !isExcludedPerson(p.name) ? { _id: p._id, name: p.name, slug: p.slug ?? null, linked: p.active !== false && !!p.slug } : null;

// events-data.json images per slug (legacy R2), the same merge toSanityEvent uses
const jsonEvents = getAllEventsFromJson();
const jsonImagesBySlug = new Map(jsonEvents.map(e => [e.slug, (e.images ?? []).filter(u => !isJunkImage(u))]));

// ─── build ─────────────────────────────────────────────────────────────────

let memo: Promise<Catalogue> | null = null;
export function getCatalogue(): Promise<Catalogue> {
  memo ??= build();
  return memo;
}

async function build(): Promise<Catalogue> {
  const [raw, worksRaw, motsound] = await Promise.all([
    buildClient.fetch(QUERY) as Promise<{ artists: Raw[]; events: Raw[] }>,
    getAllProfileWorks(),
    getMotsoundPerformerEditions(),
  ]);

  // ── events ──
  const events: CEvent[] = [];
  const seen = new Set<string>();
  for (const e of raw.events) {
    if (!e.slug || seen.has(e.slug)) continue;
    seen.add(e.slug);
    const ups: Img[] = [];
    for (const u of e.uploads ?? []) {
      if (isLogoName(u.fn)) continue;
      const img = toImg(u, { poster: !!u.isPoster || POSTER_NAME.test(u.fn ?? '') });
      if (img) { (img as Img & { key?: string }).key = u._key; ups.push(img); }
    }
    const legacyUrls = [...(e.legacyImageUrls ?? []), ...(jsonImagesBySlug.get(e.slug) ?? [])]
      .filter((u: string) => u && !MISFILED.has(u) && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u) && !isJunkImage(u) && !isLogoName(u.split('/').pop()));
    const seenUrl = new Set(ups.map(i => i.url)), seenFile = new Set<string>();
    const legacy: Img[] = [];
    for (const u of legacyUrls) {
      const fn = u.split('/').pop()!;
      if (seenUrl.has(u) || seenFile.has(fn)) continue;
      seenUrl.add(u); seenFile.add(fn);
      legacy.push({ url: u, poster: POSTER_NAME.test(fn) });
    }
    let images = [...ups, ...legacy];
    // cover: the editor's choice, else the first documentation photo, else a poster
    const chosen = e.coverImage ? images.find(i => (i as Img & { key?: string }).key === e.coverImage || i.url === e.coverImage) : undefined;
    const cover = chosen ?? images.find(i => !i.poster) ?? images[0] ?? null;
    if (cover) images = [cover, ...images.filter(i => i !== cover)];
    // documentation first, posters after (still in the gallery, never the hero)
    images = [...images.filter(i => !i.poster || i === cover), ...images.filter(i => i.poster && i !== cover)];
    const credits: Credit[] = [];
    const seenP = new Set<string>();
    for (const c of e.credits ?? []) { const p = personRef(c.p); if (p && !seenP.has(p._id + c.role)) { seenP.add(p._id + c.role); credits.push({ role: c.role || 'artist', person: p }); } }
    for (const a of e.artistRefs ?? []) { const p = personRef(a); if (p && !credits.some(c => c.person._id === p._id)) credits.push({ role: 'artist', person: p }); }
    const dateISO = e.dateISO ?? '';
    events.push({
      _id: e._id, slug: e.slug, title: e.title ?? '', vnTitle: e.vnTitle ?? null,
      dateISO, endDateISO: e.endDateISO ?? null, displayDate: e.displayDate ?? '',
      year: +(dateISO.slice(0, 4)) || 0,
      category: e.category === '+a.farm' ? '+a.Farm' : (e.category ?? ''),
      location: e.location ?? '', venue: e.venue?.name ? e.venue : null,
      venues: [e.venue, ...(e.otherVenues ?? [])].filter((v: Venue | null): v is Venue => !!v?.name),
      whereLabel: e.whereLabel?.trim() || null,
      pastVenues: (e.pastVenues ?? []).filter((p: { venue?: Venue | null }) => !!p?.venue?.name).map((p: { venue: Venue; from?: number | null; to?: number | null }) => ({ venue: p.venue, from: p.from ?? null, to: p.to ?? null })),
      description: e.description ?? '', vnDescription: e.vnDescription ?? '',
      images, cover, coverIsPoster: !!cover?.poster,
      videos: [...new Set([...(e.videos ?? []), ...(e.videoUrl ? [e.videoUrl] : []), ...videoLinks(e.description, e.vnDescription)])],
      bandcampAlbumId: e.bandcampAlbumId ?? null,
      wpLink: e.wpLink || null,
      credits, partners: (e.partners ?? []).filter(Boolean),
      isBioPage: !!e.isBioPage, listed: false, updatedAt: e._updatedAt ?? '',
    });
  }
  // JSON-only events (not yet in Sanity): kept so nothing that exists today disappears
  for (const j of jsonEvents) {
    if (!j.slug || seen.has(j.slug)) continue;
    seen.add(j.slug);
    const images: Img[] = (jsonImagesBySlug.get(j.slug) ?? []).filter(u => !MISFILED.has(u) && !isLogoName(u.split('/').pop())).map(u => ({ url: u, poster: POSTER_NAME.test(u) }));
    const cover = images.find(i => !i.poster) ?? images[0] ?? null;
    events.push({
      _id: 'json:' + j.slug, slug: j.slug, title: j.title, vnTitle: j.vnTitle ?? null, dateISO: j.dateISO, endDateISO: j.endDateISO ?? null,
      displayDate: j.displayDate, year: +(j.dateISO ?? '').slice(0, 4) || 0, category: j.category, location: j.location, venue: null, venues: [], whereLabel: null, pastVenues: [],
      description: j.description ?? '', vnDescription: j.vnDescription ?? '', images: cover ? [cover, ...images.filter(i => i !== cover)] : images,
      cover, coverIsPoster: !!cover?.poster, videos: videoLinks(j.videoUrl, j.description), bandcampAlbumId: j.bandcampAlbumId ?? null, wpLink: j.wpLink || null,
      credits: [], partners: [], isBioPage: !!j.isBioPage, listed: false, updatedAt: '',
    });
  }
  for (const e of events) {
    e.listed = !BIO_SLUGS.has(e.slug) && !HIDDEN_SLUGS.has(e.slug) && !e.slug.endsWith('-vn') && !e.isBioPage;
  }
  // legacy covers: real pixel sizes so nothing is ever drawn bigger than it is (S4)
  const needSize = events.filter(e => e.cover && !e.cover.w).map(e => e.cover!);
  await pool(needSize, 12, async img => { const s = await sizeOf(img.url); if (s) { img.w = s.w; img.h = s.h; } });

  events.sort((a, b) => b.dateISO.localeCompare(a.dateISO) || a.title.localeCompare(b.title));
  const listed = events.filter(e => e.listed);
  const eventsBySlug = new Map(events.map(e => [e.slug, e]));

  // ── works ──
  const works: Work[] = (worksRaw as Raw[]).map((r, i) => normalizeWork(r, i)).filter((w): w is Work => !!w);

  // ── people ──
  const jsonBySlug = new Map(artistsFromData.map(a => [a.slug, a]));
  const people: Person[] = [];
  const add = (p: Person) => { if (!people.some(x => x.slug === p.slug)) people.push(p); };
  // Active records first. A page that exists from artists-data.json / BIO_SLUGS reads the
  // Sanity record for its slug even when that record is inactive (as getArtistBySlug did).
  const pageSlugs = new Set(getArtistSlugs());
  const ordered = [...raw.artists.filter((a: Raw) => a.active === true), ...raw.artists.filter((a: Raw) => a.active !== true && pageSlugs.has(a.slug))];
  for (const a of ordered) {
    if (!a.slug || isExcludedPerson(a.name ?? '') || CONSOLIDATED_BIO_SLUGS.has(a.slug) || people.some(x => x.slug === a.slug)) continue;
    const json = jsonBySlug.get(a.slug);
    const portrait = toImg(a.portrait) ?? (json?.photo ? { url: json.photo } : null);
    const photos: Img[] = [
      ...(a.uploads ?? []).map((u: Raw) => toImg(u)).filter(Boolean) as Img[],
      ...((a.legacyImageUrls ?? []) as string[]).filter(u => !isJunkImage(u)).map(u => ({ url: u })),
    ];
    const bioText = plain(a.bio).trim();
    const reviewed = !a.disciplinesNeedReview;
    add({
      _id: a._id, slug: a.slug, name: a.name ?? a.slug,
      aliases: [...new Set([...(a.aliases ?? []), ...(a.alternateNames ?? [])].filter(Boolean))],
      sortName: a.sortName || guessSortName(a.name ?? a.slug), sortKey: '', letter: '',
      portrait, portraitSource: a.portraitSource ?? null,
      // A4 rule 4: a profile with a Sanity record shows its Sanity bio only. No JSON or
      // event-text fallback, so text blanked as wrong can never come back through one.
      bio: Array.isArray(a.bio) && bioText ? a.bio : bioText,
      hasBio: !!bioText,
      vnBio: a.vnBio ?? '',
      pronouns: a.pronouns ?? null, birthYear: a.birthYear ?? null, deathYear: a.deathYear ?? null,
      nationalities: a.nationalities ?? [], originCity: a.originCity ?? null, basedIn: a.basedIn?.city || a.basedIn?.country ? a.basedIn : null,
      disciplines: reviewed ? (a.disciplines ?? []).filter((d: string) => d in DISCIPLINE_LABELS) : [],
      role: a.role ?? null,
      links: (a.links ?? []).filter((l: Raw) => l?.url),
      instagram: a.instagram ?? null,
      photos,
      collectives: (a.memberOf ?? []).map((m: Raw) => { const r = personRef(m.c); return r?.linked ? { ...r, role: m.role ?? null, since: m.since ?? null } : null; }).filter(Boolean),
      roster: (a.roster ?? []).map((r: Raw) => { const x = personRef({ ...r, active: true }); return x ? { ...x, role: r.m?.role ?? null, since: r.m?.since ?? null } : null; }).filter(Boolean),
      eventSlugs: [], roles: [], programs: [], sinceYear: null, lastDate: null,
      isResident: !!a.residencyStartDate || !!a.isAfarmResident || !!json?.resident,
      isLena: a.slug === 'lena-bui',
      updatedAt: a._updatedAt ?? '',
    });
  }
  // artists-data.json people with no Sanity doc, and BIO_SLUGS stubs: their pages exist today
  for (const slug of getArtistSlugs()) {
    if (people.some(p => p.slug === slug) || CONSOLIDATED_BIO_SLUGS.has(slug)) continue;
    const j = jsonBySlug.get(slug);
    const name = j?.name ?? slug.replace(/-/g, ' ');
    if (isExcludedPerson(name)) continue;
    add({
      _id: null, slug, name, aliases: [], sortName: guessSortName(name), sortKey: '', letter: '',
      portrait: j?.photo ? { url: j.photo } : null, bio: j?.bio ?? '', hasBio: !!j?.bio, vnBio: '',
      nationalities: [], basedIn: null, disciplines: [], links: j?.website ? [{ label: 'website', url: j.website }] : [],
      photos: (j?.workImages ?? []).map(u => ({ url: u })), collectives: [], roster: [],
      eventSlugs: [], roles: [], programs: [], sinceYear: null, lastDate: null,
      isResident: !!j?.resident, isLena: false, updatedAt: '',
    });
  }
  const peopleById = new Map(people.filter(p => p._id).map(p => [p._id!, p]));
  const peopleBySlug = new Map(people.map(p => [p.slug, p]));
  // a credit links only where a profile page is actually built (same rule as before)
  for (const e of events) for (const c of e.credits) c.person.linked = !!c.person.slug && peopleBySlug.has(c.person.slug);

  // derived: events, roles, programs, years
  for (const e of events) {
    for (const c of e.credits) {
      const p = peopleById.get(c.person._id);
      if (!p) continue;
      if (e.listed && !p.eventSlugs.includes(e.slug)) p.eventSlugs.push(e.slug);
      if (e.listed || e.isBioPage) {
        const y = e.year || null;
        if (y && (!p.sinceYear || y < p.sinceYear)) p.sinceYear = y;
        if (e.listed && (!p.lastDate || e.dateISO > p.lastDate)) p.lastDate = e.dateISO;
      }
      if (e.listed && c.role && !p.roles.includes(c.role)) p.roles.push(c.role);
      if (/motsound/i.test(e.category)) addProgram(p, 'MoTsound');
      if (/\+1 performance/i.test(e.category)) addProgram(p, 'performance plus');
      if (/a\.farm/i.test(e.category) && e.isBioPage) addProgram(p, 'a.Farm');
    }
  }
  const worksByPerson = new Map<string, Work[]>();
  for (const w of works) {
    const slugs = new Set<string>([...(w.artists ?? []).map(a => a.slug).filter(Boolean) as string[], ...(w.artistSlug ? [w.artistSlug] : [])]);
    for (const s of slugs) { const arr = worksByPerson.get(s) ?? []; arr.push(w); worksByPerson.set(s, arr); }
  }
  for (const p of people) {
    const json = jsonBySlug.get(p.slug);
    const b = computeBadges({ slug: p.slug, role: p.role ?? (json?.curator ? 'curator' : null), hasResidency: p.isResident, isPerformancePlus: !!json?.performancePlus, motsoundEditions: motsound[p.slug] });
    if (b.filters.includes('a.Farm') || b.filters.includes('hosting artist')) addProgram(p, 'a.Farm');
    if (b.filters.includes('MoTsound')) addProgram(p, 'MoTsound');
    if (b.filters.includes('+1 performance')) addProgram(p, 'performance plus');
    if (b.filters.includes('+1 museum')) addProgram(p, '+1 museum');
    if ((worksByPerson.get(p.slug) ?? []).length) addProgram(p, '+1 trash');
    const r = (p.role ?? '').toLowerCase();
    for (const k of ['researcher', 'critic', 'curator', 'writer']) if (r.includes(k) && !p.roles.includes(k)) p.roles.push(k);
    if (!p.roles.length && p.eventSlugs.length) p.roles.push('artist');
    if (p.isResident && !p.sinceYear) p.sinceYear = null;
    p.sortKey = `${sortKey(p.sortName)} ${sortKey(p.name)}`;
    p.letter = letterOf(p.sortName);
    p.eventSlugs.sort((a, b) => (eventsBySlug.get(b)!.dateISO).localeCompare(eventsBySlug.get(a)!.dateISO));
  }
  people.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // tiles (P1)
  const tiles = new Map<string, Tile>();
  for (const p of people) {
    if (p.isLena) { tiles.set(p.slug, null); continue; }
    if (p.portrait?.url) { tiles.set(p.slug, { img: p.portrait, from: 'portrait' }); continue; }
    let pick: Img | null = null;
    for (const e of events) {
      if (!e.credits.some(c => c.person._id === p._id)) continue;
      const people_ = new Set(e.credits.map(c => c.person._id));
      if (people_.size > 2) continue;
      const img = e.images.find(i => !i.poster && i.url.startsWith('https://cdn.sanity.io/')) ?? e.images.find(i => !i.poster);
      if (img) { pick = img; break; }
    }
    if (pick) { tiles.set(p.slug, { img: pick, from: 'event' }); continue; }
    const w = (worksByPerson.get(p.slug) ?? []).find(w => w.images[0]);
    tiles.set(p.slug, w ? { img: { url: w.images[0].url, w: w.images[0].w, h: w.images[0].h }, from: 'work' } : null);
  }
  const tileNeedSize = [...tiles.values()].filter((t): t is NonNullable<Tile> => !!t && !t.img.w).map(t => t.img);
  await pool(tileNeedSize, 12, async img => { const s = await sizeOf(img.url); if (s) { img.w = s.w; img.h = s.h; } });
  saveProbeCache();

  return { people, peopleBySlug, peopleById, events, listed, eventsBySlug, works, worksByPerson, tiles };
}

function addProgram(p: Person, prog: string) { if (!p.programs.includes(prog)) p.programs.push(prog); }

/** Plain text of a bio (portable text or string). */
export const bioText = plain;
