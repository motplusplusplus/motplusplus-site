"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { studios, hotel } from "@/lib/studios";

const studioOptions = [
  ...studios.map((s) => ({ value: s.slug, label: s.artistName })),
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

  useEffect(() => {
    if (preselectedStudio) setStudio(preselectedStudio);
  }, [preselectedStudio]);

  const monthOptions = getMonthOptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const studioLabel =
      studioOptions.find((o) => o.value === studio)?.label || studio;
    const monthLabel =
      monthOptions.find((o) => o.value === month)?.label || month;
    const durationLabel =
      durationOptions.find((o) => o.value === duration)?.label || duration;

    const subject = encodeURIComponent(
      `a.Farm residency inquiry — ${name} — ${studioLabel} — ${monthLabel}`
    );

    const body = encodeURIComponent(
      `preferred studio / accommodation: ${studioLabel}
preferred start: ${monthLabel}
duration: ${durationLabel}
name: ${name}
email: ${email}
${portfolio ? `portfolio / website: ${portfolio}\n` : ""}
---

hello — please add a brief description of your practice and what you hope to make or explore during your time in ho chi minh city. tell us about any recent or relevant work, and anything else about yourself or your practice that feels important. we're looking forward to hearing from you.

[your message here]`
    );

    window.location.href = `mailto:a.farm.saigon@gmail.com?subject=${subject}&body=${body}`;
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
          complete the form below and your email client will open with a
          pre-populated message. add a description of your practice before
          sending.
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
            open email to send inquiry
          </button>

          <p style={{ fontSize: "12px", color: "#aaaaaa", marginTop: "16px", lineHeight: 1.6 }}>
            this will open your email client with your selections pre-filled.
            you'll be prompted to describe your practice before sending.
          </p>

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
