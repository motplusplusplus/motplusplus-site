"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
};

// Fades content in (with a slight upward drift) the first time it scrolls
// into view. Mirrors the scroll-reveal feel of the original carrd retreat
// page while keeping the site's understated motion language — opacity and
// transform only, no scale or parallax.
export default function Reveal({ children, delay = 0, style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.9s ease ${delay}s, transform 0.9s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
