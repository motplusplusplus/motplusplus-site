import type { Entry } from '@/lib/profileEntries';
import { CImg, TypeCard } from './Pieces';
import Highlight from '@/components/ui/Highlight';

export default function PersonTile({ e, terms = [], priority = false }: { e: Entry; terms?: string[]; priority?: boolean }) {
  return (
    <a className="c-tile" href={`/profiles/${e.slug}/`}>
      {e.tile
        ? <CImg img={e.tile} sizes="(min-width: 1100px) 23vw, (min-width: 720px) 30vw, 46vw" alt="" priority={priority} />
        : <TypeCard name={e.name} facts={e.facts} />}
      <span className="c-tile-name"><Highlight text={e.name} terms={terms} /></span>
      <span className="c-tile-meta c-mono c-quiet">{e.facts || ' '}</span>
    </a>
  );
}
