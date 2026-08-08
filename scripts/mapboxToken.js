/**
 * Mapbox token validation, shared by every gate that can ship a broken map.
 *
 * WHY THIS EXISTS. On 2026-08-08 the live museum map showed "map unavailable"
 * for a token that was present, correctly inlined by webpack, and *malformed*:
 * the value carried a literal newline plus two spaces in the middle —
 *
 *     pk.eyJ1...Mm1yZ2\n  lnIn0.ULKt...
 *
 * — because the value it was built from was line-wrapped. Mapbox answered 401,
 * mapbox-gl emitted an error before load, and MuseumMap fell back.
 *
 * Every existing guard passed it:
 *   - deploy.yml tested `-z` (non-empty) — a wrapped token is non-empty
 *   - deploy.js tested presence in the environment — likewise
 *   - verify-deploy.js grepped chunks for `pk.eyJ` — a corrupted token still
 *     contains `pk.eyJ`, so the one guard written specifically to catch a broken
 *     map matched the broken token
 *
 * The lesson: "a token is present" and "a token is usable" are different
 * assertions, and only the second one keeps the map up. isWellFormed covers the
 * shape; assertUsable additionally asks Mapbox.
 */

/** Mapbox access tokens are `pk.<base64url>.<base64url>` — no whitespace anywhere. */
const TOKEN_RE = /^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** Returns null if the token is well formed, else a human-readable reason. */
function tokenProblem(raw) {
  if (raw == null || raw === '') return 'not set';
  if (typeof raw !== 'string') return `not a string (${typeof raw})`;
  if (/\s/.test(raw)) {
    // Name the whitespace precisely — this is the failure that actually happened,
    // and "looks fine in a terminal" is exactly why it took a byte dump to find.
    const kinds = [...new Set((raw.match(/\s/g) || []).map((c) =>
      ({ '\n': 'newline', '\r': 'carriage return', '\t': 'tab', ' ': 'space' }[c] || `U+${c.codePointAt(0).toString(16)}`)))];
    return `contains whitespace (${kinds.join(', ')}) — the value was probably pasted line-wrapped. ` +
      `Re-enter it as a single unbroken line.`;
  }
  if (!raw.startsWith('pk.')) return 'does not start with "pk." — is this a secret (sk.) or the wrong value?';
  if (!TOKEN_RE.test(raw)) return 'does not match pk.<base64url>.<base64url>';
  return null;
}

function isWellFormed(raw) {
  return tokenProblem(raw) === null;
}

/**
 * Shape check, then ask Mapbox whether it actually works. Catches expiry,
 * billing state and URL restrictions, which shape checking cannot.
 * Set MAPBOX_SKIP_LIVE_CHECK=1 to skip the network call.
 */
async function assertUsable(raw, { referer } = {}) {
  const problem = tokenProblem(raw);
  if (problem) throw new Error(`NEXT_PUBLIC_MAPBOX_TOKEN ${problem}`);

  if (process.env.MAPBOX_SKIP_LIVE_CHECK === '1') return { checked: false };

  const url = `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${encodeURIComponent(raw)}`;
  let res;
  try {
    res = await fetch(url, { headers: referer ? { Referer: referer } : {} });
  } catch (err) {
    // A network failure is not a bad token. Do not fail a deploy over it.
    console.warn(`  ! could not reach Mapbox to verify the token (${err.message}) — skipping live check`);
    return { checked: false };
  }
  if (res.status === 401) throw new Error('Mapbox rejected the token (401) — it is invalid, revoked, or malformed.');
  if (res.status === 403) throw new Error('Mapbox returned 403 — the token is URL-restricted and this origin is not allowed, or billing is suspended.');
  if (!res.ok) throw new Error(`Mapbox returned HTTP ${res.status} for the token.`);
  return { checked: true };
}

/** Extract every pk.* token literal from built JS, including malformed ones. */
function extractTokens(source) {
  // Deliberately permissive: matches across the whitespace that a corrupted
  // token contains, so a broken value is FOUND and reported rather than missed.
  return (source.match(/pk\.eyJ[\s\S]{0,400}?(?=["'`])/g) || []).map((s) => s.trim());
}

module.exports = { TOKEN_RE, tokenProblem, isWellFormed, assertUsable, extractTokens };
