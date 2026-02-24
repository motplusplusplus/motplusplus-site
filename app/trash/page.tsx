const pieces = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: `work title ${i + 1}`,
  artist: "artist name",
  medium: "medium",
  year: "2024",
}));

export default function TrashPage() {
  return (
    <>
      {/* hero */}
      <div
        style={{
          width: "100%",
          height: "45vh",
          minHeight: "300px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.08em" }}>
          +1 trash — hero image
        </p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

        {/* heading */}
        <div style={{ marginBottom: "56px" }}>
          <h1
            style={{
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "20px",
            }}
          >
            +1 trash
          </h1>
          <p style={{ fontSize: "15px", color: "#666666", maxWidth: "520px", lineHeight: 1.8 }}>
            works available for acquisition — art, objects, and things that have
            passed through the hands of artists in the mot+++ orbit. each piece
            is offered as-is.
          </p>
        </div>

        {/* grid */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "48px 32px",
            }}
          >
            {pieces.map((piece) => (
              <div key={piece.id}>
                {/* image */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4/3",
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #e5e5e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
                    image {piece.id}
                  </p>
                </div>

                {/* meta */}
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 400,
                    color: "#111111",
                    marginBottom: "4px",
                    lineHeight: 1.3,
                  }}
                >
                  {piece.title}
                </p>
                <p style={{ fontSize: "13px", color: "#888888", marginBottom: "4px" }}>
                  {piece.artist}
                </p>
                <p style={{ fontSize: "12px", color: "#aaaaaa", marginBottom: "20px" }}>
                  {piece.medium}, {piece.year}
                </p>

                {/* inquire */}
                <a
                  href={`mailto:motplusplusplus@gmail.com?subject=${encodeURIComponent(`+1 trash inquiry — ${piece.title}`)}&body=${encodeURIComponent(`i'm interested in the following piece:\n\ntitle: ${piece.title}\nartist: ${piece.artist}\n\n---\n\n[your message here]`)}`}
                  style={{
                    fontSize: "12px",
                    color: "#111111",
                    border: "1px solid #cccccc",
                    padding: "8px 16px",
                    display: "inline-block",
                  }}
                >
                  inquire
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
