"use client";

import { useEffect, useRef, useState } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const TEXT = {
  en: {
    placeholder: "email address",
    button: "subscribe",
    sending: "sending...",
    note: "news from MoT+++ and a.Farm, a few times a year. unsubscribe anytime.",
    ok: "thank you. you're subscribed.",
    invalid: "please enter a valid email address.",
    verify: "one moment, we're still checking you're human. please try again.",
    generic: "something went wrong. please try again shortly.",
    label: "email address for newsletter",
  },
  vi: {
    placeholder: "địa chỉ email",
    button: "đăng ký",
    sending: "đang gửi...",
    note: "tin từ MoT+++ và a.Farm, vài lần mỗi năm. hủy đăng ký bất cứ lúc nào.",
    ok: "cảm ơn bạn. bạn đã đăng ký.",
    invalid: "vui lòng nhập địa chỉ email hợp lệ.",
    verify: "vui lòng đợi một chút rồi thử lại.",
    generic: "đã có lỗi xảy ra. vui lòng thử lại sau.",
    label: "địa chỉ email nhận bản tin",
  },
};

// the site has one page with a vietnamese toggle (/luke-tramy); it sets
// <html lang="vi"> while vietnamese is showing, and the footer follows it.
function useLang(): "en" | "vi" {
  const [lang, setLang] = useState<"en" | "vi">("en");
  useEffect(() => {
    const read = () => setLang(document.documentElement.lang === "vi" ? "vi" : "en");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => mo.disconnect();
  }, []);
  return lang;
}

export default function NewsletterForm() {
  const lang = useLang();
  const t = TEXT[lang];
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const tokenRef = useRef("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const loading = useRef(false);
  const mountedAt = useRef(0);
  useEffect(() => { mountedAt.current = performance.now(); }, []);

  // load turnstile only when the visitor engages with the field, so every page
  // does not pay for the script
  const ensureTurnstile = () => {
    if (!TURNSTILE_SITE_KEY || loading.current) return;
    loading.current = true;
    const mount = () => {
      if (!window.turnstile || !widgetRef.current) return;
      widgetId.current = window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: "interaction-only",
        callback: (tok: string) => { tokenRef.current = tok; },
        "expired-callback": () => { tokenRef.current = ""; },
        "error-callback": () => { tokenRef.current = ""; },
      });
    };
    if (window.turnstile) return mount();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = mount;
    document.head.appendChild(s);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    const addr = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      setState("error"); setError(t.invalid); return;
    }
    ensureTurnstile();
    if (TURNSTILE_SITE_KEY && !tokenRef.current) {
      // give a just-started challenge a few seconds to finish
      for (let i = 0; i < 20 && !tokenRef.current; i++) await new Promise((r) => setTimeout(r, 250));
      if (!tokenRef.current) { setState("error"); setError(t.verify); return; }
    }
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addr, website, turnstileToken: tokenRef.current,
          elapsedMs: Math.round(performance.now() - mountedAt.current),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setState("ok"); setEmail("");
      } else {
        setState("error"); setError(typeof data.error === "string" ? data.error : t.generic);
      }
    } catch {
      setState("error"); setError(t.generic);
    }
    // a turnstile token is single use
    tokenRef.current = "";
    if (window.turnstile) window.turnstile.reset(widgetId.current);
  };

  const busy = state === "sending";

  return (
    <div style={{ maxWidth: "460px" }}>
      {state === "ok" ? (
        <p role="status" style={{ fontSize: "12px", color: "#111111" }}>{t.ok}</p>
      ) : (
        <form onSubmit={submit} noValidate>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              aria-label={t.label}
              placeholder={t.placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={ensureTurnstile}
              disabled={busy}
              style={{
                flex: 1, minWidth: 0, border: "none", borderBottom: "1px solid #cccccc",
                padding: "10px 0", fontSize: "16px", fontWeight: 300, fontFamily: "inherit",
                background: "transparent", outline: "none", color: "#111111", borderRadius: 0,
              }}
            />
            <button
              type="submit"
              disabled={busy}
              style={{
                fontSize: "12px", color: "#ffffff", backgroundColor: "#111111", border: "none",
                padding: "12px 20px", fontFamily: "inherit", cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.5 : 1, whiteSpace: "nowrap",
              }}
            >
              {busy ? t.sending : t.button}
            </button>
          </div>
          {/* honeypot: hidden from people and assistive tech, bots fill it */}
          <input
            type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
            value={website} onChange={(e) => setWebsite(e.target.value)}
            style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", opacity: 0 }}
          />
          <div ref={widgetRef} />
          <p style={{ fontSize: "11px", color: "var(--mot-text-quiet, #767676)", marginTop: "10px" }}>{t.note}</p>
          {state === "error" && (
            <p role="alert" style={{ fontSize: "12px", color: "#b00020", marginTop: "8px" }}>{error}</p>
          )}
        </form>
      )}
    </div>
  );
}
