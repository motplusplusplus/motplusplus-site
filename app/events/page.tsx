import { Suspense } from "react";
import { getAllEvents, getAllEventsFromJson } from "@/lib/sanity";
import { getListingEvents } from "@/lib/events";
import { EventsShell } from "./EventsShell";

export default async function EventsPage() {
  // Sanity is the source of truth; fill gaps with events-data.json entries
  const [sanityEvents, jsonEvents] = await Promise.all([
    getAllEvents(),
    Promise.resolve(getAllEventsFromJson()),
  ]);
  const sanitySlugSet = new Set(sanityEvents.map(e => e.slug));
  const jsonOnly = jsonEvents.filter(e => !sanitySlugSet.has(e.slug));
  const events = getListingEvents([...sanityEvents, ...jsonOnly]);
  return (
    <Suspense fallback={<div style={{ padding: "64px 24px" }}>loading...</div>}>
      <EventsShell events={events} />
    </Suspense>
  );
}
