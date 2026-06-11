// Shared between MuseumMap (live Mapbox GL map) and MuseumMapWrapper (static placeholder).
//
// Cloudflare Workers Assets bug: the 1.7MB mapbox-gl chunk can silently 404 after deploy
// even though wrangler reports "already uploaded". Fix: make any trivial change to
// components/MuseumMap.tsx (e.g. tweak HCMC_CENTER below by ±0.000001), rebuild with the
// token set, redeploy, then run npm run verify-deploy to confirm. The change forces a new
// content hash so Cloudflare uploads a fresh copy instead of reusing the stale/corrupted
// cached entry.
export const HCMC_CENTER: [number, number] = [106.700903, 10.776901];
export const MAP_DEFAULT_ZOOM = 12.5;

// Mapbox Static Images API — renders a server-side PNG snapshot of the map for use as an
// instant placeholder while the ~1.7MB mapbox-gl JS bundle downloads and initializes.
export function getStaticMapUrl(token: string, width = 1280, height = 800): string {
  if (!token) return '';
  const [lng, lat] = HCMC_CENTER;
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${lng},${lat},${MAP_DEFAULT_ZOOM},0/${width}x${height}@2x?access_token=${token}`;
}
