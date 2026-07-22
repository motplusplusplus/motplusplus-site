'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { shuffleArray } from '@/lib/shuffle';

export type CollectiveMember = {
  slug: string;
  name: string;
  origin: string;
  website: string;
  bio: string;
  portrait: string;
  images: string[];
};

/** Renders the member index + full profiles in a randomized order, reshuffled
 *  on every page load. Static export bakes a fixed array order into the HTML
 *  at build time, so the shuffle happens here (client-side, after mount) --
 *  starts in the original (source-file) order for the initial static render,
 *  then re-orders once mounted, matching the same shuffle-on-mount pattern
 *  already used on /trash (TrashPageShell.tsx). */
export default function CollectiveMembers({ members }: { members: CollectiveMember[] }) {
  const [ordered, setOrdered] = useState(members);

  useEffect(() => {
    setOrdered(shuffleArray(members));
  }, [members]);

  return (
    <>
      {/* member index */}
      <div
        style={{
          borderTop: "1px solid #e5e5e5",
          paddingTop: "24px",
          marginBottom: "64px",
          display: "flex",
          flexWrap: "wrap",
          gap: "0 16px",
        }}
      >
        {ordered.map((m) => (
          <a
            key={m.name}
            href={`#${m.name.toLowerCase().replace(/\s+/g, "-")}`}
            style={{ fontSize: "15px", color: "#767676", fontWeight: 300, padding: "10px 8px" }}
          >
            {m.name}
          </a>
        ))}
      </div>

      {/* member profiles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {ordered.map((member) => (
          <div
            key={member.name}
            id={member.name.toLowerCase().replace(/\s+/g, "-")}
            style={{
              borderTop: "1px solid #e5e5e5",
              paddingTop: "64px",
              paddingBottom: "64px",
            }}
          >
            {/* name + origin */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "48px",
                marginBottom: "48px",
                alignItems: "start",
              }}
            >
              {/* portrait */}
              <div>
                {member.portrait ? (
                  <img
                    src={member.portrait}
                    alt={member.name}
                    style={{
                      width: "100%",
                      aspectRatio: "1/1",
                      objectFit: "cover",
                      display: "block",
                      marginBottom: "16px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1/1",
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #e5e5e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.06em" }}>portrait</p>
                  </div>
                )}
                <p style={{ fontSize: "12px", color: "#767676", marginBottom: "4px" }}>{member.origin}</p>
                <a
                  href={`https://${member.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "12px", color: "#767676" }}
                >
                  {member.website}
                </a>
              </div>

              {/* bio */}
              <div>
                <div style={{ marginBottom: "20px", display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: 300,
                      lineHeight: 1.2,
                      color: "#111111",
                    }}
                  >
                    {member.name}
                  </h2>
                  <Link
                    href={`/profiles/${member.slug}`}
                    style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.06em" }}
                  >
                    artist profile ↗
                  </Link>
                </div>
                <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444" }}>
                  {member.bio}
                </p>
              </div>
            </div>

            {/* work images */}
            {member.images.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "12px",
                }}
              >
                {member.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${member.name} — work ${i + 1}`}
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
