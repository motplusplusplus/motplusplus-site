/** "add to calendar" (E1): an .ics file and a Google Calendar link. Client-safe. */
export type CalEvent = { slug: string; title: string; start: string; end: string | null; location: string; description: string };

const ymd = (iso: string) => iso.replace(/-/g, '');
/** all-day events: DTEND is exclusive, so the day after the last day */
function nextDay(iso: string) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/** RFC 5545 lines fold at 75 octets */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = '', len = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (len + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; len = 0; }
    cur += ch; len += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function icsText(e: CalEvent, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MoT+++//motplusplusplus.com//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.slug}@motplusplusplus.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(e.start)}`,
    `DTEND;VALUE=DATE:${ymd(nextDay(e.end && e.end >= e.start ? e.end : e.start))}`,
    `SUMMARY:${esc(e.title)}`,
    ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
    `DESCRIPTION:${esc((e.description ? e.description + '\n\n' : '') + `https://motplusplusplus.com/events/${e.slug}/`)}`,
    `URL:https://motplusplusplus.com/events/${e.slug}/`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function downloadIcs(e: CalEvent) {
  const blob = new Blob([icsText(e)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${e.slug}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function googleCalUrl(e: CalEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: e.title,
    dates: `${ymd(e.start)}/${ymd(nextDay(e.end && e.end >= e.start ? e.end : e.start))}`,
    details: `${e.description ? e.description + '\n\n' : ''}https://motplusplusplus.com/events/${e.slug}/`,
    ...(e.location ? { location: e.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}
