// Public Turnstile site key (safe to commit; the secret key is a Worker secret).
// Turnstile is OFF while this is empty. To switch it on: set the site key here and
// run `wrangler secret put TURNSTILE_SECRET` (the Worker enforces it once the secret exists).
export const TURNSTILE_SITE_KEY = "";
