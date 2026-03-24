"use client";
import { useState } from "react";

export default function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          opacity: 0.78, cursor: "zoom-in",
        }}
      />
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain" }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
