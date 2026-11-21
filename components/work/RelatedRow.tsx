'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WorkImg from './WorkImg';
import { navigateWithMorph } from './morph';
import type { Work } from '@/lib/trashWork';

/** Swipeable row at the foot of a work page: more by the same artist first,
 *  then works of the same type, so a work page is never a dead end. */
export default function RelatedRow({ title, works }: { title: string; works: Work[] }) {
  const router = useRouter();
  if (works.length === 0) return null;
  return (
    <section className="wp-related" aria-label={title}>
      <h2 className="mot-mono mot-label">{title}</h2>
      <ul className="wp-related-row">
        {works.map(w => (
          <li key={w._id}>
            <Link
              href={`/trash/${w.slug}/`}
              prefetch={false}
              className="wp-related-card"
              onClick={e => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                const img = (e.currentTarget as HTMLElement).querySelector<HTMLImageElement>('img:not(.mot-img-ph)');
                navigateWithMorph(router.push, `/trash/${w.slug}/`, img);
              }}
            >
              {w.images[0] && (
                <WorkImg img={w.images[0]} widths={[240, 400, 600]} sizes="200px" defaultWidth={400} />
              )}
              <span className="wp-related-cap">
                <span className="wp-related-title">{w.title}</span>
                <span className="mot-mono mot-quiet">
                  {w.artist}{w.year ? `, ${w.year}` : ''}
                  {w.sold && <><span className="mot-dot" aria-hidden="true" /><span className="mot-sr">, sold</span></>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
