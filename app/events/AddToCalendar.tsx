'use client';
import { downloadIcs, googleCalUrl, type CalEvent } from '@/lib/ics';

/** E1: an .ics download and a Google Calendar link. */
export default function AddToCalendar({ e }: { e: CalEvent }) {
  return (
    <div className="c-now-actions c-mono">
      <button type="button" className="mot-link" onClick={() => downloadIcs(e)}>add to calendar (.ics)</button>
      <a className="mot-link" href={googleCalUrl(e)} target="_blank" rel="noopener noreferrer">google calendar</a>
    </div>
  );
}
