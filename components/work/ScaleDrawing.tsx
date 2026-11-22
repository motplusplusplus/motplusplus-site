import type { Dims } from '@/lib/dimensions';

const FIGURE_CM = 170;
const GAP_CM = 30;
const FIGURE_W = 50;

/** A plain rectangle at the work's stated size (not the photo, which is
 *  rarely cropped to the frame) beside a faint 170 cm figure, in one shared
 *  centimetre space. Rendered only when the dimensions parse. */
export default function ScaleDrawing({ dims }: { dims: Dims }) {
  const { w, h } = dims;
  const tall = Math.max(h, FIGURE_CM);
  const pad = tall * 0.04;
  const vbW = w + GAP_CM + FIGURE_W + pad * 2;
  const vbH = tall + pad * 2;
  const ground = pad + tall;
  const figX = pad + w + GAP_CM + FIGURE_W / 2;
  // the figure is drawn in a 170-unit box, shifted onto the ground line
  const figTop = ground - FIGURE_CM;
  const stroke = vbH / 160; // ~1px at the drawn size

  return (
    <figure className="mot-scale">
      <svg
        viewBox={`0 0 ${vbW.toFixed(1)} ${vbH.toFixed(1)}`}
        role="img"
        aria-label={`scale drawing: the work, ${Math.round(w)} by ${Math.round(h)} cm, beside a 170 cm person`}
        preserveAspectRatio="xMinYMax meet"
      >
        <rect
          x={pad} y={ground - h} width={w} height={h}
          className="mot-scale-work" strokeWidth={stroke}
        />
        <g transform={`translate(${figX} ${figTop})`} className="mot-scale-fig" strokeWidth={stroke}>
          <circle cx="0" cy="11" r="10.5" />
          <path d="M-8 24 L8 24 L21 31 L24 95 L18 95 L15 45 L14 98 L12 170 L3 170 L1 105 L-1 105 L-3 170 L-12 170 L-14 98 L-15 45 L-18 95 L-24 95 L-21 31 Z" />
        </g>
        <line x1="0" x2={vbW} y1={ground} y2={ground} className="mot-scale-ground" strokeWidth={stroke} />
      </svg>
      <figcaption className="mot-mono mot-quiet">to scale, beside a 170 cm figure</figcaption>
    </figure>
  );
}
