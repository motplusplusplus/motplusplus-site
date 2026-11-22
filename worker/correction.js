// POST /api/correction — "something wrong or missing? suggest a correction" (C1–C6).
//
// Emails admin@ through the Gmail API, sent as info@ by the same domain-wide-delegated
// service account the newsletter uses (GOOGLE_SA_KEY, scope gmail.send). Nothing is
// stored anywhere: NEVER in Sanity (the dataset is publicly readable), not in KV, not
// in logs. A submission only notifies; every correction is made by hand (C4).
//
// Abuse controls: honeypot, 3s time trap, per-ip rate limit (CORRECTION_LIMITER,
// falling back to the in-isolate counter), and Turnstile when TURNSTILE_SECRET is set.

import { getAccessToken, originAllowed, rateLimited, turnstileOk } from "./subscribe.js";

const SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const TO = "admin@motplusplusplus.com";
const FROM = "info@motplusplusplus.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHO = { "this-is-me": "this is me", involved: "I was involved", visitor: "visitor" };

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const str = (v, max) => (typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, max) : "");
// header-safe: no line breaks, RFC 2047 encoded when not ASCII
const hdr = (s) => { const t = s.replace(/[\r\n]+/g, " "); return /^[\x20-\x7e]*$/.test(t) ? t : `=?UTF-8?B?${b64(t)}?=`; };
function b64(s) { const b = new TextEncoder().encode(s); let x = ""; for (const c of b) x += String.fromCharCode(c); return btoa(x); }
const b64url = (s) => b64(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function handleCorrection(request, env) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!originAllowed(request)) return json({ error: "forbidden" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }

  if (typeof body?.website === "string" && body.website !== "") return json({ ok: true }); // honeypot: pretend, send nothing
  if (typeof body?.elapsedMs !== "number" || body.elapsedMs < 3000) return json({ error: "that was quick. please wait a moment and try again." }, 400);

  const who = WHO[body?.who];
  const change = str(body?.change, 5000);
  const name = str(body?.name, 120);
  const email = str(body?.email, 254).toLowerCase();
  const links = str(body?.links, 2000);
  const pageTitle = str(body?.pageTitle, 200) || "(untitled page)";
  let pageUrl = str(body?.pageUrl, 500);
  try { const u = new URL(pageUrl); pageUrl = /motplusplusplus\.com$|workers\.dev$/.test(u.hostname) ? u.href : ""; } catch { pageUrl = ""; }
  if (!who) return json({ error: "please say who you are." }, 400);
  if (change.length < 3) return json({ error: "please say what needs changing." }, 400);
  if (email && !EMAIL_RE.test(email)) return json({ error: "please check the email address." }, 400);

  const limiter = env.CORRECTION_LIMITER ? { SUBSCRIBE_LIMITER: env.CORRECTION_LIMITER } : {};
  if (await rateLimited(limiter, request)) return json({ error: "too many attempts. please try again in a minute." }, 429);
  if (!(await turnstileOk(env, body?.turnstileToken, request.headers.get("CF-Connecting-IP")))) {
    return json({ error: "we could not verify you are human. please reload and try again." }, 400);
  }

  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" }) + " (Ho Chi Minh City)";
  const text = [
    `page: ${pageTitle}`,
    `link: ${pageUrl || "(not given)"}`,
    `time: ${when}`,
    "",
    `who: ${who}`,
    `name: ${name || "(not given)"}`,
    `email: ${email || "(not given)"}`,
    "",
    "what needs changing:",
    change,
    "",
    `links: ${links || "(none)"}`,
    "",
    "sent from the correction form on motplusplusplus.com. nothing on the site changes until someone edits it by hand.",
  ].join("\n");

  const mime = [
    `From: MoT+++ website <${FROM}>`,
    `To: ${TO}`,
    ...(email ? [`Reply-To: ${email}`] : []),
    `Subject: ${hdr(`correction: ${pageTitle}`)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(text).replace(/.{76}/g, "$&\r\n"),
  ].join("\r\n");

  try {
    const token = await getAccessToken(env, SEND_SCOPE);
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: b64url(mime) }),
    });
    if (!res.ok) throw new Error("gmail " + res.status);
  } catch (e) {
    console.log("correction send failed", String(e && e.message || e)); // no form content is logged
    return json({ error: "it could not be sent just now. please email admin@motplusplusplus.com." }, 502);
  }
  return json({ ok: true });
}

// POST /api/t — anonymous click counts (D8). Event name + path only.
const EVENTS = new Set(["drift", "wall-save", "wall-share", "share", "notify-me", "inquire", "correction"]);
export async function handleTrack(request, env) {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  try {
    const b = await request.json();
    if (EVENTS.has(b?.e) && env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({ blobs: [b.e, String(b.p || "").slice(0, 200)], indexes: [b.e] });
    }
  } catch { /* ignore */ }
  return new Response(null, { status: 204 });
}
