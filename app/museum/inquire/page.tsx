"use client";

import { useState } from "react";

const content = {
  en: {
    breadcrumb: "+1 museum / hosting inquiry",
    heading: "interested in hosting a work",
    intro: "+1 museum places works in private homes, businesses, studios, and spaces anywhere in the world. tell us about your space and we'll be in touch.",
    fields: {
      name: "your name",
      namePlaceholder: "full name",
      email: "your email",
      emailPlaceholder: "email address",
      location: "location",
      locationPlaceholder: "city, country",
      spaceType: "type of space",
      spaceTypePlaceholder: "select",
      numSpaces: "number of spaces available",
      numSpacesPlaceholder: "e.g. 1",
      size: "approximate size",
      sizePlaceholder: "select",
      climate: "climate controlled",
      climatePlaceholder: "select",
      security: "security",
      securityPlaceholder: "select",
      light: "natural light",
      lightPlaceholder: "select",
      website: "website or instagram (optional)",
      websitePlaceholder: "https://",
      message: "anything else about the space (optional)",
      messagePlaceholder: "additional details about the space, the work you have in mind, or anything else you'd like us to know…",
    },
    spaceTypes: [
      { value: "home", label: "private home" },
      { value: "business", label: "business or office" },
      { value: "studio", label: "artist studio" },
      { value: "gallery", label: "gallery" },
      { value: "public", label: "public space" },
      { value: "other", label: "other" },
    ],
    sizes: [
      { value: "small", label: "small" },
      { value: "medium", label: "medium" },
      { value: "large", label: "large" },
      { value: "very-large", label: "very large" },
    ],
    climateOptions: [
      { value: "yes", label: "yes" },
      { value: "partial", label: "partial" },
      { value: "no", label: "no" },
    ],
    securityOptions: [
      { value: "yes", label: "yes" },
      { value: "no", label: "no" },
    ],
    lightOptions: [
      { value: "lots", label: "lots" },
      { value: "some", label: "some" },
      { value: "none", label: "none" },
    ],
    submit: "send inquiry",
    submitting: "sending…",
    successHeading: "inquiry received",
    successMessage: (name: string, location: string) =>
      `thank you, ${name}. we'll be in touch about hosting a work in ${location || "your space"}.`,
    error: "something went wrong — please try again or email motplusplusplus@gmail.com directly.",
    optional: "(optional)",
  },
  vi: {
    breadcrumb: "+1 museum / yêu cầu lưu trú tác phẩm",
    heading: "quan tâm đến việc lưu trú một tác phẩm",
    intro: "+1 museum đặt tác phẩm tại nhà riêng, doanh nghiệp, xưởng vẽ và các không gian trên toàn thế giới. hãy cho chúng tôi biết về không gian của bạn và chúng tôi sẽ liên lạc.",
    fields: {
      name: "họ và tên",
      namePlaceholder: "họ và tên đầy đủ",
      email: "email của bạn",
      emailPlaceholder: "địa chỉ email",
      location: "địa điểm",
      locationPlaceholder: "thành phố, quốc gia",
      spaceType: "loại không gian",
      spaceTypePlaceholder: "chọn",
      numSpaces: "số lượng không gian có sẵn",
      numSpacesPlaceholder: "vd. 1",
      size: "diện tích ước tính",
      sizePlaceholder: "chọn",
      climate: "kiểm soát nhiệt độ",
      climatePlaceholder: "chọn",
      security: "bảo mật",
      securityPlaceholder: "chọn",
      light: "ánh sáng tự nhiên",
      lightPlaceholder: "chọn",
      website: "trang web hoặc instagram (không bắt buộc)",
      websitePlaceholder: "https://",
      message: "thông tin thêm về không gian (không bắt buộc)",
      messagePlaceholder: "chi tiết thêm về không gian, tác phẩm bạn nghĩ đến, hoặc bất kỳ điều gì khác bạn muốn chúng tôi biết…",
    },
    spaceTypes: [
      { value: "home", label: "nhà riêng" },
      { value: "business", label: "doanh nghiệp hoặc văn phòng" },
      { value: "studio", label: "xưởng nghệ sĩ" },
      { value: "gallery", label: "phòng trưng bày" },
      { value: "public", label: "không gian công cộng" },
      { value: "other", label: "khác" },
    ],
    sizes: [
      { value: "small", label: "nhỏ" },
      { value: "medium", label: "vừa" },
      { value: "large", label: "lớn" },
      { value: "very-large", label: "rất lớn" },
    ],
    climateOptions: [
      { value: "yes", label: "có" },
      { value: "partial", label: "một phần" },
      { value: "no", label: "không" },
    ],
    securityOptions: [
      { value: "yes", label: "có" },
      { value: "no", label: "không" },
    ],
    lightOptions: [
      { value: "lots", label: "nhiều" },
      { value: "some", label: "vừa" },
      { value: "none", label: "không có" },
    ],
    submit: "gửi yêu cầu",
    submitting: "đang gửi…",
    successHeading: "đã nhận yêu cầu",
    successMessage: (name: string, location: string) =>
      `cảm ơn bạn, ${name}. chúng tôi sẽ liên lạc về việc lưu trú tác phẩm tại ${location || "không gian của bạn"}.`,
    error: "đã xảy ra lỗi — vui lòng thử lại hoặc email motplusplusplus@gmail.com trực tiếp.",
    optional: "(không bắt buộc)",
  },
};

export default function MuseumInquirePage() {
  const [lang, setLang] = useState<"en" | "vi">("en");
  const t = content[lang];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [spaceType, setSpaceType] = useState("");
  const [numSpaces, setNumSpaces] = useState("");
  const [size, setSize] = useState("");
  const [climate, setClimate] = useState("");
  const [security, setSecurity] = useState("");
  const [light, setLight] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const spaceLabel = t.spaceTypes.find((s) => s.value === spaceType)?.label || spaceType;
    const sizeLabel = t.sizes.find((s) => s.value === size)?.label || size;
    const climateLabel = t.climateOptions.find((s) => s.value === climate)?.label || climate;
    const securityLabel = t.securityOptions.find((s) => s.value === security)?.label || security;
    const lightLabel = t.lightOptions.find((s) => s.value === light)?.label || light;

    const details = [
      spaceType     ? `space type: ${spaceLabel}` : null,
      numSpaces     ? `number of spaces: ${numSpaces}` : null,
      size          ? `size: ${sizeLabel}` : null,
      climate       ? `climate controlled: ${climateLabel}` : null,
      security      ? `security: ${securityLabel}` : null,
      light         ? `natural light: ${lightLabel}` : null,
      message       ? `\n${message}` : null,
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch("/submit-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "museum",
          name,
          email,
          locationName: location,
          message: details || "no additional details provided",
          portfolioUrl: website || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        throw new Error(data.error || "submission failed");
      }
    } catch {
      setSubmitError(t.error);
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

  const fieldStyle = { marginBottom: "40px" };

  if (submitted) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ maxWidth: "640px" }}>
          <h1 style={{
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "24px",
          }}>
            {t.successHeading}
          </h1>
          <p style={{ fontSize: "15px", color: "#666666", lineHeight: 1.8, maxWidth: "480px" }}>
            {t.successMessage(name, location)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px 96px" }}>
      <div style={{ maxWidth: "640px" }}>

        {/* breadcrumb + language toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <p style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em" }}>
            <a href="/museum" style={{ color: "#999999" }}>{lang === "en" ? "+1 museum" : "+1 museum"}</a>
            {" / "}
            {lang === "en" ? "hosting inquiry" : "yêu cầu lưu trú"}
          </p>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["en", "vi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  padding: "4px 10px",
                  border: "1px solid",
                  borderColor: lang === l ? "#111111" : "#cccccc",
                  backgroundColor: lang === l ? "#111111" : "transparent",
                  color: lang === l ? "#ffffff" : "#999999",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "16px",
        }}>
          {t.heading}
        </h1>
        <p style={{
          fontSize: "15px", color: "#666666", lineHeight: 1.8,
          marginBottom: "64px", maxWidth: "480px",
        }}>
          {t.intro}
        </p>

        <form onSubmit={handleSubmit}>

          {/* name */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.name}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              required placeholder={t.fields.namePlaceholder} style={inputStyle} />
          </div>

          {/* email */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder={t.fields.emailPlaceholder} style={inputStyle} />
          </div>

          {/* location */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.location}</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              required placeholder={t.fields.locationPlaceholder} style={inputStyle} />
          </div>

          {/* space type */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.spaceType} {t.optional}</label>
            <select value={spaceType} onChange={(e) => setSpaceType(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">{t.fields.spaceTypePlaceholder}</option>
              {t.spaceTypes.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* number of spaces */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.numSpaces} {t.optional}</label>
            <input type="number" min="1" value={numSpaces} onChange={(e) => setNumSpaces(e.target.value)}
              placeholder={t.fields.numSpacesPlaceholder} style={inputStyle} />
          </div>

          {/* size */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.size} {t.optional}</label>
            <select value={size} onChange={(e) => setSize(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">{t.fields.sizePlaceholder}</option>
              {t.sizes.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* climate */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.climate} {t.optional}</label>
            <select value={climate} onChange={(e) => setClimate(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">{t.fields.climatePlaceholder}</option>
              {t.climateOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* security */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.security} {t.optional}</label>
            <select value={security} onChange={(e) => setSecurity(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">{t.fields.securityPlaceholder}</option>
              {t.securityOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* natural light */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.light} {t.optional}</label>
            <select value={light} onChange={(e) => setLight(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">{t.fields.lightPlaceholder}</option>
              {t.lightOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* website */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.website}</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
              placeholder={t.fields.websitePlaceholder} style={inputStyle} />
          </div>

          {/* message */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.fields.message}</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              rows={6} placeholder={t.fields.messagePlaceholder}
              style={{ ...inputStyle, resize: "vertical" }} />
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
            {submitting ? t.submitting : t.submit}
          </button>

        </form>
      </div>
    </div>
  );
}
