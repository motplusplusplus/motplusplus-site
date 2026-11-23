import type { Entry } from '@/lib/profileEntries';
import { CImg, TypeCard } from './Pieces';
import Highlight from '@/components/ui/Highlight';

const SIZES = '(min-width: 1100px) 23vw, (min-width: 720px) 30vw, 46vw';
// .c-tiles-sm: 3 / 4 / 6 / 8 columns
const SIZES_SM = '(min-width: 1280px) 150px, (min-width: 1000px) 16vw, (min-width: 600px) 24vw, 32vw';

export default function PersonTile({ e, terms = [], priority = false, small = false }: { e: Entry; terms?: string[]; priority?: boolean; small?: boolean }) {
  return (
    <a className="c-tile" href={`/profiles/${e.slug}/`}>
      {e.tile
        ? <CImg img={e.tile} sizes={small ? SIZES_SM : SIZES} widths={small ? [160, 240, 320, 480] : undefined} minFill={small ? 160 : undefined} alt="" priority={priority} />
        : <TypeCard name={e.name} facts={e.facts} />}
      <span className="c-tile-name"><Highlight text={e.name} terms={terms} /></span>
      <span className="c-tile-meta c-mono c-quiet">{e.facts || ' '}</span>
    </a>
  );
}
