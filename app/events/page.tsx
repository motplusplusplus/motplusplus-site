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
  return <EventsShell events={events} />;
}
