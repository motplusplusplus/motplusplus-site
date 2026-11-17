// Newsletter subscribe + geo endpoints for the Worker (worker.js).
//
// Subscribers live in the Google Sheet "MoT+++ newsletter subscribers", tab
// "subscribers". Access is via the thi-tien service account with domain-wide
// delegation (impersonating info@motplusplusplus.com). The service-account JSON
// lives ONLY as the Worker secret GOOGLE_SA_KEY, never in the repo.
//
// Secrets / bindings used:
//   GOOGLE_SA_KEY        service account key JSON (secret)
//   TURNSTILE_SECRET     optional. Turnstile is OFF until this secret is set (and
//                        the site key is set in lib/turnstile.ts); then it is enforced.
//   SUBSCRIBE_LIMITER    optional Workers rate-limit binding (wrangler.toml)

const SHEET_ID = "1Hec63SUuiXt_4tLbbPdLeWHdbHec9bVqLM63GC1eRBs";
const TAB = "subscribers";
const IMPERSONATE = "info@motplusplusplus.com";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

const ALLOWED_ORIGINS = new Set([
  "https://motplusplusplus.com",
  "https://www.motplusplusplus.com",
]);

// countries where the inquiry newsletter box must start unticked: EU (cf also
// flags these via isEUCountry), the rest of the EEA, the uk and switzerland.
const NO_DEFAULT_TICK = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", // eu
  "IS", "LI", "NO", // eea
  "GB", "CH",
]);

const MIN_FILL_MS = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const h = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders(request) },
  });
}

// ---- geo -------------------------------------------------------------------

export function tickByDefaultFor(cf) {
  const country = cf && typeof cf.country === "string" ? cf.country.toUpperCase() : "";
  // unknown country (tor "T1", missing, "XX") -> unticked
  if (!country || country === "XX" || country === "T1") return false;
  if (cf.isEUCountry === "1" || cf.isEUCountry === 1 || cf.isEUCountry === true) return false;
  return !NO_DEFAULT_TICK.has(country);
}

export function handleGeo(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "GET") return json(request, { error: "method not allowed" }, 405);
  return json(request, { tickByDefault: tickByDefaultFor(request.cf) });
}

// ---- google sheets ---------------------------------------------------------

let cachedToken = null; // { token, exp } per isolate

function b64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const key = JSON.parse(env.GOOGLE_SA_KEY);
  const pem = key.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
  const unsigned =
    b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." +
    b64url(JSON.stringify({
      iss: key.client_email, sub: IMPERSONATE, scope: SCOPE,
      aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
    }));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsigned));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: unsigned + "." + b64url(sig),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error("google token error " + res.status);
  cachedToken = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return cachedToken.token;
}

async function sheets(env, path, init = {}) {
  const token = await getAccessToken(env);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/${path}`, {
    ...init,
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("sheets error " + res.status);
  return res.json();
}

function todayVn() {
  // team works in ho chi minh city; en-CA gives yyyy-mm-dd like the existing rows
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function cleanName(s) {
  if (typeof s !== "string") return "";
  // strip leading formula characters so later csv exports stay safe
  return s.trim().replace(/^[=+\-@\s]+/, "").slice(0, 100);
}

export function splitName(full) {
  const n = cleanName(full);
  const i = n.indexOf(" ");
  return i === -1 ? { first: n, last: "" } : { first: n.slice(0, i), last: n.slice(i + 1).trim() };
}

/**
 * add or update one subscriber. returns "added" | "resubscribed" | "unchanged".
 * rules: excluded / bounced / any other existing status are left untouched,
 * "unsubscribed" goes back to subscribed, unknown emails are appended.
 */
export async function upsertSubscriber(env, { email, first = "", last = "", country = "", source, note = "" }) {
  const addr = String(email).trim().toLowerCase();
  const rows = (await sheets(env, `values/${TAB}!A:D`)).values || [];

  let rowNum = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || "").trim().toLowerCase() === addr) { rowNum = i + 1; break; }
  }

  const today = todayVn();
  if (rowNum !== -1) {
    const status = String(rows[rowNum - 1][3] || "").trim().toLowerCase();
    if (status !== "unsubscribed") return "unchanged"; // subscribed, excluded, bounced, anything else
    await sheets(env, "values:batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: [
          { range: `${TAB}!D${rowNum}`, values: [["subscribed"]] },
          { range: `${TAB}!K${rowNum}:L${rowNum}`, values: [[today, "resubscribed via website"]] },
        ],
      }),
    });
    return "resubscribed";
  }

  // columns: email, first name, last name, status, profile, tags, country, city,
  //          source, added, status changed, status note, last issue sent
  const row = [addr, cleanName(first), cleanName(last), "subscribed", "", "", String(country || "").toLowerCase(), "",
    source, today, today, note, ""];
  await sheets(env, `values/${TAB}!A:M:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: [row] }),
  });
  return "added";
}

// ---- abuse controls --------------------------------------------------------

const memHits = new Map(); // per-isolate fallback when the rate-limit binding is absent

export async function rateLimited(env, request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (env.SUBSCRIBE_LIMITER) {
    const { success } = await env.SUBSCRIBE_LIMITER.limit({ key: ip });
    return !success;
  }
  const now = Date.now();
  const hits = (memHits.get(ip) || []).filter((t) => now - t < 60_000);
  hits.push(now);
  memHits.set(ip, hits);
  if (memHits.size > 5000) memHits.clear();
  return hits.length > 5;
}

async function turnstileOk(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true; // not switched on yet
  if (typeof token !== "string" || !token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, ...(ip ? { remoteip: ip } : {}) }),
  }).catch(() => null);
  const data = res && res.ok ? await res.json().catch(() => null) : null;
  return data?.success === true;
}

// ---- POST /api/subscribe (site footer) -------------------------------------

export async function handleSubscribe(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "method not allowed" }, 405);

  const origin = request.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(request, { error: "forbidden" }, 403);

  let body;
  try { body = await request.json(); } catch { return json(request, { error: "invalid json" }, 400); }

  // honeypot: bots fill the hidden field. pretend success, write nothing.
  if (typeof body?.website === "string" && body.website !== "") return json(request, { ok: true });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json(request, { error: "please enter a valid email address." }, 400);
  }

  // time trap: a person cannot read and fill the form in under 3s; scripts can.
  // elapsedMs is measured by the page since the form mounted.
  if (typeof body?.elapsedMs !== "number" || body.elapsedMs < MIN_FILL_MS) {
    return json(request, { error: "that was quick. please wait a moment and try again." }, 400);
  }

  if (await rateLimited(env, request)) return json(request, { error: "too many attempts. please try again in a minute." }, 429);

  if (!(await turnstileOk(env, body.turnstileToken, request.headers.get("CF-Connecting-IP")))) {
    return json(request, { error: "we could not verify you are human. please reload and try again." }, 400);
  }

  try {
    await upsertSubscriber(env, { email, country: request.cf?.country || "", source: "website footer" });
  } catch {
    return json(request, { error: "something went wrong on our side. please try again shortly." }, 502);
  }
  return json(request, { ok: true });
}
