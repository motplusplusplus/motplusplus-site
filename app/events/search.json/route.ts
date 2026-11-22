import { getCatalogue } from '@/lib/catalogue';
import { searchText } from '@/lib/eventEntry';

export const dynamic = 'force-static';

/** slug → folded search text for every listed event; fetched the first time someone searches. */
export async function GET() {
  const c = await getCatalogue();
  return Response.json(Object.fromEntries(c.listed.map(e => [e.slug, searchText(e)])));
}
