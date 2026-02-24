import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #e5e5e5",
        marginTop: "120px",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 32px",
            fontSize: "12px",
            color: "#111111",
          }}
        >
          <Link href="/museum">+1 museum by any other name</Link>
          <Link href="/afarm">+a.farm</Link>
          <Link href="/trash">+1 trash</Link>
          <Link href="/events">events</Link>
          <Link href="/collective">mot+++ collective</Link>
          <Link href="/about">about</Link>
          <Link href="/contact">contact</Link>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 24px",
            fontSize: "12px",
            color: "#999999",
          }}
        >
          <a
            href="https://instagram.com/motplusplusplus"
            target="_blank"
            rel="noopener noreferrer"
          >
            instagram
          </a>
          <a href="mailto:motplusplusplus@gmail.com">
            motplusplusplus@gmail.com
          </a>
        </div>

        <p style={{ fontSize: "11px", color: "#cccccc" }}>
          MoT+++, la astoria tower 2, 383 nguyễn duy trinh, hồ chí minh
        </p>
      </div>
    </footer>
  );
}
