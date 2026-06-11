'use client';

import dynamic from 'next/dynamic';
import { getStaticMapUrl } from '@/lib/mapConstants';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const STATIC_MAP_URL = getStaticMapUrl(MAPBOX_TOKEN);

// Skeleton shown instantly while the ~1.7MB mapbox-gl chunk downloads. Matches the live
// map's container sizing (lib/mapConstants + MuseumMap) so there's no layout shift on swap.
function MapSkeleton() {
  return (
    <div style={{ borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', width: '100%' }}>
      <style>{`
        .museum-map-skeleton { height: 65vh; min-height: 480px; }
        @media (max-width: 767px) {
          .museum-map-skeleton { height: 80vh; min-height: 500px; }
        }
      `}</style>
      <div className="museum-map-skeleton" style={{ position: 'relative', width: '100%', backgroundColor: '#f0f0f0', overflow: 'hidden' }}>
        {STATIC_MAP_URL && (
          <img
            src={STATIC_MAP_URL}
            alt=""
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <p style={{ fontSize: '12px', color: '#aaaaaa', letterSpacing: '0.08em', backgroundColor: 'rgba(255,255,255,0.85)', padding: '6px 14px' }}>
            +++loading+++
          </p>
        </div>
      </div>
    </div>
  );
}

const MuseumMap = dynamic(() => import('./MuseumMap'), { ssr: false, loading: MapSkeleton });

export default function MuseumMapWrapper() {
  return <MuseumMap />;
}
