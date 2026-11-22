import { photoCreditText } from "@/lib/photoCredit";

/** Small gray "photo: <name>" caption line. Renders nothing without a name.
 *  Server- and client-safe (no hooks). */
export default function PhotoCredit({
  name,
  onDark,
  style,
}: {
  name?: string | null;
  onDark?: boolean;
  style?: React.CSSProperties;
}) {
  const text = photoCreditText(name);
  if (!text) return null;
  return (
    <span
      style={{
        display: "block",
        fontSize: "11px",
        letterSpacing: "0.04em",
        fontWeight: 300,
        color: onDark ? "rgba(255,255,255,0.75)" : "var(--mot-text-quiet, #767676)",
        ...style,
      }}
    >
      {text}
    </span>
  );
}
