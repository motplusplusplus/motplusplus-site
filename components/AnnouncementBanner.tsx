import Link from "next/link";

type AnnouncementBannerProps = {
  text: string;
  linkLabel: string;
  href: string;
};

// To remove an announcement, delete the <AnnouncementBanner ... /> usage on the page —
// this component is intentionally stateless so it can be dropped in or pulled out per page.
export default function AnnouncementBanner({ text, linkLabel, href }: AnnouncementBannerProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid #e5e5e5",
        backgroundColor: "#fafafa",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px 16px",
          textAlign: "center",
          fontSize: "13px",
          color: "#444444",
        }}
      >
        <span>{text}</span>
        <Link href={href} style={{ color: "#111111", fontWeight: 400 }}>
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}
