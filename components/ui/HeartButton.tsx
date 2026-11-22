'use client';
import { readWall, toggleWall, type WallId } from '@/lib/wall';
import { useStored } from '@/lib/useStore';
import { track } from '@/lib/track';
import { THIN } from '@/components/cat/Pieces';

/** Thin heart: saves to the personal wall (D3). Shortcut h (components/global/Shortcuts). */
export default function HeartButton({ id, label }: { id: WallId; label: string }) {
  const on = useStored(() => readWall().includes(id), 'mot:wall-change', false);
  return (
    <button
      type="button"
      className="mot-icon-btn c-heart"
      data-wall-id={id}
      aria-pressed={on}
      aria-label={on ? `remove ${label} from my wall` : `save ${label} to my wall`}
      data-label={on ? 'saved to my wall' : 'save to my wall'}
      onClick={() => { if (toggleWall(id)) track('wall-save'); }}
    >
      {THIN.heart}
    </button>
  );
}
