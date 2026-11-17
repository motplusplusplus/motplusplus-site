"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const TEXT = {
  en: {
    heading: "join the MoT+++ newsletter?",
    body: "a few emails a year about a.Farm open calls, new residents and events.",
    button: "yes, add me",
    sending: "adding you...",
    joined: "thank you. you're on the list.",
    already: "thank you. you're already on the list.",
    invalid: "this link doesn't look right. it may have been cut short when copied. please open it again from the original email, or write to info@motplusplusplus.com and we'll add you by hand.",
    unavailable: "we couldn't add you from this link. please write to info@motplusplusplus.com and we'll sort it out.",
    failed: "something went wrong on our side. please try again in a moment.",
  },
  vi: {
    heading: "tham gia bản tin MoT+++?",
    body: "vài email mỗi năm về các đợt open call của a.Farm, các nghệ sĩ lưu trú mới và sự kiện.",
    button: "vâng, hãy thêm tôi",
    sending: "đang thêm...",
    joined: "cảm ơn bạn. bạn đã có tên trong danh sách.",
    already: "cảm ơn bạn. bạn đã có tên trong danh sách rồi.",
    invalid: "liên kết này có vẻ không đúng, có thể đã bị cắt khi sao chép. vui lòng mở lại từ email gốc, hoặc viết cho info@motplusplusplus.com để chúng tôi thêm bạn thủ công.",
    unavailable: "chúng tôi không thể thêm bạn từ liên kết này. vui lòng viết cho info@motplusplusplus.com để chúng tôi xử lý.",
    failed: "đã có lỗi xảy ra. vui lòng thử lại sau ít phút.",
  },
};

type State = "idle" | "sending" | "joined" | "already" | "invalid" | "unavailable" | "failed";

export default function JoinClient() {
  const params = useSearchParams();
  const e = params.get("e") || "";
  const t = params.get("t") || "";
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [state, setState] = useState<State>(e && t ? "idle" : "invalid");
  const tx = TEXT[lang];

  useEffect(() => {
    // default to vietnamese for vietnamese browsers (after hydration, so the static html matches)
    const id = setTimeout(() => {
      if (navigator.language?.toLowerCase().startsWith("vi")) setLang("vi");
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // nothing happens on load. only this click posts, so link scanners can't subscribe anyone.
  const join = async () => {
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e, t }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setState(data.result === "already" ? "already" : "joined");
      else if (res.status === 400) setState("invalid");
      else if (res.status === 409) setState("unavailable");
      else setState("failed");
    } catch {
      setState("failed");
    }
  };

  const done = state === "joined" || state === "already";
  const message = state === "joined" ? tx.joined : state === "already" ? tx.already
    : state === "invalid" ? tx.invalid : state === "unavailable" ? tx.unavailable : state === "failed" ? tx.failed : "";

  const langBtn = (l: "en" | "vi", label: string) => (
    <button type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
      style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "12px", cursor: "pointer", color: "#111111", opacity: lang === l ? 1 : 0.4 }}>
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
        {langBtn("en", "EN")}{langBtn("vi", "VI")}
      </div>
      {state !== "invalid" && state !== "unavailable" && !done && (
        <>
          <h1 style={{ fontSize: "20px", fontWeight: 400, marginBottom: "16px" }}>{tx.heading}</h1>
          <p style={{ fontSize: "15px", fontWeight: 300, lineHeight: 1.6, marginBottom: "40px" }}>{tx.body}</p>
          <button type="button" onClick={join} disabled={state === "sending"}
            style={{ fontSize: "15px", color: "#ffffff", backgroundColor: "#111111", border: "none", padding: "16px 40px", fontFamily: "inherit", cursor: "pointer", opacity: state === "sending" ? 0.5 : 1, width: "100%", maxWidth: "320px" }}>
            {state === "sending" ? tx.sending : tx.button}
          </button>
        </>
      )}
      {(done || state === "invalid" || state === "unavailable" || state === "failed") && (
        <p role={done ? "status" : "alert"} style={{ fontSize: "15px", fontWeight: 300, lineHeight: 1.6, marginTop: state === "failed" ? "24px" : 0 }}>{message}</p>
      )}
    </div>
  );
}
