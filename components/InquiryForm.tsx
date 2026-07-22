"use client";

import { useState } from "react";
import { submitInquiry, type InquiryType } from "@/lib/inquiry";

type InquiryFormProps = {
  /** inquiry type — drives which Sanity fields are stored */
  type: InquiryType;
  /** address shown / used for the mailto fallback (a CONTACTS.* value) */
  recipient: string;
  /** pre-built mailto: URL used verbatim if the endpoint is unreachable */
  mailtoHref: string;
  /** trash: prefilled from the work */
  artworkTitle?: string;
  artworkId?: string;
  /** trigger button */
  buttonLabel?: string;
  buttonStyle?: React.CSSProperties;
};

// styling mirrors components/MailtoContactForm.tsx exactly
const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid #cccccc",
  padding: "14px 0",
  fontSize: "16px",
  fontWeight: 300,
  fontFamily: "inherit",
  background: "transparent",
  outline: "none",
  color: "#111111",
  appearance: "none",
  borderRadius: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#999999",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: "8px",
};

const fieldStyle: React.CSSProperties = { marginBottom: "28px" };

const defaultButtonStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#ffffff",
  backgroundColor: "#111111",
  padding: "10px 22px",
  textDecoration: "none",
  letterSpacing: "0.03em",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function InquiryForm({
  type,
  recipient,
  mailtoHref,
  artworkTitle,
  artworkId,
  buttonLabel = "inquire",
  buttonStyle,
}: InquiryFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // "" idle | "sent" recorded in Sanity | "mailto" fell back to email client
  const [result, setResult] = useState<"" | "sent" | "mailto">("");

  const close = () => {
    setOpen(false);
    // reset so a re-open starts clean
    setResult("");
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await submitInquiry({
      type,
      name,
      email,
      message,
      ...(artworkTitle ? { artworkTitle } : {}),
      ...(artworkId ? { artworkId } : {}),
    });
    setSubmitting(false);
    if (ok) {
      setResult("sent");
    } else {
      // endpoint unreachable — degrade to the pre-built mailto
      setResult("mailto");
      window.location.href = mailtoHref;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ ...defaultButtonStyle, ...buttonStyle }}
      >
        {buttonLabel}
      </button>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              maxWidth: "480px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "40px 32px",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="close"
              style={{
                position: "absolute",
                top: "14px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "22px",
                lineHeight: 1,
                color: "#999999",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ×
            </button>

            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              inquire{artworkTitle ? ` — ${artworkTitle}` : ""}
            </p>

            {result === "sent" ? (
              <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.7 }}>
                thank you — we&rsquo;ll be in touch.
              </p>
            ) : result === "mailto" ? (
              <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.7 }}>
                your email client should open with this inquiry pre-filled. if it doesn&rsquo;t
                open automatically, email us directly at {recipient}.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="full name"
                    style={inputStyle}
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email address"
                    style={inputStyle}
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="what would you like to know…"
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    fontSize: "15px",
                    fontWeight: 400,
                    color: "#ffffff",
                    backgroundColor: "#111111",
                    border: "none",
                    padding: "16px 40px",
                    cursor: submitting ? "default" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    fontFamily: "inherit",
                    display: "block",
                    width: "100%",
                  }}
                >
                  {submitting ? "sending…" : "send"}
                </button>

                <p style={{ fontSize: "12px", color: "#aaaaaa", lineHeight: 1.7, marginTop: "18px" }}>
                  or email directly at{" "}
                  <a href={mailtoHref} style={{ color: "#888888" }}>
                    {recipient}
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
