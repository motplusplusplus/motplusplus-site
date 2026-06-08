"use client";

import { useState } from "react";

type CollapsibleProps = {
  label: string;
  openLabel?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export default function Collapsible({ label, openLabel, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          color: "#888888",
          letterSpacing: "0.04em",
          background: "none",
          border: "none",
          padding: 0,
          marginBottom: open ? "28px" : 0,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <span>{open ? (openLabel ?? label) : label}</span>
        <span style={{
          display: "inline-block",
          fontSize: "10px",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.3s ease",
        }}>
          ↓
        </span>
      </button>
      <div style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.4s ease",
      }}>
        <div style={{ overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
