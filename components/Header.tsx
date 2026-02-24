"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const primaryNav = [
  { label: "+1 museum by any other name", href: "/museum" },
  { label: "+a. farm", href: "/afarm" },
  { label: "+1 trash", href: "/trash" },
  { label: "events", href: "/events" },
];

const dropdownSections = [
  {
    heading: "+1 programs",
    items: [
      { label: "+1 museum by any other name", href: "/museum" },
      { label: "+a. farm", href: "/afarm" },
      { label: "+1 trash", href: "/trash" },
      { label: "+1 contemporary project", href: "/contemporary" },
      { label: "+1 nice place for experimentation", href: "/afarm" },
      { label: "+1 art advisory", href: "/advisory" },
      { label: "+1 residency", href: "/afarm" },
      { label: "mot+sound", href: "/sound" },
      { label: "mot+ performance", href: "/performance" },
    ],
  },
  {
    heading: "organization",
    items: [
      { label: "mot+++ collective", href: "/collective" },
      { label: "about", href: "/about" },
      { label: "contact", href: "/contact" },
    ],
  },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (menuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen(true);
  };

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 24px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/motpluspluspluslogo.jpg"
              alt="MoT+++"
              width={120}
              height={40}
              style={{ objectFit: "contain", objectPosition: "left" }}
              unoptimized
            />
          </Link>

          {/* right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            {/* primary tabs — hidden on mobile */}
            <nav
              style={{ display: "flex", gap: "28px", alignItems: "center" }}
              className="hidden-mobile"
            >
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: "15px",
                    fontWeight: 400,
                    letterSpacing: "0.01em",
                    color: "#111111",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* search icon */}
            <button
              onClick={openSearch}
              aria-label="search"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                color: "#111111",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="6.5" cy="6.5" r="5" />
                <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" />
              </svg>
            </button>

            {/* hamburger */}
            <button
              onClick={() => {
                setSearchOpen(false);
                setMenuOpen(!menuOpen);
              }}
              aria-label="menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: "22px",
                  height: "1px",
                  backgroundColor: "#111111",
                  transition: "transform 0.2s, opacity 0.2s",
                  transform: menuOpen
                    ? "translateY(6px) rotate(45deg)"
                    : "none",
                }}
              />
              <span
                style={{
                  display: "block",
                  width: "22px",
                  height: "1px",
                  backgroundColor: "#111111",
                  transition: "opacity 0.2s",
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  display: "block",
                  width: "22px",
                  height: "1px",
                  backgroundColor: "#111111",
                  transition: "transform 0.2s, opacity 0.2s",
                  transform: menuOpen
                    ? "translateY(-6px) rotate(-45deg)"
                    : "none",
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* search overlay */}
      {searchOpen && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            zIndex: 40,
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e5e5",
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#999999"
              strokeWidth="1.5"
              style={{ flexShrink: 0 }}
            >
              <circle cx="6.5" cy="6.5" r="5" />
              <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="search"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "16px",
                fontWeight: 300,
                color: "#111111",
                fontFamily: "inherit",
                background: "transparent",
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchOpen(false);
              }}
            />
            <button
              onClick={() => setSearchOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                color: "#999999",
                fontFamily: "inherit",
              }}
            >
              close
            </button>
          </div>
        </div>
      )}

      {/* dropdown menu overlay */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            backgroundColor: "#ffffff",
            overflowY: "auto",
          }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              padding: "48px 24px 64px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "48px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {dropdownSections.map((section) => (
              <div key={section.heading}>
                <p
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    color: "#999999",
                    marginBottom: "16px",
                  }}
                >
                  {section.heading}
                </p>
                <nav
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        fontSize: "20px",
                        fontWeight: 300,
                        color: "#111111",
                        lineHeight: 1.2,
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* mobile primary nav row */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          right: 0,
          zIndex: 49,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e5e5",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch" as const,
          scrollbarWidth: "none" as const,
        }}
        className="mobile-nav-row"
      >
        <div
          style={{
            display: "flex",
            gap: "0",
            padding: "0 16px",
            whiteSpace: "nowrap",
          }}
        >
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "inline-block",
                fontSize: "13px",
                fontWeight: 400,
                color: "#111111",
                padding: "11px 16px 11px 0",
                marginRight: "16px",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* spacer so content doesn't sit under fixed header */}
      <div className="header-spacer" />

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-nav-row { display: block !important; }
          .mobile-nav-row::-webkit-scrollbar { display: none; }
          .header-spacer { height: 104px; }
        }
        @media (min-width: 769px) {
          .mobile-nav-row { display: none !important; }
          .header-spacer { height: 60px; }
        }
      `}</style>
    </>
  );
}
