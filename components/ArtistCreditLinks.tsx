import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { ArtistCredit } from '@/lib/demoTrashItems';

type Props = {
  artists?: ArtistCredit[] | null;
  /** Single-artist fallback slug (trashItem.artistRef), used when artists[] is empty. */
  artistSlug?: string | null;
  fallback: string;
  style?: CSSProperties;
  linkStyle?: CSSProperties;
};

/** Renders linked artist name(s) from a trashItem's artists[] refs, joined "A & B" for
 *  collaborations. Falls back to a single artistSlug link (the primary artistRef) when
 *  artists[] is empty, then to the plain display-name string if neither resolves. */
export default function ArtistCreditLinks({ artists, artistSlug, fallback, style, linkStyle }: Props) {
  const resolved = (artists ?? []).filter((a): a is ArtistCredit => !!a?.name);

  if (resolved.length === 0) {
    if (artistSlug) {
      return (
        <span style={style}>
          <Link href={`/profiles/${artistSlug}`} style={{ color: 'inherit', textDecoration: 'underline', ...linkStyle }}>
            {fallback}
          </Link>
        </span>
      );
    }
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
