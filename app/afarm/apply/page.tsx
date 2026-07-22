"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { studios, hotel } from "@/lib/studios";
import { submitInquiry } from "@/lib/inquiry";
import { CONTACTS } from "@/lib/contacts";

// studios (lib/studios.ts) is an unfiltered 1:1 map of studios-data.json --
// excludes retired/non-current hosts (active:false or hidden:true in the JSON
// itself) so they can't be selected as a studio preference on a live
// application form. Found via health-check: amanaki-hotel and mark-vu-studio
// (a Hanoi-based, non-Saigon entry) were both selectable with no filter.
const studioOptions = [
  ...studios.filter((s) => s.active !== false && !s.hidden).map((s) => ({ value: s.slug, label: s.artistName })),
  { value: hotel.slug, label: `${hotel.name} (hotel track)` },
  { value: "open", label: "no preference / open to discussion" },
];

const durationOptions = [
  { value: "1-month", label: "1 month" },
  { value: "2-months", label: "2 months" },
  { value: "3-months", label: "3 months" },
  { value: "longer", label: "longer — let's discuss" },
];

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

function ApplyForm() {
  const searchParams = useSearchParams();
  const preselectedStudio = searchParams.get("studio") || "";

  const [studio, setStudio] = useState(preselectedStudio);
  const [month, setMonth] = useState("");
  const [duration, setDuration] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  // true when the endpoint was unreachable and we fell back to opening mailto
  const [viaMailto, setViaMailto] = useState(false);

  useEffect(() => {
    if (preselectedStudio) setStudio(preselectedStudio);
  }, [preselectedStudio]);

  const monthOptions = getMonthOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const studioLabel =
      studioOptions.find((o) => o.value === studio)?.label || studio;
    const monthLabel =
      monthOptions.find((o) => o.value === month)?.label || month;
    const durationLabel =
      durationOptions.find((o) => o.value === duration)?.label || duration;

    // pre-built mailto used only if the capture endpoint is unreachable
    const subject = `a.farm residency application: ${name}`;
    const body = [
      `studio preference: ${studioLabel}`,
      `start month: ${monthLabel}`,
      `duration: ${durationLabel}`,
      `name: ${name}`,
      `email: ${email}`,
      portfolio ? `portfolio: ${portfolio}` : null,
      "",
      message,
    ].filter((line) => line !== null).join("\n");
    const mailtoHref = `mailto:${CONTACTS.residency}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const ok = await submitInquiry({
      type: "residency",
      name,
      email,
      message,
      studioType: studioLabel,
      startMonth: monthLabel,
      duration: durationLabel,
      ...(portfolio ? { portfolioUrl: portfolio } : {}),
    });

    if (!ok) {
      setViaMailto(true);
      window.location.href = mailtoHref;
    }

    setSubmitted(true);
  };

  const inputStyle = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #cccccc",
    padding: "12px 0",
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

  const fieldStyle = {
    marginBottom: "40px",
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ maxWidth: "640px" }}>
          <h1
            style={{
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "24px",
            }}
          >
            inquiry received
          </h1>
          <p style={{ fontSize: "15px", color: "#666666", lineHeight: 1.8, maxWidth: "480px" }}>
            {viaMailto
              ? `your email client should open with this inquiry pre-filled. if it doesn't open automatically, email us directly at ${CONTACTS.residency}.`
              : "thank you — your residency inquiry has been received. we'll be in touch."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      <div style={{ maxWidth: "640px" }}>
        <h1
          style={{
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "16px",
          }}
        >
          inquire
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#666666",
            lineHeight: 1.8,
            marginBottom: "64px",
            maxWidth: "480px",
          }}
        >
          complete the form below to send your residency inquiry directly to a.Farm.
        </p>

        <form onSubmit={handleSubmit}>

          {/* studio selection */}
          <div style={fieldStyle}>
            <label style={labelStyle}>preferred studio / accommodation</label>
            <select
              value={studio}
              onChange={(e) => setStudio(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">select a studio</option>
              {studioOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* start month */}
          <div style={fieldStyle}>
            <label style={labelStyle}>preferred start month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">select a month</option>
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* duration */}
          <div style={fieldStyle}>
            <label style={labelStyle}>duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">select duration</option>
              {durationOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* name */}
          <div style={fieldStyle}>
            <label style={labelStyle}>your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="full name"
              style={inputStyle}
            />
          </div>

          {/* email */}
          <div style={fieldStyle}>
            <label style={labelStyle}>your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email address"
              style={inputStyle}
            />
          </div>

          {/* portfolio */}
          <div style={fieldStyle}>
            <label style={labelStyle}>website or portfolio (optional)</label>
            <input
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="https://"
              style={inputStyle}
            />
          </div>

          {/* message */}
          <div style={fieldStyle}>
            <label style={labelStyle}>about your practice</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              placeholder="tell us about your practice and what you hope to make or explore during your time in ho chi minh city…"
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
            send inquiry
          </button>

        </form>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div style={{ padding: "64px 24px" }}>loading...</div>}>
      <ApplyForm />
    </Suspense>
  );
}
