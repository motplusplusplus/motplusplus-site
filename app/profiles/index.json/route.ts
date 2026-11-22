import { getProfileEntries } from '@/lib/profileEntries';

export const dynamic = 'force-static';

/** Every person, for browse and search on /profiles (fetched only when someone filters). */
export async function GET() {
  return Response.json(await getProfileEntries());
}
