"use client";

import { useEffect, useState } from "react";

const buttonStyle: React.CSSProperties = {
  fontSize: "12px",
  border: "1px solid #cccccc",
  padding: "8px 18px",
  letterSpacing: "0.03em",
  color: "#333333",
  background: "none",
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function ShareActions({ url, title, text }: { url: string; title: string; text?: string }) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // feature-detect after mount so the static HTML and hydration agree
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // user cancelled share sheet, ignore
    }
  }

  async function handleCopy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand("copy");
        } catch {
          // silently ignore, nothing more we can do
        }
        document.body.removeChild(textarea);
      }
      setCopied(true);
    } catch {
      // clipboard write failed silently, no fallback available
    }
  }

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      {canShare && (
        <button type="button" onClick={handleShare} style={buttonStyle}>
          share
        </button>
      )}
      <button
        type="button"
        onClick={handleCopy}
        style={{ ...buttonStyle, minWidth: "96px", textAlign: "center", pointerEvents: copied ? "none" : "auto" }}
      >
        {copied ? "copied" : "copy link"}
      </button>
    </div>
  );
}
