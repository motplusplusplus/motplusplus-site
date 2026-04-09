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
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (preselectedStudio) setStudio(preselectedStudio);
  }, [preselectedStudio]);

  const monthOptions = getMonthOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const studioLabel =
      studioOptions.find((o) => o.value === studio)?.label || studio;
    const monthLabel =
      monthOptions.find((o) => o.value === month)?.label || month;
    const durationLabel =
      durationOptions.find((o) => o.value === duration)?.label || duration;

    try {
      const res = await fetch("/submit-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "residency",
          name,
          email,
          message: message || `preferred studio: ${studioLabel}\npreferred start: ${monthLabel}\nduration: ${durationLabel}`,
          studioType: studioLabel,
          startMonth: month,
          duration: durationLabel,
          portfolioUrl: portfolio || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        throw new Error(data.error || "submission failed");
      }
    } catch {
      setSubmitError("something went wrong — please try again or email a.farm.saigon@gmail.com directly.");
    } finally {
      setSubmitting(false);
    }
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
            thank you, {name}. we'll be in touch about your residency inquiry at a.Farm.
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

          {submitError && (
            <p style={{ fontSize: "13px", color: "#cc4444", marginBottom: "20px", lineHeight: 1.6 }}>
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              fontSize: "15px",
              fontWeight: 400,
              color: "#ffffff",
              backgroundColor: submitting ? "#888888" : "#111111",
              border: "none",
              padding: "16px 40px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "block",
              width: "100%",
            }}
          >
            {submitting ? "sending…" : "send inquiry"}
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
