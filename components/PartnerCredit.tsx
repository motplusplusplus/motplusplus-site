export interface EventPartner {
  name: string;
  url?: string | null;
  role: string;
}

/**
 * Organizations credited on an event — funder, venue, co-manager, lender, collaborator.
 * Renders below the description/bio, only when non-empty. No public partner page exists:
 * the name links straight to the partner's own site when one is on file, plain text when
 * it isn't (some partners are defunct — the dead link stays, it's a historical fact).
 */
export default function PartnerCredit({ partners }: { partners: EventPartner[] }) {
  if (partners.length === 0) return null;
  return (
    <div style={{ marginBottom: "80px" }}>
      <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "16px" }}>
        partners
      </p>
      <p style={{ fontSize: "15px", fontWeight: 300, color: "#444444", lineHeight: 1.7 }}>
        {partners.map((p, i) => (
          <span key={p.name}>
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}
              >
                {p.name}
              </a>
            ) : (
              p.name
            )}
            {i < partners.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}
