'use client';
// deploy-cache-bust: 2026-08-01

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { sanityClient, TRASH_ITEM_PRICED } from '@/lib/sanity';
import { DEMO_LOCATIONS } from '@/lib/demoLocations';
import { MUSEUM_TO_TRASH, TRASH_SOLD } from '@/lib/demoTrashItems';
import LocationDetails from '@/components/museum/LocationDetails';
import type { MuseumLocation, AccessType } from '@/lib/museumTypes';
import { HCMC_CENTER, MAP_DEFAULT_ZOOM, getStaticMapUrl } from '@/lib/mapConstants';
import { compareNames } from '@/lib/sortName';

// chunk-rehash nudge (Workers Assets large-file 404 workaround, 2026-06-15)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const STATIC_MAP_URL = getStaticMapUrl(MAPBOX_TOKEN);
// Below this many locations the page is in its "few works" state: the
// collection grid sits open instead of collapsed, and the "latest additions"
// rail (redundant with a small grid) stays hidden. At 0 the map carries the
// concept on its own — see the empty-state overlay below.
const RAILS_MIN = 12;
// The map switches from demo to real data only at this many published, coordinate-valid
// locations — publishing one draft must not silently un-demo the flagship page. Raise/lower
// deliberately (raised 3 -> 5 in 8d994e1: a 3-4 entry partial publish still looked emptier
// than the demo it replaced).
const REAL_DATA_MIN_LOCATIONS = 5;

/** The intro overlay is dismissible for the current browser session only.
 *  sessionStorage rather than localStorage is deliberate: closing it should stop
 *  it reappearing on every navigation within a visit, without hiding the concept
 *  from someone who comes back another day. */
const INTRO_DISMISSED_KEY = 'motplus.museum.introDismissed';

/** Storage access is wrapped because it throws outright in private/sandboxed
 *  contexts; there the control still works, it just does not persist. */
function readIntroDismissed(): boolean {
  try {
    return typeof window !== 'undefined' &&
      window.sessionStorage.getItem(INTRO_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeIntroDismissed(dismissed: boolean): void {
  try {
    if (dismissed) window.sessionStorage.setItem(INTRO_DISMISSED_KEY, '1');
    else window.sessionStorage.removeItem(INTRO_DISMISSED_KEY);
  } catch {
    // storage unavailable — dismissal holds for this page view only
  }
}

/** The access-type legend follows the same session-scoped pattern as the intro
 *  overlay, under its own key so the two collapse independently. Unlike the
 *  intro (open by default, dismissible), the legend defaults to collapsed —
 *  it's reference material, not something a first-time visitor needs open in
 *  front of the map. */
const LEGEND_OPEN_KEY = 'motplus.museum.legendOpen';

function readLegendOpen(): boolean {
  try {
    return typeof window !== 'undefined' &&
      window.sessionStorage.getItem(LEGEND_OPEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeLegendOpen(open: boolean): void {
  try {
    if (open) window.sessionStorage.setItem(LEGEND_OPEN_KEY, '1');
    else window.sessionStorage.removeItem(LEGEND_OPEN_KEY);
  } catch {
    // storage unavailable — state holds for this page view only
  }
}

/** Query the user's motion preference at interaction time (not module load) so
 *  OS-level changes are respected without a reload. */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Animation duration helper — collapses to 0 under prefers-reduced-motion so
 *  map easing/flying happens instantly instead of animating. */
function dur(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}

const ACCESS_LABELS: Record<AccessType, string> = {
  open: 'open access',
  appointment: 'by appointment',
  phone: 'phone required',
  introduction: 'introduction needed',
  hours: 'specific hours',
  other: 'see details',
};

const ACCESS_COLORS: Record<AccessType, string> = {
  open: '#4a9e6b',
  appointment: '#c8963e',
  phone: '#4a7ab5',
  introduction: '#8a6bb5',
  hours: '#b56b4a',
  other: '#c47a5a',
};
const PAST_COLOR = '#999999';

export default function MuseumMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerDotsRef = useRef<Map<string, HTMLElement>>(new Map());
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const mapLoaded = useRef(false);

  const [locations, setLocations] = useState<MuseumLocation[]>([]);
  const [selected, setSelected] = useState<MuseumLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapVisualReady, setMapVisualReady] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  // Read at first render rather than in an effect: this component is client-only
  // (ssr: false in MuseumMapWrapper), so there is no server HTML to mismatch and
  // an already-dismissed intro never flashes in before being hidden.
  const [introDismissed, setIntroDismissed] = useState(readIntroDismissed);
  // Read at first render for the same reason as introDismissed above.
  const [legendOpen, setLegendOpen] = useState(readLegendOpen);
  const [artistFilter, setArtistFilter] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<MuseumLocation | null>(null);
  const [lightboxList, setLightboxList] = useState<MuseumLocation[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [viewAllFilter, setViewAllFilter] = useState<'current' | 'past'>('current');
  const [mapFilter, setMapFilter] = useState<'current' | 'all'>('current');
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef<number | null>(null);
  // Image viewer for the detail panel (per-work image navigation)
  const [imgViewerOpen, setImgViewerOpen] = useState(false);
  const [imgViewerIndex, setImgViewerIndex] = useState(0);
  const imgTouchStartX = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // manifestoOpen removed — the concept text and manifesto are server-rendered
  // by app/museum/page.tsx now, so they paint before this chunk even loads.
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const isMapFullscreen = isFullscreen || pseudoFullscreen;
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [expandedImgIndex, setExpandedImgIndex] = useState(0);
  const expandedTouchStartX = useRef<number | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const dismissIntro = useCallback((dismissed: boolean) => {
    setIntroDismissed(dismissed);
    writeIntroDismissed(dismissed);
  }, []);

  const toggleLegend = useCallback((open: boolean) => {
    setLegendOpen(open);
    writeLegendOpen(open);
  }, []);

  // Open lightbox with a list for prev/next navigation
  const openLightbox = useCallback((loc: MuseumLocation, list: MuseumLocation[]) => {
    const idx = list.findIndex(l => l._id === loc._id);
    setLightboxList(list);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightbox(loc);
  }, []);

  const lightboxNav = useCallback((dir: 1 | -1) => {
    setLightboxIndex(prev => {
      const next = (prev + dir + lightboxList.length) % lightboxList.length;
      setLightbox(lightboxList[next]);
      return next;
    });
  }, [lightboxList]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') lightboxNav(1);
      else if (e.key === 'ArrowLeft') lightboxNav(-1);
      else if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, lightboxNav]);

  // Derived data
  const filteredLocations = artistFilter
    ? locations.filter(l => l.artist === artistFilter)
    : locations;
  // Locations shown as pins on the map (respects mapFilter toggle)
  const mapLocations = filteredLocations.filter(l => mapFilter === 'current' ? !l.isPast : true);
  const artists = [...new Set(locations.map(l => l.artist))].sort(compareNames);
  // Demo entries curate the two gallery rails via sentinel dateAdded values; real
  // Sanity docs have no dateAdded field at all, so with real data "latest additions"
  // only earns its place once the collection is large enough that a small always-open
  // grid can't carry it, and "featured works" appears whenever an editor has marked
  // something featured, at any size.
  const latestAdditions = isDemo
    ? locations.filter(l => l.dateAdded === 'September 21, 1820')
    : locations.length >= RAILS_MIN
      ? [...locations].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 12)
      : [];
  const featuredWorks = (isDemo
    ? locations.filter(l => l.dateAdded === 'September 22, 1820')
    : locations.filter(l => l.featured === true)
  ).slice(0, 25);
  const hasPast = locations.some(l => l.isPast);

  // Fetch the collection from Sanity, falling back to the demo below the
  // threshold. Either set then flows through the same one continuous system
  // across 0, few, and many locations — the demo's 118 entries simply land in
  // the "many" presentation, so demo mode is not a separate layout.
  useEffect(() => {
    const apply = (next: MuseumLocation[], demo: boolean) => {
      setLocations(next);
      setIsDemo(demo);
      // few-works state: the collection grid starts open instead of collapsed
      setViewAllOpen(next.length > 0 && next.length < RAILS_MIN);
    };
    sanityClient.fetch(`
      *[_type == "museumLocation" && active == true] {
        _id, title, vnTitle, artist,
        "artistSlug": artistRef->slug.current,
        medium, year, description, vnDescription,
        featured, "createdAt": _createdAt,
        accessType, accessDetails, hours, contactMethod,
        hostName, neighbourhood, isPast,
        "coordinates": location,
        "mainImage": mainImage.asset->url,
        "images": images[].asset->url,
        "trashItemId": *[_type == "trashItem" && references(^._id) && active == true
          && ${TRASH_ITEM_PRICED}
          && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])][0]._id,
        "trashItemSold": *[_type == "trashItem" && references(^._id) && active == true
          && ${TRASH_ITEM_PRICED}
          && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])][0].sold,
      }
    `).then((data: MuseumLocation[]) => {
      // Only use Sanity data if we have enough locations with valid coordinates
      const validData = data?.filter(d => d.coordinates?.lat && d.coordinates?.lng) ?? [];
      if (validData.length >= REAL_DATA_MIN_LOCATIONS) {
        apply(validData, false);
      } else {
        if (validData.length > 0) {
          console.info(`+1 museum: ${validData.length} real location(s) published — demo remains until ${REAL_DATA_MIN_LOCATIONS} (REAL_DATA_MIN_LOCATIONS in MuseumMap.tsx)`);
        }
        apply(DEMO_LOCATIONS, true);
      }
      setLoading(false);
    }).catch(() => {
      apply(DEMO_LOCATIONS, true);
      setLoading(false);
    });
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    // Fail visibly, not silently: an empty token (build produced without --webpack
    // so NEXT_PUBLIC_MAPBOX_TOKEN wasn't inlined) or a browser without WebGL would
    // otherwise leave a bare gray container. Surface the "map unavailable" fallback.
    // mapboxgl.supported() exists at runtime in v3 but was dropped from the public
    // types, so call it defensively and treat its absence as "assume supported".
    const mbx = mapboxgl as typeof mapboxgl & { supported?: () => boolean };
    if (!MAPBOX_TOKEN || mbx.supported?.() === false) { setMapError(true); return; }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/light-v11',
      center: HCMC_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
    });

    mapRef.current = map;

    map.on('load', () => { mapLoaded.current = true; setMapVisualReady(true); });
    map.on('error', () => { if (!mapLoaded.current) setMapError(true); });

    // Add user location control (shows dot on map, works on mobile with GPS)
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update markers
  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;
    const map = mapRef.current;

    const addMarkers = () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      markerDotsRef.current.clear();

      mapLocations.forEach((loc) => {
        if (!loc.coordinates?.lng || !loc.coordinates?.lat) return;
        const color = loc.isPast ? PAST_COLOR : (ACCESS_COLORS[loc.accessType] || '#888888');

        // Wrapper: Mapbox sets translate3d on this element for positioning.
        // Never apply transform to the wrapper — scale a child dot instead.
        const el = document.createElement('div');
        el.style.cssText = `width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;`;

        const dot = document.createElement('div');
        dot.style.cssText = `
          width: 13px; height: 13px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: ${prefersReducedMotion() ? 'none' : 'transform 0.15s, border-color 0.15s'};
        `;
        el.appendChild(dot);
        markerDotsRef.current.set(loc._id, dot);

        el.addEventListener('mouseenter', () => {
          if (!dot.classList.contains('pin-selected')) dot.style.transform = 'scale(1.5)';
        });
        el.addEventListener('mouseleave', () => {
          if (!dot.classList.contains('pin-selected')) dot.style.transform = 'scale(1)';
        });

        const selectLoc = () => {
          setSelected(loc);
          map.easeTo({ center: [loc.coordinates.lng, loc.coordinates.lat], duration: dur(400) });
        };
        el.addEventListener('click', selectLoc);
        // On mobile, touchend fires before Mapbox can intercept the gesture
        el.addEventListener('touchend', (e) => {
          e.stopPropagation();
          selectLoc();
        }, { passive: false });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([loc.coordinates.lng, loc.coordinates.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });

      // Fit map to show all markers; a single work gets a gentle center instead
      const withCoords = mapLocations.filter(l => l.coordinates?.lng && l.coordinates?.lat);
      if (withCoords.length > 1) {
        const lngs = withCoords.map(l => l.coordinates.lng);
        const lats = withCoords.map(l => l.coordinates.lat);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 60, maxZoom: 14, duration: 0 }
        );
      } else if (withCoords.length === 1) {
        map.easeTo({
          center: [withCoords[0].coordinates.lng, withCoords[0].coordinates.lat],
          zoom: 13,
          duration: 0,
        });
      }
    };

    if (map.loaded()) {
      map.resize(); // re-sync canvas size with actual DOM dimensions
      addMarkers();
    } else {
      map.once('load', () => {
        map.resize();
        addMarkers();
      });
    }
  }, [locations, artistFilter, mapFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize map when mobile state toggles (container height changes 65vh ↔ 80vh)
  useEffect(() => {
    if (mapRef.current) mapRef.current.resize();
  }, [isMobile]);

  // Pulse + scale the selected pin
  useEffect(() => {
    markerDotsRef.current.forEach((dot) => {
      dot.classList.remove('pin-selected');
      dot.style.transform = 'scale(1)';
      dot.style.borderColor = 'white';
    });
    if (selected) {
      const dot = markerDotsRef.current.get(selected._id);
      if (dot) {
        dot.classList.add('pin-selected');
        dot.style.transform = 'scale(1.7)';
        dot.style.borderColor = '#111';
      }
    }
  }, [selected]);

  const flyToLocation = useCallback((loc: MuseumLocation) => {
    setLightbox(null);
    setImgViewerOpen(false);
    setArtistFilter(null);
    if (loc.isPast) setMapFilter('all');
    setSelected(loc);
    if (mapRef.current && loc.coordinates) {
      mapSectionRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
      const map = mapRef.current;
      const ease = () => map.easeTo({
        center: [loc.coordinates.lng, loc.coordinates.lat],
        zoom: 15,
        duration: dur(700),
      });
      if (map.isStyleLoaded()) {
        ease();
      } else {
        map.once('style.load', ease);
      }
    }
  }, []);

  // Handle ?work=[id] URL param — auto-fly to location on load
  useEffect(() => {
    if (locations.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const workId = params.get('work');
    if (workId) {
      const loc = locations.find(l => l._id === workId);
      if (loc) flyToLocation(loc);
    }
  }, [locations, flyToLocation]);

  const toggleFullscreen = useCallback(async () => {
    const el = mapSectionRef.current;
    if (!el) return;
    if (pseudoFullscreen) {
      setPseudoFullscreen(false);
      return;
    }
    if (document.fullscreenEnabled) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen().catch(() => setPseudoFullscreen(true));
      }
    } else {
      // iOS Safari: no fullscreen API — use fixed-position overlay
      setPseudoFullscreen(true);
    }
  }, [pseudoFullscreen]);

  // Sync native fullscreen state and resize map after transition
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapRef.current?.resize(), 150);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Pseudo-fullscreen (iOS): lock scroll, handle Escape, resize map
  useEffect(() => {
    setTimeout(() => mapRef.current?.resize(), 150);
    if (!pseudoFullscreen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPseudoFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [pseudoFullscreen]);

  // Close expanded view when selection changes
  useEffect(() => { if (!selected) setExpandedOpen(false); }, [selected]);

  // Expanded view: scroll lock + Escape
  useEffect(() => {
    if (!expandedOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [expandedOpen]);

  const selectArtist = (artist: string | null) => {
    setArtistFilter(artist);
    setSelected(null);
    if (!artist) setFilterOpen(false);
    if (artist && mapRef.current) {
      const loc = locations.find(l => l.artist === artist);
      if (loc?.coordinates) {
        mapRef.current.easeTo({
          center: [loc.coordinates.lng, loc.coordinates.lat],
          zoom: 13.5,
          duration: dur(500),
        });
      }
    }
  };

  return (
    <div>
      <style>{`
        /* Grayscale the map canvas directly.
           Never apply filter to .mapboxgl-canvas-container or any ancestor —
           a CSS filter on a parent wraps the WebGL canvas in a compositing layer
           which blanks the WebGL output in Chrome, Firefox, and Safari.
           Filtering the canvas element itself is a safe post-process step. */
        .mapboxgl-canvas { filter: grayscale(1); }
        @keyframes pin-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.25); }
          60%  { box-shadow: 0 0 0 9px rgba(0,0,0,0),    0 1px 4px rgba(0,0,0,0.25); }
          100% { box-shadow: 0 0 0 0   rgba(0,0,0,0),    0 1px 4px rgba(0,0,0,0.25); }
        }
        .pin-selected {
          animation: pin-pulse 0.7s ease-out 3;
        }
        .museum-thumb { overflow: hidden; }
        .museum-thumb img { transition: transform 0.35s ease; display: block; }
        @media (hover: hover) {
          .museum-thumb-card:hover .museum-thumb img { transform: scale(1.04); }
        }
        .museum-thumb-card:active .museum-thumb img { transform: scale(1.02); }
        @media (prefers-reduced-motion: reduce) {
          .pin-selected { animation: none; }
          .museum-thumb img { transition: none; }
          .museum-thumb-card:hover .museum-thumb img,
          .museum-thumb-card:active .museum-thumb img { transform: none; }
        }
      `}</style>

      {/* ─── MAP ─── */}

      <div ref={mapSectionRef} style={{
        borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5',
        position: pseudoFullscreen ? 'fixed' : 'relative',
        ...(pseudoFullscreen ? { inset: 0 } : {}),
        zIndex: pseudoFullscreen ? 9999 : undefined,
        width: '100%',
      }}>

        {/* tap-to-close overlay on mobile when panel is open */}
        {selected && isMobile && (
          <div
            onClick={() => setSelected(null)}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '50%', zIndex: 19,
              cursor: 'pointer',
            }}
          />
        )}

        {/* map container — keep clean, no filter, no padding */}
        <div
          ref={mapContainer}
          style={{
            width: '100%',
            height: isMapFullscreen ? '100vh' : (isMobile ? '80vh' : '65vh'),
            minHeight: isMapFullscreen ? 'unset' : (isMobile ? '500px' : '480px'),
            backgroundColor: '#f0f0f0',
          }}
        />

        {/* static map snapshot — shown instantly via CDN while the live mapbox-gl map
            (style, sprite, glyphs, tiles) finishes loading, then fades out */}
        {STATIC_MAP_URL && !mapError && (
          <img
            src={STATIC_MAP_URL}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'grayscale(1)',
              opacity: mapVisualReady ? 0 : 1,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {/* map error fallback */}
        {mapError && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#f5f5f5', textAlign: 'center', padding: '24px',
          }}>
            <p style={{ fontSize: '13px', color: '#999999', letterSpacing: '0.04em', lineHeight: 1.6 }}>
              map unavailable — view our locations at motplusplusplus.com/museum
            </p>
          </div>
        )}

        {/* loading */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: mapVisualReady ? 'transparent' : '#f5f5f5', pointerEvents: 'none',
          }}>
            <p style={{
              fontSize: '12px', color: '#aaaaaa', letterSpacing: '0.08em',
              backgroundColor: mapVisualReady ? 'rgba(255,255,255,0.85)' : 'transparent',
              padding: mapVisualReady ? '6px 14px' : 0,
            }}>+++loading+++</p>
          </div>
        )}

        {/* bottom-left corner stack — the legend and the intro/"about this map"
            control share this corner, each independently open or collapsed
            (separate sessionStorage keys, §ISSUE history: commit 545d8f9 moved
            the legend to top-right because four separately absolute-positioned
            elements could land on the exact same spot once both were at their
            smallest). One flex column instead: whichever pieces are visible
            stack directly against each other, aligned and evenly spaced, in all
            four open/collapsed combinations, at any width. The wrapper itself
            ignores pointer events so the empty space around the compact buttons
            doesn't block map dragging/clicks; each visible control re-enables
            them on itself. */}
        {!loading && (
          <div style={{
            position: 'absolute', bottom: '24px', left: '16px', right: '16px',
            maxWidth: '360px', zIndex: 6,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px',
            pointerEvents: 'none',
          }}>
            {/* legend */}
            {mapLocations.length > 0 && legendOpen && (
              <div style={{
                pointerEvents: 'auto',
                backgroundColor: 'rgba(255,255,255,0.95)',
                padding: '10px 14px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                  <p style={{ fontSize: '10px', color: '#767676', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    legend
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleLegend(false)}
                    aria-label="close legend"
                    style={{
                      background: 'none', border: 'none', padding: '0 0 0 8px', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '11px', color: '#767676',
                      letterSpacing: '0.06em', lineHeight: 1, flexShrink: 0,
                    }}
                  >
                    close
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(Object.entries(ACCESS_COLORS) as [AccessType, string][])
                    .filter(([type]) => mapLocations.some(l => l.accessType === type && !l.isPast))
                    .map(([type, color]) => (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '9px', height: '9px', borderRadius: '50%',
                          backgroundColor: color, border: '1.5px solid white',
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)', flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '10px', color: '#666666', letterSpacing: '0.06em' }}>
                          {ACCESS_LABELS[type]}
                        </span>
                      </div>
                    ))}
                  {mapFilter === 'all' && locations.some(l => l.isPast) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '9px', height: '9px', borderRadius: '50%',
                        backgroundColor: PAST_COLOR, border: '1.5px solid white',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)', flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '10px', color: '#666666', letterSpacing: '0.06em' }}>
                        past installation
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* collapsed legend control — reopens it, never a one-way door */}
            {mapLocations.length > 0 && !legendOpen && (
              <button
                type="button"
                onClick={() => toggleLegend(true)}
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: 'rgba(255,255,255,0.96)',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.14)',
                  border: 'none', padding: '10px 16px', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '11px', color: '#111111',
                  letterSpacing: '0.06em', lineHeight: 1,
                }}
              >
                legend
              </button>
            )}

            {/* intro overlay — one box, not two. it carries the concept, and in
                demo mode it also carries the placeholder disclosure that used to
                sit in a separate black banner above the map. dismissing it
                quiets the page; it never removes the per-work "demo content"
                disclaimers below, which are shown at the point someone is
                looking at a specific work. */}
            {!mapError && (isDemo || locations.length === 0) && !introDismissed && (
              <div style={{
                pointerEvents: 'auto', alignSelf: 'stretch',
                backgroundColor: 'rgba(255,255,255,0.96)',
                boxShadow: '0 1px 6px rgba(0,0,0,0.14)',
                padding: '20px 22px',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                  <p style={{ fontSize: '10px', color: '#767676', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    the museum without walls
                  </p>
                  <button
                    type="button"
                    onClick={() => dismissIntro(true)}
                    aria-label="close this introduction"
                    style={{
                      background: 'none', border: 'none', padding: '0 0 0 8px', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '11px', color: '#767676',
                      letterSpacing: '0.06em', lineHeight: 1, flexShrink: 0,
                    }}
                  >
                    close
                  </button>
                </div>
                <p style={{ fontSize: '13px', color: '#444444', lineHeight: 1.7, marginBottom: '14px' }}>
                  single works, hosted in private homes, businesses, and studios, anywhere in the world.
                  each appears on this map as it is placed, with what you need to know to see it.
                  the map is the floor plan. the city is the building.
                </p>
                {isDemo && (
                  <p style={{ fontSize: '12px', color: '#111111', lineHeight: 1.7, marginBottom: '14px' }}>
                    the +1 museum map is coming soon. the pins shown are placeholders. real
                    locations will appear here as works are placed in host spaces across the city.
                  </p>
                )}
                <Link
                  href="/museum/inquire"
                  style={{
                    display: 'inline-block',
                    fontSize: '12px', color: '#ffffff', backgroundColor: '#111111',
                    padding: '9px 18px', textDecoration: 'none', letterSpacing: '0.03em',
                  }}
                >
                  host a work
                </Link>
              </div>
            )}

            {/* closing the intro is never a one-way door: the same corner keeps
                one lowercase control that brings it back */}
            {!mapError && (isDemo || locations.length === 0) && introDismissed && (
              <button
                type="button"
                onClick={() => dismissIntro(false)}
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: 'rgba(255,255,255,0.96)',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.14)',
                  border: 'none', padding: '10px 16px', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '11px', color: '#111111',
                  letterSpacing: '0.06em', lineHeight: 1,
                }}
              >
                about this map
              </button>
            )}
          </div>
        )}

        {/* current / all map toggle — only meaningful once past installations exist */}
        {!loading && hasPast && (
          <div style={{
            position: 'absolute', bottom: '24px', right: '16px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            display: 'flex', overflow: 'hidden',
            zIndex: 5,
          }}>
            {(['current', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setMapFilter(f)}
                style={{
                  background: mapFilter === f ? '#111111' : 'none',
                  border: 'none', cursor: 'pointer',
                  padding: '7px 13px',
                  fontSize: '10px', letterSpacing: '0.06em',
                  color: mapFilter === f ? 'white' : '#888888',
                  transition: 'background 0.15s',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* fullscreen toggle */}
        {!loading && (
          <button
            onClick={toggleFullscreen}
            title={isMapFullscreen ? 'exit fullscreen' : 'fullscreen'}
            aria-label={isMapFullscreen ? 'exit fullscreen' : 'fullscreen'}
            style={{
              position: 'absolute', bottom: '62px', right: '16px',
              width: '32px', height: '32px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
              zIndex: 10,
            }}
          >
            {isMapFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 1v4H1M9 1v4h4M5 13v-4H1M9 13v-4h4"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 5V1h4M13 5V1H9M1 9v4h4M13 9v4H9"/>
              </svg>
            )}
          </button>
        )}

        {/* artist filter active indicator */}
        {artistFilter && (
          <div style={{
            position: 'absolute', top: '12px', left: '16px',
            backgroundColor: 'rgba(255,255,255,0.97)',
            border: '1px solid #dddddd',
            padding: '6px 10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: '10px',
            zIndex: 5,
          }}>
            <span style={{ fontSize: '11px', color: '#444444', letterSpacing: '0.06em' }}>
              {artistFilter}
            </span>
            <button
              onClick={() => selectArtist(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#aaaaaa', padding: '0', lineHeight: 1 }}
            >×</button>
          </div>
        )}

        {/* detail panel */}
        {selected && (
          <div style={isMobile ? {
            // Mobile: bottom sheet
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '52%',
            backgroundColor: 'white',
            boxShadow: '0 -2px 16px rgba(0,0,0,0.12)',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            zIndex: 20,
            borderRadius: '10px 10px 0 0',
          } : {
            // Desktop: right panel
            position: 'absolute', top: 0, right: 0,
            width: 'min(360px, 100%)', height: '100%',
            backgroundColor: 'white',
            boxShadow: '-2px 0 16px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            zIndex: 20,
          }}>
            {/* drag handle / close row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-end', padding: isMobile ? '10px 12px 4px' : '12px 12px 0', flexShrink: 0 }}>
              {isMobile && (
                <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: '#dddddd', position: 'absolute' }} />
              )}
              <button
                onClick={() => { setExpandedImgIndex(0); setExpandedOpen(true); }}
                title="expand"
                aria-label="expand entry"
                style={{
                  marginLeft: 'auto',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#bbbbbb', lineHeight: 1, padding: '4px 8px',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 11L2 2M6 2H2v4"/>
                </svg>
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '20px', color: '#aaaaaa', lineHeight: 1, padding: '4px',
                }}
              >×</button>
            </div>

            {/* images — click to expand, strip for multiples */}
            {(() => {
              const imgs = [selected.mainImage, ...(selected.images || [])].filter(Boolean) as string[];
              if (!imgs.length) return null;
              return (
                <div style={{ flexShrink: 0 }}>
                  {/* main image */}
                  <button
                    onClick={() => { setImgViewerIndex(0); setImgViewerOpen(true); }}
                    style={{
                      display: 'block', width: '100%', padding: 0, border: 'none',
                      backgroundColor: '#f0f0f0', cursor: 'zoom-in',
                    }}
                  >
                    <img
                      src={imgs[0]}
                      alt={selected.title}
                      style={{
                        width: '100%',
                        height: isMobile ? '130px' : '220px',
                        objectFit: 'contain',
                        display: 'block',
                        backgroundColor: '#f0f0f0',
                      }}
                    />
                  </button>
                  {/* thumbnail strip for additional images */}
                  {imgs.length > 1 && (
                    <div style={{ display: 'flex', gap: '2px', backgroundColor: '#e8e8e8' }}>
                      {imgs.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => { setImgViewerIndex(i); setImgViewerOpen(true); }}
                          style={{
                            flex: 1, padding: 0, border: 'none', cursor: 'zoom-in',
                            outline: i === 0 ? '2px solid #333' : 'none',
                            outlineOffset: '-2px',
                          }}
                        >
                          <img
                            src={src}
                            alt=""
                            style={{ width: '100%', height: '48px', objectFit: 'cover', display: 'block' }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'inline-block',
                fontSize: '9px', letterSpacing: '0.1em',
                color: ACCESS_COLORS[selected.accessType],
                border: `1px solid ${ACCESS_COLORS[selected.accessType]}`,
                padding: '2px 7px', marginBottom: '14px',
              }}>
                {ACCESS_LABELS[selected.accessType]}
              </div>

              <p style={{ fontSize: '17px', fontWeight: 300, color: '#111111', lineHeight: 1.3, marginBottom: '4px' }}>
                {selected.title}
              </p>
              <p style={{ fontSize: '13px', color: '#666666', fontWeight: 300, marginBottom: '16px' }}>
                {selected.artistSlug
                  ? <a href={`/profiles/${selected.artistSlug}`} style={{ color: '#666666', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{selected.artist}</a>
                  : selected.artist}
                {selected.year ? `, ${selected.year}` : ''}
                {selected.medium ? ` — ${selected.medium}` : ''}
              </p>

              {selected.description && (
                <p style={{ fontSize: '13px', lineHeight: 1.8, color: '#555555', marginBottom: '20px' }}>
                  {selected.description}
                </p>
              )}

              <LocationDetails location={selected} />

              {(() => {
                const trashId = selected.trashItemId || MUSEUM_TO_TRASH[selected._id];
                if (!trashId) return null;
                // Real locations carry their own trashItemSold from Sanity; the
                // demo-mode fallback (MUSEUM_TO_TRASH) looks it up from TRASH_SOLD.
                const trashSold = selected.trashItemId ? selected.trashItemSold : TRASH_SOLD[trashId];
                return (
                  <a
                    href={`/trash?item=${trashId}`}
                    style={{
                      display: 'inline-block', marginTop: '16px',
                      fontSize: '12px', color: '#fff', backgroundColor: '#111',
                      padding: '8px 16px', textDecoration: 'none', letterSpacing: '0.03em',
                    }}
                  >
                    {trashSold ? 'view in +1 trash' : 'inquire through +1 trash'}
                  </a>
                );
              })()}

              {/* not dismissible, and deliberately not folded into the intro overlay:
                  the disclosure belongs at the work someone is actually looking at */}
              {selected._demo && (
                <p style={{ fontSize: '10px', color: '#cccccc', marginTop: '20px', letterSpacing: '0.06em' }}>
                  demo content, not a real work or artist
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── BROWSE DROPDOWNS ─── */}
      {!loading && locations.length > 0 && (
        <div style={{ borderTop: '1px solid #e5e5e5' }}>

          {/* the collection — open by default in the few-works state, an
              accordion once the collection is big enough to need one */}
          <div style={{ borderBottom: '1px solid #e5e5e5' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <button
                onClick={() => setViewAllOpen(!viewAllOpen)}
                aria-expanded={viewAllOpen}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '12px 24px',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#999999', textTransform: 'uppercase' }}>
                  the collection
                  <span style={{ color: '#cccccc', marginLeft: '10px', fontWeight: 300 }}>{locations.length}</span>
                </span>
                <span style={{ fontSize: '14px', color: '#bbbbbb', transform: viewAllOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</span>
              </button>
              {viewAllOpen && (
                <div style={{ padding: '0 24px 32px' }}>
                  {/* current / past filter — only once a past installation exists */}
                  {hasPast && (
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                    {(['current', 'past'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setViewAllFilter(f)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 3px',
                          fontSize: '11px', letterSpacing: '0.06em',
                          color: viewAllFilter === f ? '#111111' : '#aaaaaa',
                          borderBottom: viewAllFilter === f ? '1px solid #111111' : '1px solid transparent',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  )}
                  {/* grid */}
                  {(() => {
                    const gridItems = locations.filter(l =>
                      viewAllFilter === 'past' ? l.isPast : !l.isPast
                    );
                    if (gridItems.length === 0) return (
                      <p style={{ fontSize: '12px', color: '#cccccc', padding: '8px 0' }}>
                        no {viewAllFilter} installations
                      </p>
                    );
                    return (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '28px 16px',
                      }}>
                        {gridItems.map(loc => (
                          <button
                            key={loc._id}
                            onClick={() => openLightbox(loc, gridItems)}
                            className="museum-thumb-card"
                            style={{
                              cursor: 'pointer', background: 'none', border: 'none',
                              padding: 0, textAlign: 'left', fontFamily: 'inherit', display: 'block',
                            }}
                          >
                            <div className="museum-thumb" style={{ aspectRatio: '4/3', backgroundColor: '#f0f0f0', marginBottom: '8px' }}>
                              {loc.mainImage && (
                                <img
                                  src={loc.mainImage}
                                  alt={loc.title}
                                  loading="lazy"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#222222', fontWeight: 300, lineHeight: 1.3, marginBottom: '2px' }}>{loc.title}</p>
                            <p style={{ fontSize: '11px', color: '#999999', fontWeight: 300 }}>{loc.artist}{loc.year ? `, ${loc.year}` : ''}</p>
                            {loc.neighbourhood && <p style={{ fontSize: '10px', color: '#999999', marginTop: '2px' }}>{loc.neighbourhood}</p>}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* by artist */}
          {artists.length > 0 && (
            <div style={{ borderBottom: '1px solid #e5e5e5' }}>
              <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '12px 24px',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#999999', textTransform: 'uppercase' }}>
                    by artist
                    {artistFilter && <span style={{ color: '#333333', marginLeft: '12px' }}>— {artistFilter}</span>}
                  </span>
                  <span style={{ fontSize: '14px', color: '#bbbbbb', transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</span>
                </button>
                {filterOpen && (
                  <div style={{ paddingBottom: '32px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '2px 24px',
                      padding: '0 24px 20px',
                    }}>
                      {artistFilter && (
                        <button
                          onClick={() => selectArtist(null)}
                          style={{
                            gridColumn: '1 / -1',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '0 0 12px', fontSize: '11px', color: '#aaaaaa',
                            letterSpacing: '0.06em', textAlign: 'left',
                          }}
                        >
                          ← all artists
                        </button>
                      )}
                      {artists.map(artist => (
                        <button
                          key={artist}
                          onClick={() => selectArtist(artist)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            textAlign: 'left', padding: '6px 0',
                            fontSize: '13px', fontWeight: 300,
                            color: artistFilter === artist ? '#111111' : '#666666',
                            borderBottom: artistFilter === artist ? '1px solid #111111' : 'none',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {artist}
                        </button>
                      ))}
                    </div>
                    {artistFilter && (() => {
                      const artistWorks = locations.filter(l => l.artist === artistFilter);
                      return artistWorks.length > 0 ? (
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '24px' }}>
                          <p style={{ fontSize: '11px', color: '#cccccc', letterSpacing: '0.06em', paddingLeft: '24px', marginBottom: '16px' }}>
                            {artistWorks.length} work{artistWorks.length !== 1 ? 's' : ''} in the collection
                          </p>
                          <GalleryRow locations={artistWorks} onOpen={loc => openLightbox(loc, artistWorks)} onViewOnMap={flyToLocation} />
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── LATEST ADDITIONS ─── */}
      {!loading && latestAdditions.length > 0 && (
        <div style={{ borderTop: '1px solid #e5e5e5', padding: '48px 0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', paddingLeft: '24px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#999999', marginBottom: '24px', textTransform: 'uppercase' }}>
              latest additions
            </p>
            {isDemo && (
              <p style={{ fontSize: '11px', color: '#cccccc', marginBottom: '16px', letterSpacing: '0.04em' }}>
                September 21, 1820
              </p>
            )}
          </div>
          <GalleryRow locations={latestAdditions} onOpen={loc => openLightbox(loc, latestAdditions)} onViewOnMap={flyToLocation} />
        </div>
      )}

      {/* ─── FEATURED WORKS ─── */}
      {!loading && featuredWorks.length > 0 && (
        <div style={{ borderTop: '1px solid #e5e5e5', padding: '48px 0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', paddingLeft: '24px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#999999', marginBottom: '24px', textTransform: 'uppercase' }}>
              featured works
            </p>
          </div>
          <GalleryRow locations={featuredWorks} onOpen={loc => openLightbox(loc, featuredWorks)} onViewOnMap={flyToLocation} />
        </div>
      )}

      {/* ─── LIGHTBOX ─── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflowY: 'auto', padding: '40px 16px',
          }}
        >
          {/* prev arrow */}
          {lightboxList.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxNav(-1); }}
              style={{
                position: 'fixed', left: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                color: 'white', fontSize: '22px', padding: '12px 14px', zIndex: 1001,
                borderRadius: '2px', lineHeight: 1,
              }}
            >‹</button>
          )}
          {/* next arrow */}
          {lightboxList.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxNav(1); }}
              style={{
                position: 'fixed', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                color: 'white', fontSize: '22px', padding: '12px 14px', zIndex: 1001,
                borderRadius: '2px', lineHeight: 1,
              }}
            >›</button>
          )}

          <div
            onClick={e => e.stopPropagation()}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              if (touchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > 50) lightboxNav(dx < 0 ? 1 : -1);
              touchStartX.current = null;
            }}
            style={{
              backgroundColor: 'white',
              width: '100%', maxWidth: '680px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* counter */}
            {lightboxList.length > 1 && (
              <div style={{ padding: '10px 16px 0', fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.08em', textAlign: 'right' }}>
                {lightboxIndex + 1} / {lightboxList.length}
              </div>
            )}
            {/* close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
              <button
                onClick={() => setLightbox(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '22px', color: '#aaaaaa', lineHeight: 1, padding: '4px',
                }}
              >×</button>
            </div>

            {/* image — full width, not cropped */}
            {lightbox.mainImage && (
              <div style={{ width: '100%', backgroundColor: '#f0f0f0' }}>
                <img
                  src={lightbox.mainImage}
                  alt={lightbox.title}
                  style={{ width: '100%', display: 'block', maxHeight: '60vh', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* info — fully below image */}
            <div style={{ padding: '28px 32px 36px' }}>
              <div style={{
                display: 'inline-block',
                fontSize: '9px', letterSpacing: '0.1em',
                color: ACCESS_COLORS[lightbox.accessType],
                border: `1px solid ${ACCESS_COLORS[lightbox.accessType]}`,
                padding: '2px 7px', marginBottom: '16px',
              }}>
                {ACCESS_LABELS[lightbox.accessType]}
              </div>

              <p style={{ fontSize: '20px', fontWeight: 300, color: '#111111', lineHeight: 1.25, marginBottom: '6px' }}>
                {lightbox.title}
              </p>
              <p style={{ fontSize: '14px', color: '#777777', fontWeight: 300, marginBottom: '4px' }}>
                {lightbox.artist}
                {lightbox.year ? `, ${lightbox.year}` : ''}
              </p>
              {lightbox.medium && (
                <p style={{ fontSize: '13px', color: '#aaaaaa', fontWeight: 300, marginBottom: '20px' }}>
                  {lightbox.medium}
                </p>
              )}

              {lightbox.description && (
                <p style={{ fontSize: '14px', lineHeight: 1.85, color: '#555555', marginBottom: '24px' }}>
                  {lightbox.description}
                </p>
              )}

              <div style={{ marginBottom: '28px' }}>
                <LocationDetails location={lightbox} />
              </div>

              <button
                onClick={() => flyToLocation(lightbox)}
                style={{
                  display: 'block', width: '100%',
                  padding: '12px',
                  backgroundColor: '#111111', color: 'white',
                  border: 'none', cursor: 'pointer',
                  fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                }}
              >
                view on map
              </button>

              {(() => {
                const trashId = lightbox.trashItemId || MUSEUM_TO_TRASH[lightbox._id];
                if (!trashId) return null;
                return (
                  <a
                    href={`/trash?item=${trashId}`}
                    style={{
                      display: 'block', marginTop: '10px', textAlign: 'center',
                      fontSize: '12px', color: '#111', border: '1px solid #ddd',
                      padding: '10px 16px', textDecoration: 'none', letterSpacing: '0.03em',
                    }}
                  >
                    inquire through +1 trash
                  </a>
                );
              })()}

              {lightbox._demo && (
                <p style={{ fontSize: '10px', color: '#dddddd', marginTop: '16px', letterSpacing: '0.06em', textAlign: 'center' }}>
                  demo content, not a real work or artist
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── EXPANDED ENTRY VIEW ─── */}
      {expandedOpen && selected && (() => {
        const imgs = [selected.mainImage, ...(selected.images || [])].filter(Boolean) as string[];
        const navImg = (dir: 1 | -1) =>
          setExpandedImgIndex(i => (i + dir + imgs.length) % imgs.length);
        const trashId = selected.trashItemId || MUSEUM_TO_TRASH[selected._id];
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            backgroundColor: 'white',
            display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            overflowY: isMobile ? 'auto' : 'hidden',
          }}>
            {/* close */}
            <button
              onClick={() => setExpandedOpen(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer',
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', color: '#888',
                boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
              }}
            >×</button>

            {/* ── images (left on desktop, top on mobile) ── */}
            {imgs.length > 0 && (
              <div style={{
                width: isMobile ? '100%' : '50%',
                height: isMobile ? '45vh' : '100vh',
                backgroundColor: '#f5f5f5',
                display: 'flex', flexDirection: 'column',
                flexShrink: 0, position: isMobile ? 'relative' : 'sticky', top: 0,
              }}>
                {/* main image */}
                <div
                  style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}
                  onTouchStart={e => { expandedTouchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    if (expandedTouchStartX.current === null) return;
                    const dx = e.changedTouches[0].clientX - expandedTouchStartX.current;
                    if (Math.abs(dx) > 50) navImg(dx < 0 ? 1 : -1);
                    expandedTouchStartX.current = null;
                  }}
                >
                  <img
                    src={imgs[expandedImgIndex]}
                    alt={selected.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                  {imgs.length > 1 && (<>
                    <button
                      onClick={() => navImg(-1)}
                      style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.82)', border: 'none', cursor: 'pointer',
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', color: '#555', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                      }}
                    >‹</button>
                    <button
                      onClick={() => navImg(1)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.82)', border: 'none', cursor: 'pointer',
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', color: '#555', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                      }}
                    >›</button>
                    <div style={{
                      position: 'absolute', bottom: '10px', right: '12px',
                      fontSize: '10px', color: '#888', letterSpacing: '0.06em',
                      backgroundColor: 'rgba(255,255,255,0.82)', padding: '2px 7px',
                    }}>
                      {expandedImgIndex + 1} / {imgs.length}
                    </div>
                  </>)}
                </div>
                {/* thumbnail strip */}
                {imgs.length > 1 && (
                  <div style={{ display: 'flex', gap: '2px', backgroundColor: '#e8e8e8', flexShrink: 0, overflowX: 'auto' }}>
                    {imgs.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setExpandedImgIndex(i)}
                        style={{
                          flexShrink: 0, padding: 0, border: 'none', cursor: 'pointer',
                          outline: i === expandedImgIndex ? '2px solid #333' : 'none',
                          outlineOffset: '-2px',
                        }}
                      >
                        <img src={src} alt="" style={{ width: '72px', height: '54px', objectFit: 'cover', display: 'block' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── text (right on desktop, below on mobile) ── */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: isMobile ? '28px 20px 64px' : '56px 52px 56px',
            }}>
              <div style={{
                display: 'inline-block', fontSize: '9px', letterSpacing: '0.1em',
                color: ACCESS_COLORS[selected.accessType],
                border: `1px solid ${ACCESS_COLORS[selected.accessType]}`,
                padding: '2px 7px', marginBottom: '20px',
              }}>
                {ACCESS_LABELS[selected.accessType]}
              </div>

              <p style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 300, color: '#111', lineHeight: 1.15, marginBottom: '10px' }}>
                {selected.title}
              </p>
              <p style={{ fontSize: '15px', color: '#666', fontWeight: 300, marginBottom: '28px', lineHeight: 1.5 }}>
                {selected.artist}
                {selected.year ? `, ${selected.year}` : ''}
                {selected.medium ? ` — ${selected.medium}` : ''}
              </p>

              {selected.description && (
                <p style={{ fontSize: '15px', lineHeight: 1.9, color: '#444', marginBottom: '36px' }}>
                  {selected.description}
                </p>
              )}

              <LocationDetails location={selected} size="large" />

              {trashId && (
                <a
                  href={`/trash?item=${trashId}`}
                  style={{
                    display: 'inline-block', marginTop: '28px',
                    fontSize: '13px', color: '#fff', backgroundColor: '#111',
                    padding: '11px 22px', textDecoration: 'none', letterSpacing: '0.03em',
                  }}
                >
                  inquire through +1 trash
                </a>
              )}

              {selected._demo && (
                <p style={{ fontSize: '10px', color: '#ccc', marginTop: '28px', letterSpacing: '0.06em' }}>
                  demo content, not a real work or artist
                </p>
              )}

            </div>
          </div>
        );
      })()}

      {/* ─── PANEL IMAGE VIEWER ─── */}
      {imgViewerOpen && selected && (() => {
        const imgs = [selected.mainImage, ...(selected.images || [])].filter(Boolean) as string[];
        const navImg = (dir: 1 | -1) =>
          setImgViewerIndex(i => (i + dir + imgs.length) % imgs.length);
        return (
          <div
            onClick={() => setImgViewerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              backgroundColor: 'rgba(0,0,0,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* close */}
            <button
              onClick={() => setImgViewerOpen(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '26px', color: 'white', lineHeight: 1, padding: '4px', zIndex: 1,
              }}
            >×</button>

            {/* counter */}
            {imgs.length > 1 && (
              <div style={{
                position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)',
                fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em',
              }}>
                {imgViewerIndex + 1} / {imgs.length}
              </div>
            )}

            {imgs.length > 1 && (
              <button onClick={e => { e.stopPropagation(); navImg(-1); }}
                style={{ position: 'absolute', left: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '24px', padding: '12px 15px', borderRadius: '2px', lineHeight: 1 }}>
                ‹
              </button>
            )}
            {imgs.length > 1 && (
              <button onClick={e => { e.stopPropagation(); navImg(1); }}
                style={{ position: 'absolute', right: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '24px', padding: '12px 15px', borderRadius: '2px', lineHeight: 1 }}>
                ›
              </button>
            )}

            <img
              src={imgs[imgViewerIndex]}
              alt={selected.title}
              onClick={e => e.stopPropagation()}
              onTouchStart={e => { imgTouchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (imgTouchStartX.current === null) return;
                const dx = e.changedTouches[0].clientX - imgTouchStartX.current;
                if (Math.abs(dx) > 50) navImg(dx < 0 ? 1 : -1);
                imgTouchStartX.current = null;
              }}
              style={{
                maxWidth: '92vw', maxHeight: '88vh',
                objectFit: 'contain', display: 'block',
                cursor: imgs.length > 1 ? 'default' : 'default',
              }}
            />
          </div>
        );
      })()}
    </div>
  );
}

// ─── Gallery Row Component ───
function GalleryRow({
  locations,
  onOpen,
  onViewOnMap,
}: {
  locations: MuseumLocation[];
  onOpen: (loc: MuseumLocation) => void;
  onViewOnMap?: (loc: MuseumLocation) => void;
}) {
  return (
    <div style={{
      overflowX: 'auto',
      paddingLeft: '24px',
      paddingRight: '24px',
      paddingBottom: '8px',
      WebkitOverflowScrolling: 'touch' as any,
      scrollbarWidth: 'none' as any,
    }}>
      <div style={{
        display: 'flex',
        gap: '16px',
        width: 'max-content',
      }}>
        {locations.map((loc) => (
          <div
            key={loc._id}
            style={{ display: 'flex', flexDirection: 'column', width: '220px', flexShrink: 0 }}
          >
            <button
              onClick={() => onOpen(loc)}
              className="museum-thumb-card"
              style={{
                display: 'block', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, textAlign: 'left', width: '100%', fontFamily: 'inherit',
              }}
            >
              <div className="museum-thumb" style={{ width: '220px', height: '160px', backgroundColor: '#f0f0f0' }}>
                {loc.mainImage ? (
                  <img
                    src={loc.mainImage}
                    alt={loc.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#e8e8e8' }} />
                )}
              </div>
            </button>
            <div style={{ paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: '12px', color: '#222222', fontWeight: 300, lineHeight: 1.3 }}>
                {loc.title}
              </p>
              <p style={{ fontSize: '11px', color: '#999999', fontWeight: 300 }}>
                {loc.artist}{loc.year ? `, ${loc.year}` : ''}
              </p>
              {onViewOnMap && (
                <button
                  onClick={() => onViewOnMap(loc)}
                  style={{
                    alignSelf: 'flex-start', marginTop: '4px',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '0',
                    fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.06em',
                    textDecoration: 'underline', textUnderlineOffset: '2px',
                  }}
                >
                  see on map
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
