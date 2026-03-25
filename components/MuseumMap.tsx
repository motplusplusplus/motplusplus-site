'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { sanityClient } from '@/lib/sanity';
import { DEMO_LOCATIONS } from '@/lib/demoLocations';
import { MUSEUM_TO_TRASH } from '@/lib/demoTrashItems';
import type { MuseumLocation, AccessType } from '@/lib/museumTypes';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const HCMC_CENTER: [number, number] = [106.7009, 10.7769];

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

  const [locations, setLocations] = useState<MuseumLocation[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [selected, setSelected] = useState<MuseumLocation | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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
  const artists = [...new Set(locations.map(l => l.artist))].sort();
  const latestAdditions = locations.filter(l => l.dateAdded === 'September 21, 1820');
  const featuredWorks = locations.filter(l => l.dateAdded === 'September 22, 1820').slice(0, 25);

  // Fetch from Sanity, fall back to demo
  useEffect(() => {
    sanityClient.fetch(`
      *[_type == "museumLocation" && active == true] {
        _id, title, artist, medium, year, dateAdded, description,
        accessType, accessDetails, hours, contactMethod,
        hostName, neighbourhood, isPast,
        "coordinates": location,
        "mainImage": mainImage.asset->url,
        "images": images[].asset->url,
      }
    `).then((data: MuseumLocation[]) => {
      if (data && data.length > 0) {
        setLocations(data);
        setIsDemo(false);
      } else {
        setLocations(DEMO_LOCATIONS);
        setIsDemo(true);
      }
      setLoading(false);
    }).catch(() => {
      setLocations(DEMO_LOCATIONS);
      setIsDemo(true);
      setLoading(false);
    });
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) return; // token not set at build time — skip map init

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/light-v11',
      center: HCMC_CENTER,
      zoom: 12.5,
    });

    mapRef.current = map;

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
          transition: transform 0.15s, border-color 0.15s;
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
          map.easeTo({ center: [loc.coordinates.lng, loc.coordinates.lat], duration: 400 });
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

      // Fit map to show all markers
      const withCoords = mapLocations.filter(l => l.coordinates?.lng && l.coordinates?.lat);
      if (withCoords.length > 1) {
        const lngs = withCoords.map(l => l.coordinates.lng);
        const lats = withCoords.map(l => l.coordinates.lat);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 60, maxZoom: 14, duration: 0 }
        );
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
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        mapRef.current?.easeTo({
          center: [loc.coordinates.lng, loc.coordinates.lat],
          zoom: 15,
          duration: 700,
        });
      }, 400);
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
          duration: 500,
        });
      }
    }
  };

  return (
    <div>
      <style>{`
        /* Grayscale only the map tiles canvas — NOT the marker layer.
           Applying filter to the container creates a stacking context that
           breaks Mapbox's translate3d marker positioning. */
        .mapboxgl-canvas-container { filter: grayscale(1); }
        @keyframes pin-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.25); }
          60%  { box-shadow: 0 0 0 9px rgba(0,0,0,0),    0 1px 4px rgba(0,0,0,0.25); }
          100% { box-shadow: 0 0 0 0   rgba(0,0,0,0),    0 1px 4px rgba(0,0,0,0.25); }
        }
        .pin-selected {
          animation: pin-pulse 0.7s ease-out 3;
        }
        @keyframes map-icon-pulse {
          0%, 100% { opacity: 0.18; transform: scale(0.97); }
          50%       { opacity: 0.38; transform: scale(1.03); }
        }
        .map-loading-icon {
          animation: map-icon-pulse 2s ease-in-out infinite;
          filter: grayscale(1);
          font-size: 52px;
          line-height: 1;
          display: block;
          margin-top: 10px;
          user-select: none;
        }
      `}</style>

      {/* ─── MAP ─── */}

      {/* demo banner — sits above the map in normal flow so it doesn't offset pin positioning */}
      {isDemo && !loading && (
        <div style={{
          backgroundColor: '#111111', color: 'white',
          fontSize: '11px', letterSpacing: '0.08em',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center',
        }}>
          <span>COMING SOON — THIS IS A DEMO VERSION OF +1 MUSEUM BY ANY OTHER NAME — ALL WORKS ARE PLACEHOLDERS — POSTED MARCH 21, 2026</span>
        </div>
      )}

      <div ref={mapSectionRef} style={{ borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', position: 'relative', width: '100%' }}>

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
            height: isMobile ? '80vh' : '65vh',
            minHeight: isMobile ? '500px' : '480px',
            backgroundColor: '#f0f0f0',
          }}
        />

        {/* loading */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#f5f5f5', pointerEvents: 'none',
          }}>
            <p style={{ fontSize: '12px', color: '#aaaaaa', letterSpacing: '0.08em' }}>loading</p>
            <span className="map-loading-icon">🗺</span>
          </div>
        )}

        {/* legend */}
        {!loading && (
          <div style={{
            position: 'absolute', bottom: '24px', left: '16px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: '10px 14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
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
        )}

        {/* current / all map toggle */}
        {!loading && (
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
                onClick={() => setSelected(null)}
                style={{
                  marginLeft: 'auto',
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
                {selected.artist}
                {selected.year ? `, ${selected.year}` : ''}
                {selected.medium ? ` — ${selected.medium}` : ''}
              </p>

              {selected.description && (
                <p style={{ fontSize: '13px', lineHeight: 1.8, color: '#555555', marginBottom: '20px' }}>
                  {selected.description}
                </p>
              )}

              <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selected.neighbourhood && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#bbbbbb', letterSpacing: '0.08em', marginBottom: '2px' }}>neighbourhood</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{selected.neighbourhood}</p>
                  </div>
                )}
                {selected.hostName && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#bbbbbb', letterSpacing: '0.08em', marginBottom: '2px' }}>hosted by</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{selected.hostName}</p>
                  </div>
                )}
                {selected.dateAdded && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#bbbbbb', letterSpacing: '0.08em', marginBottom: '2px' }}>added to the collection</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{selected.dateAdded}</p>
                  </div>
                )}
                {selected.hours && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#bbbbbb', letterSpacing: '0.08em', marginBottom: '2px' }}>hours</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{selected.hours}</p>
                  </div>
                )}
                {selected.accessDetails && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#bbbbbb', letterSpacing: '0.08em', marginBottom: '2px' }}>how to visit</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300, lineHeight: 1.65 }}>{selected.accessDetails}</p>
                  </div>
                )}
                {selected.contactMethod && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#bbbbbb', letterSpacing: '0.08em', marginBottom: '2px' }}>contact</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{selected.contactMethod}</p>
                  </div>
                )}
              </div>

              {(() => {
                const trashId = selected.trashItemId || MUSEUM_TO_TRASH[selected._id];
                if (!trashId) return null;
                return (
                  <a
                    href={`/trash?item=${trashId}`}
                    style={{
                      display: 'inline-block', marginTop: '16px',
                      fontSize: '12px', color: '#fff', backgroundColor: '#111',
                      padding: '8px 16px', textDecoration: 'none', letterSpacing: '0.03em',
                    }}
                  >
                    inquire through +1 trash
                  </a>
                );
              })()}

              {selected._demo && (
                <p style={{ fontSize: '10px', color: '#cccccc', marginTop: '20px', letterSpacing: '0.06em' }}>
                  demo content — not a real work or artist
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── DESCRIPTION ─── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '64px 24px 48px' }}>
        <div style={{ maxWidth: '720px' }}>
          <p style={{ fontSize: '15px', lineHeight: 1.85, color: '#444444', marginBottom: '20px' }}>
            ho chi minh city has no contemporary art museum.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.85, color: '#444444', marginBottom: '20px' }}>
            +1 museum by any other name is a decentralized collection sited across the city, in private homes, businesses, studios, and public spaces. the works are real, documented, and curated. what is unconventional is where they live and what it takes to see them. each work has its own location, its own host, and its own conditions of access: some are freely visible, others require a phone call, an introduction, a time of day. the platform maps all of this and tells you what you need to know to get there.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.85, color: '#444444', marginBottom: '20px' }}>
            navigating the collection means navigating the world. someone might plan an afternoon across several works in different neighborhoods, or discover a piece while already somewhere else entirely. the map is the floor plan. the city is the building.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.85, color: '#444444', marginBottom: '32px' }}>
            works enter the collection through artists, through collectors who open their spaces, and through the a.Farm residency program. the collection grows as the network does.
          </p>
          <p style={{ fontSize: '14px', color: '#888888', lineHeight: 1.8 }}>
            get in touch at{' '}
            <a href="mailto:motplusplusplus@gmail.com" style={{ color: '#666666' }}>motplusplusplus@gmail.com</a>.
          </p>
        </div>
      </div>

      {/* ─── BROWSE DROPDOWNS ─── */}
      {!loading && (
        <div style={{ borderTop: '1px solid #e5e5e5' }}>

          {/* view all */}
          <div style={{ borderBottom: '1px solid #e5e5e5' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <button
                onClick={() => setViewAllOpen(!viewAllOpen)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '12px 24px',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#999999', textTransform: 'uppercase' }}>
                  view all
                  <span style={{ color: '#cccccc', marginLeft: '10px', fontWeight: 300 }}>{locations.length}</span>
                </span>
                <span style={{ fontSize: '14px', color: '#bbbbbb', transform: viewAllOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</span>
              </button>
              {viewAllOpen && (
                <div style={{ padding: '0 24px 32px' }}>
                  {/* current / past filter */}
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
                          <div
                            key={loc._id}
                            onClick={() => openLightbox(loc, gridItems)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ aspectRatio: '4/3', overflow: 'hidden', backgroundColor: '#f0f0f0', marginBottom: '8px' }}>
                              {loc.mainImage && (
                                <img
                                  src={loc.mainImage}
                                  alt={loc.title}
                                  loading="lazy"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                                  onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.04)'; }}
                                  onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
                                />
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#222222', fontWeight: 300, lineHeight: 1.3, marginBottom: '2px' }}>{loc.title}</p>
                            <p style={{ fontSize: '11px', color: '#999999', fontWeight: 300 }}>{loc.artist}{loc.year ? `, ${loc.year}` : ''}</p>
                            {loc.neighbourhood && <p style={{ fontSize: '10px', color: '#bbbbbb', marginTop: '2px' }}>{loc.neighbourhood}</p>}
                          </div>
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

              <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                {lightbox.neighbourhood && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#cccccc', letterSpacing: '0.08em', marginBottom: '2px' }}>neighbourhood</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{lightbox.neighbourhood}</p>
                  </div>
                )}
                {lightbox.hostName && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#cccccc', letterSpacing: '0.08em', marginBottom: '2px' }}>hosted by</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{lightbox.hostName}</p>
                  </div>
                )}
                {lightbox.dateAdded && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#cccccc', letterSpacing: '0.08em', marginBottom: '2px' }}>added to the collection</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{lightbox.dateAdded}</p>
                  </div>
                )}
                {lightbox.hours && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#cccccc', letterSpacing: '0.08em', marginBottom: '2px' }}>hours</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{lightbox.hours}</p>
                  </div>
                )}
                {lightbox.accessDetails && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#cccccc', letterSpacing: '0.08em', marginBottom: '2px' }}>how to visit</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300, lineHeight: 1.65 }}>{lightbox.accessDetails}</p>
                  </div>
                )}
                {lightbox.contactMethod && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#cccccc', letterSpacing: '0.08em', marginBottom: '2px' }}>contact</p>
                    <p style={{ fontSize: '13px', color: '#444444', fontWeight: 300 }}>{lightbox.contactMethod}</p>
                  </div>
                )}
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
                  demo content — not a real work or artist
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
              style={{
                display: 'block', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, textAlign: 'left', width: '100%',
              }}
            >
              <div style={{ width: '220px', height: '160px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                {loc.mainImage ? (
                  <img
                    src={loc.mainImage}
                    alt={loc.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s ease' }}
                    onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.04)'; }}
                    onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
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
