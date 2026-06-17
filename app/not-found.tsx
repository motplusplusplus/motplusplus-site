import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <style>{`
        .not-found-wrap {
          min-height: calc(100vh - 60px);
        }
        @media (max-width: 768px) {
          .not-found-wrap {
            min-height: calc(100vh - 104px);
          }
        }
      `}</style>

      <div
        className="not-found-wrap"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: "560px" }}>
          <p
            style={{
              fontSize: "clamp(72px, 14vw, 120px)",
              fontWeight: 300,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "#111111",
              marginBottom: "32px",
            }}
          >
            404
          </p>

          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.8,
              color: "#444444",
              marginBottom: "16px",
            }}
          >
            The link you used cannot be found. Please try using our{" "}
            <Link
              href="/search"
              style={{ color: "#444444", borderBottom: "1px solid #aaaaaa" }}
            >
              search feature
            </Link>{" "}
            to find what you are looking for.
          </p>

          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.8,
              color: "#444444",
            }}
          >
            If anything is missing, please{" "}
            <Link
              href="/contact"
              style={{ color: "#444444", borderBottom: "1px solid #aaaaaa" }}
            >
              report it to us
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
