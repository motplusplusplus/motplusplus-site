import { getAllEvents } from "@/lib/sanity";
import { getListingEvents } from "@/lib/events";
import { EventsShell } from "./EventsShell";

export default async function EventsPage() {
  const all = await getAllEvents();
  const events = getListingEvents(all);
  return <EventsShell events={events} />;
}
