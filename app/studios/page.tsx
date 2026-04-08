import Link from "next/link";
import type { Metadata } from "next";
import { getAllStudios } from "@/lib/studios";
import { getArtist } from "@/lib/artists";

export const metadata: Metadata = {
  title: "Studios | MoT+++",
  description: "Artist studios associated with MoT+++, Ho Chi Minh City — spaces for making, hosting, and exchange.",
  openGraph: {
    title: "Studios | MoT+++",
    description: "Artist studios associated with MoT+++, Ho Chi Minh City — spaces for making, hosting, and exchange.",
  },
};

export default async function StudiosPage() {
  const allStudios = await getAllStudios();
  return (
    <>
      {/* hero */}
      <div
        style={{
          width: "100%",
          backgroundColor: "#111111",
          padding: "80px 24px 72px",
          borderBottom: "1px solid #1e1e1e",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: "16px",
            }}
          >
            studios
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", fontWeight: 300, maxWidth: "480px", lineHeight: 1.7 }}>
            spaces associated with MoT+++ — for making, hosting, and exchange in Ho Chi Minh City.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px 96px" }}>

        {/* studio grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1px",
            backgroundColor: "#e5e5e5",
            border: "1px solid #e5e5e5",
            marginBottom: "64px",
          }}
        >
          {allStudios.filter(s => !s.hidden).map((studio) => {
            const host = studio.hostSlug ? getArtist(studio.hostSlug) : null;
            const firstImage = studio.images[0] || null;

            return (
              <Link
                key={studio.slug}
                href={`/studios/${studio.slug}`}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "0",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* image or placeholder */}
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      backgroundColor: studio.active ? "#f5f5f5" : "#f0f0f0",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={studio.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
                          {studio.name.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* active/inactive badge */}
                    {!studio.active && (
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          fontSize: "9px",
                          letterSpacing: "0.1em",
                          color: "rgba(255,255,255,0.7)",
                          backgroundColor: "rgba(0,0,0,0.55)",
                          padding: "3px 8px",
                        }}
                      >
                        historical
                      </div>
                    )}
                  </div>

                  {/* card body */}
                  <div style={{ padding: "20px 20px 24px" }}>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: 400,
                        color: studio.active ? "#111111" : "#888888",
                        marginBottom: "6px",
                        lineHeight: 1.25,
                      }}
                    >
                      {studio.name}
                    </p>

                    {host && (
                      <p style={{ fontSize: "12px", color: "#999999", marginBottom: "4px" }}>
                        {host.name}
                      </p>
                    )}

                    {studio.neighborhood && (
                      <p style={{ fontSize: "11px", color: "#bbbbbb", letterSpacing: "0.04em", marginTop: "8px" }}>
                        {studio.neighborhood}
                      </p>
                    )}

                    {!studio.active && (
                      <p style={{ fontSize: "11px", color: "#bbbbbb", marginTop: "8px", lineHeight: 1.5 }}>
                        no longer active
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </>
  );
}
