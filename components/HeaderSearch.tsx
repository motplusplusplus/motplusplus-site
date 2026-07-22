"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  loadSearchIndex,
  searchIndex,
  type SearchResult,
} from "@/lib/searchIndex";

// Typeahead behaviour
const MIN_CHARS = 2; // dropdown opens at 2+ characters
const DEBOUNCE_MS = 200; // input debounce
// Result cap. Rows are ~50px tall (badge + title + 12px padding). 7 rows ≈ 350px,
// plus the input row (~60px) and the "see all" footer (~44px) keeps the whole
// overlay under ~460px — comfortably within a short mobile viewport below the
// 60px header without the dropdown itself needing to scroll. Profiles are ranked
// first, so the cap never starves them.
const MAX_RESULTS = 7;

export default function HeaderSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const reqToken = useRef(0); // guards against out-of-order async results

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false); // dropdown visibility
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState(false);

  // Focus the input on open. Delayed so the iOS keyboard doesn't pop during the
  // ghost-click window (mirrors the prior Header behaviour).
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  // Reset the dropdown immediately when the query drops below the threshold,
  // so clearing feels instant (no debounce wait).
  const onChangeQuery = (v: string) => {
    setQuery(v);
    if (v.trim().length < MIN_CHARS) {
      reqToken.current++; // cancel any in-flight result from a longer query
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  // Debounced query → load index (once) and compute results. All state updates
  // happen inside the timer callback (never synchronously in the effect body).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_CHARS) return;

    const token = ++reqToken.current;
    const timer = setTimeout(() => {
      loadSearchIndex()
        .then((docs) => {
          if (token !== reqToken.current) return; // a newer keystroke won
          setResults(searchIndex(docs, trimmed, MAX_RESULTS));
          setError(false);
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch(() => {
          if (token !== reqToken.current) return;
          setResults([]);
          setError(true);
          setOpen(true);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const goToSearchPage = () => {
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    onClose();
  };

  const goTo = (href: string) => {
    router.push(href);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Tab") {
      // Tab closes the dropdown but lets focus move on naturally.
      setOpen(false);
      return;
    }
    if (!open) {
      if (e.key === "Enter" && query.trim()) goToSearchPage();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        goTo(results[activeIndex].href);
      } else if (query.trim()) {
        goToSearchPage();
      }
    }
  };

  const showDropdown = open && query.trim().length >= MIN_CHARS;

  return (
    <>
      {/* backdrop — tap outside to dismiss (covers everything below the bar) */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 51,
          background: "transparent",
        }}
      />

      {/* search bar + dropdown */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          right: 0,
          zIndex: 52,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e5e5",
          padding: "20px 24px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* input row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls="header-search-listbox"
              aria-autocomplete="list"
              placeholder="search events, artists..."
              value={query}
              onChange={(e) => onChangeQuery(e.target.value)}
              onKeyDown={onKeyDown}
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
            />
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                color: "#767676",
                fontFamily: "inherit",
              }}
            >
              close
            </button>
          </div>

          {/* dropdown */}
          {showDropdown && (
            <div
              id="header-search-listbox"
              role="listbox"
              style={{
                marginTop: "16px",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              {error && (
                <p style={{ fontSize: "13px", color: "#767676", padding: "16px 0" }}>
                  search is unavailable right now — press enter to open the search page
                </p>
              )}

              {!error &&
                results.map((r, i) => (
                  <Link
                    key={`${r.type}-${r.href}-${i}`}
                    href={r.href}
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={onClose}
                    onMouseEnter={() => setActiveIndex(i)}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "14px",
                      padding: "12px 8px",
                      borderBottom: "1px solid #f5f5f5",
                      color: "#111111",
                      textDecoration: "none",
                      backgroundColor: i === activeIndex ? "#f7f7f7" : "transparent",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        color: "#767676",
                        border: "1px solid #e5e5e5",
                        padding: "2px 8px",
                        whiteSpace: "nowrap",
                        lineHeight: 1.6,
                      }}
                    >
                      {r.badge}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "16px",
                          fontWeight: 300,
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.title}
                      </span>
                      {r.subtitle && (
                        <span style={{ fontSize: "12px", color: "#767676" }}>
                          {r.subtitle}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}

              {!error && results.length === 0 && (
                <p style={{ fontSize: "13px", color: "#767676", padding: "16px 0" }}>
                  no quick results — press enter to search everything
                </p>
              )}

              {/* always-present "see all" link */}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={onClose}
                style={{
                  display: "block",
                  padding: "14px 8px 4px",
                  fontSize: "13px",
                  color: "#767676",
                }}
              >
                see all results for &ldquo;{query.trim()}&rdquo; →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
