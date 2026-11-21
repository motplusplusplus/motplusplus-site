/** Parses the free-text trashItem.dimensions field ("24,5x19,5 cm",
 *  "210mm x 297mm", "120 x 120 cm x 3 cm each", "approx. 41 x 37 x 22 cm")
 *  into centimetres, and formats it as "120 × 80 cm (47¼ × 31½ in)".
 *
 *  Convention: the first figure is width, the second height (how the
 *  existing records read: "210mm x 297mm" is A4 portrait). Anything that is
 *  not plainly a size (durations, "dimensions variable", "various") returns
 *  null, and callers fall back to showing the original text. */

export type Dims = { w: number; h: number; d?: number };

const UNIT_TO_CM: Record<string, number> = { mm: 0.1, cm: 1, m: 100, in: 2.54 };

export function parseDimensions(raw: string | null | undefined): Dims | null {
  if (!raw) return null;
  let s = raw.toLowerCase().trim();
  if (/duration|variable|various|varies|\d\s*['′’]|min\b|sec\b/.test(s)) return null;
  s = s
    .replace(/\([^)]*\)/g, ' ')          // "(x9 drawings)"
    .replace(/\b(approx|approximately|ca|circa)\b\.?/g, ' ')
    .replace(/\b(each|overall|framed|unframed)\b/g, ' ')
    .replace(/(\d),(\d)/g, '$1.$2')       // decimal commas
    .replace(/[×✕*]/g, 'x');
  const parts = s.split(/\s*x\s*/).map(p => p.trim()).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return null;

  const nums: number[] = [];
  const units: (string | undefined)[] = [];
  for (const p of parts) {
    const m = p.match(/^(\d+(?:\.\d+)?)\s*(mm|cm|m|in)?\.?$/);
    if (!m) return null;
    nums.push(parseFloat(m[1]));
    units.push(m[2]);
  }
  // A unit written once ("120 x 80 cm") applies to the bare figures; no unit
  // at all ("120x90x4") is read as cm, the house default.
  const fallback = [...units].reverse().find(Boolean) ?? 'cm';
  const cm = nums.map((n, i) => n * UNIT_TO_CM[units[i] ?? fallback]);
  if (cm.some(v => !(v > 0) || v > 100000)) return null;
  return cm.length === 3 ? { w: cm[0], h: cm[1], d: cm[2] } : { w: cm[0], h: cm[1] };
}

function fmtCm(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

const QUARTERS = ['', '¼', '½', '¾'];

/** Inches to the nearest quarter, e.g. 47¼. */
function fmtInches(inches: number): string {
  const q = Math.round(inches * 4);
  const whole = Math.floor(q / 4);
  const frac = QUARTERS[q % 4];
  return whole === 0 && frac ? frac : `${whole}${frac}`;
}

/** Feet and inches for big works, e.g. "11 ft 2 in". */
function fmtFeet(inches: number): string {
  const total = Math.round(inches);
  const ft = Math.floor(total / 12);
  const inch = total % 12;
  return inch ? `${ft} ft ${inch} in` : `${ft} ft`;
}

export function formatImperial(d: Dims): string {
  const vals = [d.w, d.h, ...(d.d !== undefined ? [d.d] : [])].map(v => v / 2.54);
  const big = Math.max(...vals) >= 100;
  if (!big) return `${vals.map(fmtInches).join(' × ')} in`;
  // past ~8 ft, inches stop being readable: feet for the long sides
  return vals.map(v => (v < 12 ? `${fmtInches(v)} in` : fmtFeet(v))).join(' × ');
}

/** "120 × 80 cm (47¼ × 31½ in)", or the original text when unparseable. */
export function formatDimensions(raw: string | null | undefined): string {
  const d = parseDimensions(raw);
  if (!d) return (raw ?? '').trim();
  const cm = [d.w, d.h, ...(d.d !== undefined ? [d.d] : [])].map(fmtCm).join(' × ');
  const approx = /\b(approx|approximately|ca|circa)\b/i.test(raw ?? '') ? 'approx. ' : '';
  return `${approx}${cm} cm (${formatImperial(d)})`;
}
