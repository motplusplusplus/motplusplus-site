import Link from "next/link";
// No prefetch (2026-11-22): on short pages the footer is in view at load, and
// prefetching every section pulled ~800 KB on a phone (see Header.tsx).
import { CONTACTS } from "@/lib/contacts";
import NewsletterForm from "@/components/NewsletterForm";

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
          <Link prefetch={false} href="/museum">+1 museum by any other name</Link>
          <Link prefetch={false} href="/afarm">+a.Farm</Link>
          <Link prefetch={false} href="/trash">+1 trash</Link>
          <Link prefetch={false} href="/events">events</Link>
          <Link prefetch={false} href="/collective">MoT+++ collective</Link>
          <Link prefetch={false} href="/about">about</Link>
          <Link prefetch={false} href="/press">press</Link>
          <Link prefetch={false} href="/contact">contact</Link>
        </div>

        <NewsletterForm />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 24px",
            fontSize: "12px",
            color: "var(--mot-text-quiet, #767676)",
          }}
        >
          <a
            href="https://instagram.com/motplusplusplus"
            target="_blank"
            rel="noopener noreferrer"
          >
            instagram
          </a>
          <a href={`mailto:${CONTACTS.general}`}>
            {CONTACTS.general}
          </a>
        </div>

        <p style={{ fontSize: "11px", color: "var(--mot-text-quiet, #767676)" }}>
          © MoT+++ {new Date().getFullYear()}
        </p>

      </div>
    </footer>
  );
}
