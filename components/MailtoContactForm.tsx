"use client";

import { useState } from "react";

type MailtoContactFormProps = {
  heading: string;
  recipient: string;
};

export default function MailtoContactForm({ heading, recipient }: MailtoContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = `${heading} — message from ${name}`;
    const body = [
      `name: ${name}`,
      `email: ${email}`,
      message ? `\n${message}` : null,
    ].filter((line) => line !== null).join("\n");

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setSubmitted(true);
  };

  const inputStyle = {
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
    appearance: "none" as const,
    borderRadius: 0,
  };

  const labelStyle = {
    fontSize: "11px",
    color: "#999999",
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: "8px",
  };

  const fieldStyle = { marginBottom: "28px" };

  return (
    <div>
      <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
        {heading}
      </p>

      {submitted ? (
        <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.7 }}>
          your email client should open with this message pre-filled. if it doesn&rsquo;t open
          automatically, email us directly at {recipient}.
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
              placeholder="what's this about…"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            style={{
              fontSize: "15px",
              fontWeight: 400,
              color: "#ffffff",
              backgroundColor: "#111111",
              border: "none",
              padding: "16px 40px",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "block",
              width: "100%",
            }}
          >
            send
          </button>
        </form>
      )}
    </div>
  );
}
