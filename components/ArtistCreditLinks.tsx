import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { ArtistCredit } from '@/lib/demoTrashItems';

type Props = {
  artists?: ArtistCredit[] | null;
  fallback: string;
  style?: CSSProperties;
  linkStyle?: CSSProperties;
};

/** Renders linked artist name(s) from a trashItem's artists[] refs, joined "A & B" for
 *  collaborations. Falls back to the plain display-name string when artists[] is empty
 *  or every ref is unresolved (dangling reference, or not yet linked in Sanity). */
export default function ArtistCreditLinks({ artists, fallback, style, linkStyle }: Props) {
  const resolved = (artists ?? []).filter((a): a is ArtistCredit => !!a?.name);

  if (resolved.length === 0) {
    return <span style={style}>{fallback}</span>;
  }

  return (
    <span style={style}>
      {resolved.map((a, i) => (
        <span key={a._id ?? a.name}>
          {i > 0 && (i === resolved.length - 1 ? ' & ' : ', ')}
          {a.slug ? (
            <Link href={`/profiles/${a.slug}`} style={{ color: 'inherit', textDecoration: 'underline', ...linkStyle }}>
              {a.name}
            </Link>
          ) : (
            a.name
          )}
        </span>
      ))}
    </span>
  );
}
