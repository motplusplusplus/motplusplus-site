# MoT+++ site audit — 2026-07-22

Audited against where the organization is going (custom-domain email in ~1 month,
funding push, freelance sales staff, native museum app within a year, agent-driven
operations later), not only against today. Findings ranked by impact per unit of
effort. Files referenced are in this repo unless noted; "Studio repo" =
`~/Documents/motplus-sanity`.

---

## Ranked findings

### 1. Every non-overriding page declared the empty homepage as its canonical URL — FIXED
**What:** `app/layout.tsx` set `alternates.canonical: "https://motplusplusplus.com"`.
Next.js metadata inherits into every page that doesn't override `alternates`, so
`/about`, `/contact`, `/events`, `/press`, `/sound`, `/performance`, `/collective`
(verified live on all seven) told search engines "my canonical version is the
homepage" — and the homepage was an empty client-side redirect (finding 2). This
quietly suppresses those pages from search at the exact moment funders and
collectors will be googling the organization.
**Effort:** small. **Status: fixed in this session** (see below).

### 2. The organization's front door was an empty page — FIXED
**What:** `app/page.tsx` was `redirect("/museum")`, which in a static export emits
*no* meta refresh and *no* body content — just client-side JS. Crawlers, link
previews without JS, and anyone on a slow connection got a blank page at the
single most-linked URL the organization has. It also meant no surface presented
all four programs together: a funder landing on the root saw nothing; a funder
landing on /museum saw only the museum.
**Why it matters:** the funding push and the sales expansion both depend on a
first-time visitor (funder, collector, applicant) orienting in one glance. The
site had four front doors and no lobby.
**Effort:** medium. **Status: fixed in this session** (see below).

### 3. Every inquiry path is `mailto:` into personal Gmail inboxes
**What:** all conversion paths — work inquiry (`/trash`, `/trash/[slug]`),
residency application (`/afarm/apply`), museum inquiry (`/museum/inquire`),
general contact (`/contact`), advisory, press — are `mailto:` links. Recipients
today: `motplusplusplus@gmail.com` (×10 call sites), `a.farm.saigon@gmail.com`
(×3), and `dave.a.willis@gmail.com` (×2, on `/afarm/retreat` — a *personal*
address on the page institutional funders will scrutinize most).
**Why it matters commercially:**
- `mailto:` silently fails for the large share of users with no configured mail
  client (webmail-only desktop users). A collector clicking "inquire" and getting
  nothing is a lost sale with no trace.
- Nothing is captured: no record in Sanity, no routing, no way for a future
  freelance salesperson or agent to pick up an inquiry. The `inquiry` schema
  type exists in Sanity (0 documents) and is completely unused — the
  infrastructure for capture was designed and then bypassed (ARCHITECTURE §8).
- When Workspace lands, per-function addresses (sales@, museum@, residency@)
  need one edit point. Today the addresses are scattered across 13 files.
**Files:** `components/MailtoContactForm.tsx`, `app/afarm/apply/page.tsx`,
`app/museum/inquire/page.tsx`, `app/trash/TrashPageShell.tsx`,
`app/trash/[slug]/page.tsx` (via `lib/demoTrashItems.ts`'s
`buildTrashInquiryEmail`), `app/afarm/retreat/page.tsx`, `app/contact/page.tsx`,
`worker.js` (for the future endpoint), Sanity `inquiry` type.
**Effort:** medium (centralize addresses now — task 02) + large (real inquiry
endpoint — task 01). Do the centralization before the email cutover; the
endpoint before the sales-team expansion.

### 4. The museum map will silently degrade the day the first real location is published — PARTIALLY FIXED
**What:** `components/MuseumMap.tsx` fetches `museumLocation` docs at runtime and
flips from demo to real data the moment **one** published doc has coordinates.
Five draft docs already exist in Sanity (invisible to the public API today —
confirmed by query — but one click from live). When that flip happens:
- The 12-pin demo showcase becomes a 1-pin museum with no warning.
- The "latest additions" and "featured works" rails vanished entirely, because
  they were keyed on sentinel values (`dateAdded === 'September 21/22, 1820'`)
  of a field that **does not exist in the real schema** (`museumLocation.ts` has
  no `dateAdded`).
**Status:** the rails half is **fixed in this session** (see below): real data now
derives "latest additions" from `_createdAt` and "featured works" from an
optional `featured` boolean (rail stays hidden until the field exists — task 03
adds it to the schema). The flip-on-first-publish trap remains — task 04 makes
going live deliberate rather than accidental.
**Why it matters:** this is the flagship, the future native app, and the thing
the brief says to treat as most important. Its go-live should be a decision,
not a side effect of an editor publishing a draft.

### 5. Curation and identity data is hardcoded where no editor or agent can reach it
**What:** the operational center of gravity is split between Sanity (editable)
and TypeScript constants (developer-only):
- `lib/badges.ts`: `HOSTING_SLUGS`, `COLLECTIVE_SLUGS`, `FOUNDER_SLUGS`,
  `PLUS1_MUSEUM_SLUGS` — curated sets an editor cannot touch.
- `artists-data.json` flags (`resident`, `performancePlus`, `curator`) still
  feed badges for 12+43+1 artists respectively (audited in ISSUE-006); Sanity
  has no equivalent fields yet.
- `lib/press.ts`: all press items are TypeScript — an editor cannot add a press
  mention, which is exactly the content that spikes during a funding push.
- `app/contemporary/page.tsx` and `app/performance/page.tsx` hardcode event-slug
  lists (this already caused 4 broken links, ISSUE-015).
- a.Farm content is split three ways: Sanity `afarmHost` + `studios-data.json`
  (hostSlug, portraitPairs, videos — ISSUE-007) + page copy.
**Why it matters:** "a beautiful page that requires him personally to update it"
— this is where that sentence lives. Every one of these requires a developer
session (today: the director) for a content change. A prompt-driven agent
updating Sanity can never reach them. The single highest-leverage item is
press (task 06); the JSON flags have a documented exit path in ISSUE-006.
**Effort:** medium each, independent.

### 6. The pricelist gate is decorative — and the team should know it
**What:** `/pricelist` prices ship in the static HTML (verified live: `"price":"3000"`
readable with `curl`, no password), and the password itself
(`virtuesofhumantrash`, `lib/priceReveal.ts`) is in the public JS chunk
(verified live). The same password gates the `/trash` lightbox price reveal.
**Why it matters:** as a *soft* social gate for collectors this is arguably fine
— galleries do exactly this with PDF pricelists. But the org should make that
choice knowingly, especially before freelance salespeople start treating the
password as if it protects something, and before consignor-sensitive data ever
lands near this page. Either accept it as ceremony (document that) or gate it
for real at the Worker layer (task 05). Note the tension: the public work page
says "price on inquiry" while the price is technically public two clicks away.
**Files:** `app/pricelist/PricelistShell.tsx`, `lib/priceReveal.ts`,
`app/trash/TrashPageShell.tsx`, `worker.js` + `wrangler.toml` for a real gate.
**Effort:** small (accept + document) or medium (Worker gate).

### 7. Information architecture: the nav is a flat list of 18 program names
**What:** `components/Header.tsx` renders ~18 entries; three different labels
("+a.Farm", "+1 nice place for experimentation", "+1 residency") all point at
`/afarm`; "+1 museum" appears twice under two labels. A first-time visitor
cannot tell programs from pages. The two-click test mostly *passes* for each
persona now that the homepage exists (fixed above) — collector → +1 trash →
work; applicant → +a.Farm → apply; funder → homepage/about — but the nav
itself still reads as internal vocabulary.
**Why it matters:** funders and collectors are first-time visitors by
definition. The homepage now does the orienting; the nav should follow it
(group: museum / residency / works / program / about) rather than enumerate
every historical program name at the top level.
**Files:** `components/Header.tsx`. **Effort:** medium (task 07).

### 8. Contract generation is genuinely good — and one lawyer review away from scale
**What:** the Studio repo's sales machinery (invoice → payment → receipt/CoA →
consignment agreement) is properly factored: tested builder libs
(`lib/buildConsignmentAgreement.ts` + 20 sibling modules, each with tests),
a clause library (`consignmentClauses.ts`), centralized legal entity and bank
details (`motLegalEntity.ts`, `motBankDetails.ts`), correction flows, and
lock-when-issued. Coupling to `trashItem` is thin — an ID plus a generic
work snapshot (`artistNames/title/year/medium/dimensions/edition`).
**Assessment for the pending expansion:** this is *not* a one-off. Generalizing
to +1 Museum display agreements or program contracts means (a) a
`subject` abstraction replacing the `trashItem` ref + snapshot, and (b) a new
clause set in `consignmentClauses.ts` — which is also exactly where the
lawyer-approved language should land (the binding clauses are currently marked
placeholder pending review). No action now; when the lawyer returns text,
budget a session to slot it into the clause library rather than pasting it
into one template.
**Human bottleneck note:** every generated document still requires the director
(or an editor) inside Studio. That's appropriate pre-lawyer; post-expansion,
`RecordPaymentAction` and invoice generation are the flows freelancers will
use — they are already editor-accessible in Studio, which is the right shape.

### 9. Native-app readiness (+1 Museum) — mostly good, three flags
Do not build the app now; these keep the road clear:
- **Good:** all museum data is a queryable public Sanity shape (`aclMode:
  public`, stable `_id`s, real `geopoint` field). A native client can consume
  the same GROQ query `MuseumMap.tsx` uses today, no API to build.
- **Flag 1:** that GROQ query lives inline in a 1700-line presentation
  component. When the app project starts, extract it (and the
  `MuseumLocation` type in `lib/museumTypes.ts`, which is already shared-shaped)
  into a documented query module the app team can copy verbatim.
- **Flag 2:** `titleVi`/`descriptionVi` exist in the schema but are never
  rendered (the EN/VN gap events already closed). A bilingual native app will
  want them; start populating now, render on web when convenient.
- **Flag 3:** inquiry/contact from a map location is `mailto:` +
  `contactMethod` free text; `hostEmail` is in the schema but never queried.
  The task-01 inquiry endpoint should be designed so the native app can POST
  to it too (one more reason not to stay `mailto:`-only).

### 10. Performance / technical debt (from build output + recon)
- The heavy chunk is the known one: mapbox-gl (~990 KB vendor chunk) on
  `/museum` only, dynamically imported. Acceptable for the flagship; nothing
  new to chase. The rest of the site is static HTML with modest JS — fine.
- `next build` ~20s, 543 pages — content auto-deploy (~3–5 min publish-to-live)
  is healthy and is the right architecture for agent-driven updates later:
  an agent that can write to Sanity can already "update the site by prompt."
- Debt worth naming: 49 files of inline `style={{}}` with no shared
  Button/Card/Typography primitives. Cheap now, increasingly expensive as
  freelancers/agents touch pages. Not urgent; fold into any future redesign
  rather than a standalone refactor.
- `components/MuseumMap.tsx` carries 12 pre-existing lint errors (`any` types,
  setState-in-effect warnings). Untouched deliberately (fragile file, see
  CLAUDE.md history); clean up only alongside a properly verified deploy.

### 11. Visual design — top five against the stated register (brief, as requested)
The bones are right: restrained type, lowercase voice, generous whitespace.
1. **Muted grays fail contrast and read washed-out, not calm** — `#999999`
   (109 uses) at 11–12px fails WCAG AA badly (2.85:1); `#aaa`/`#bbb`/`#ccc`
   worse (ISSUE-016 measured this). Zwirner/e-flux restraint comes from scale
   and spacing, not from gray this light. One sweep to `#767676` (passes AA)
   keeps the register and fixes accessibility. (Task 08; the new homepage
   already uses `#767676`.)
2. **Eyebrow-label monotony** — nearly every page opens with the same 11px
   letterspaced gray label + light h1. The system needs one more register
   (a serif, a size jump, or editorial image lead) for flagship moments
   (museum, homepage) so hierarchy exists *between* pages, not just within.
3. **No editorial image treatment on program landings** — /afarm and /museum
   lead with UI, not with a full-bleed image. For an art organization the
   photography should carry more; the galleries have the material.
4. **Tables/grids (pricelist, trash grid) are the most "startup-template"
   surfaces** — fine for internal tools; if collectors see the pricelist,
   it deserves the same typographic care as the work pages.
5. **Footer/contact endings are abrupt** — pages tend to just stop. A quiet,
   consistent colophon (address, IG, per-function emails once they exist)
   would close pages the way the reference sites do.

---

## Fixed in this session

All changes build clean (`next build --webpack`, 543 pages, exit 0) and are
uncommitted in the working tree for your review. **Not deployed.** Lint on
changed files: no new errors (the 12 in `MuseumMap.tsx` pre-date this session
and sit far from the edited lines — verified against HEAD).

1. **Real homepage** (`app/page.tsx`): replaced the empty client-side
   `redirect("/museum")` with a static landing page in the site's idiom —
   MoT+++ masthead + one-line identity, a flagship +1 Museum block ("open the
   map"), three program blocks (+a.Farm / +1 trash / exhibitions & events),
   and quiet secondary links (MoTcyclopedia, collective, about, press,
   contact). Chose typography-only (no images) deliberately: zero risk of a
   bad unilateral image call, instant load, and it matches the e-flux
   register; add photography later if wanted. Also added `/` to
   `app/sitemap.ts` (priority 1.0). Why me: this required holding IA,
   SEO, voice rules (lowercase, MoT+++ capitalization), and the four-program
   strategy in mind at once.

2. **Sitewide canonical bug** (`app/layout.tsx`): removed the layout-level
   `alternates.canonical` that every non-overriding page inherited (all of
   `/about`, `/events`, `/press`, etc. were declaring the homepage as their
   canonical — live-verified before and after). Left a comment explaining the
   inheritance trap so it doesn't come back. The homepage now sets its own
   canonical in `app/page.tsx`. Why me: the failure is invisible in any single
   file — you have to know Next's metadata-inheritance semantics and check
   the live output.

3. **Museum map real-data readiness** (`components/MuseumMap.tsx`,
   `lib/museumTypes.ts`): the "latest additions" / "featured works" rails were
   filtered on `dateAdded` sentinel strings that only exist in demo data — with
   real published docs both rails would silently disappear. Now: demo keeps its
   sentinel behavior unchanged; real data derives "latest additions" from
   `_createdAt` (newest 12) and "featured works" from an optional `featured`
   boolean (`coalesce`-safe — the rail hides until task 03 adds the field to
   the schema, then lights up with no further code change). Query now also
   projects `featured` and `"createdAt": _createdAt`. Why me: 1700-line
   fragile file with a deploy-history of silent breakage; the fix had to be
   minimal, all-or-nothing aware (demo and real data never mix), and
   forward-compatible with a schema field that doesn't exist yet.

4. **Event cover-image pinning** (`lib/sanity.ts`): the Studio has always shown
   editors an `isPoster` checkbox on event images, but the site never queried
   it — `images[0]` after the merge always won, so editors had no way to
   control an event's thumbnail/OG image. `EVENT_FIELDS` now projects
   `{url, isPoster}` per upload and `toSanityEvent` orders poster-flagged
   uploads first (stable within groups) before the legacy/JSON image merge and
   dedup. Every consumer (listings, event pages, OG images, search) flows
   through `toSanityEvent`, so one change covers the site. Why me: the image
   pipeline merges three sources with junk-filtering, aliasing, and
   two-key dedup — reordering it wrong would quietly reshuffle 218 event
   pages' imagery.

---

## Sequencing

**Before email lands (~1 month) — must be true:**
- Task 02 (centralize contact addresses into `lib/contacts.ts`) is done, so the
  cutover to sales@/museum@/residency@/press@ is a one-file edit instead of a
  13-file hunt. Do this *now*; it's small and it de-risks the cutover.
- Decide the retreat routing: `dave.a.willis@gmail.com` must not survive the
  cutover on a public page (fold into task 02 acceptance).
- Deploy this session's fixes (commit + push + `npm run deploy`) so the
  homepage and canonicals are live and indexed *before* funders start looking.

**Before the funding push — must be true:**
- Homepage + canonicals live and re-crawled (submit sitemap in Search Console
  after deploy; the root URL is newly indexable).
- a.Farm surfaces are credibility-clean: institutional addresses only, task 03
  (featured field) + task 04 (deliberate museum go-live) done *if* real museum
  locations are part of the pitch; press updatable without a developer
  (task 06) so coverage from the push can be posted same-day.
- Nav cleanup (task 07) — funders will click around; the flat 18-item nav is
  the weakest first impression left after the homepage fix.
- Contrast sweep (task 08) — accessibility reads as professionalism to
  university and foundation reviewers, some of whom audit for it.

**Before freelance sales staff — must be true:**
- Task 01 (inquiry capture endpoint): inquiries must land somewhere a
  non-director can see, triage, and own — Sanity `inquiry` docs + the shared
  inbox, not a personal Gmail. This is the single hardest prerequisite; start
  it as soon as the Workspace addresses exist.
- Task 05 (pricelist gate decision): either a real Worker gate with a
  per-person credential story, or an explicit "the password is ceremony"
  memo to the team. Don't let freelancers assume protection that isn't there.
- Studio access roles reviewed: the sales actions (invoice, record payment)
  are editor-accessible — confirm freelancers get editor, not admin (the
  Studio config already gates delete to admins).

**Can wait (post-expansion):**
- Native-app query extraction (finding 9, flag 1) — until the app project starts.
- `studios-data.json` migration (ISSUE-007), JSON badge-flag retirement
  (ISSUE-006), shared UI primitives, `titleVi` rendering on the museum map.
- Generalizing contract generation beyond works — wait for the lawyer's text,
  then land it in `consignmentClauses.ts` with a `subject` abstraction.
