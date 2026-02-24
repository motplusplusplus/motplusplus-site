const upcomingEvents = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  title: "event title",
  type: i % 2 === 0 ? "opening" : "performance",
  date: "date — time",
  location: "location, hồ chí minh city",
  description: "brief description of the event — to be provided.",
}));

const pastEvents = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: "event title",
  type: ["opening", "performance", "talk", "screening"][i % 4],
  date: "date",
  location: "location, hồ chí minh city",
}));

export default function EventsPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* heading */}
      <div style={{ marginBottom: "72px" }}>
        <h1
          style={{
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "16px",
          }}
        >
          events
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", maxWidth: "480px", lineHeight: 1.7 }}>
          openings, performances, talks, and screenings — in and around
          ho chi minh city.
        </p>
      </div>

      {/* upcoming */}
      <div style={{ marginBottom: "80px" }}>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
          upcoming
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(200px, 1fr) 2fr",
                gap: "32px",
                padding: "32px 0",
                borderTop: "1px solid #e5e5e5",
                alignItems: "start",
              }}
            >
              {/* image placeholder */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #e5e5e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
                  image {event.id}
                </p>
              </div>

              {/* text */}
              <div>
                <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "10px" }}>
                  {event.type}
                </p>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 300,
                    lineHeight: 1.2,
                    marginBottom: "12px",
                    color: "#111111",
                  }}
                >
                  {event.title}
                </h2>
                <p style={{ fontSize: "13px", color: "#888888", marginBottom: "6px" }}>
                  {event.date}
                </p>
                <p style={{ fontSize: "13px", color: "#aaaaaa", marginBottom: "20px" }}>
                  {event.location}
                </p>
                <p style={{ fontSize: "14px", color: "#444444", lineHeight: 1.7, maxWidth: "480px" }}>
                  {event.description}
                </p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #e5e5e5" }} />
        </div>
      </div>

      {/* past */}
      <div>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
          past
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {pastEvents.map((event) => (
            <div
              key={event.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr 1fr",
                gap: "24px",
                padding: "20px 0",
                borderTop: "1px solid #e5e5e5",
                alignItems: "center",
              }}
            >
              <p style={{ fontSize: "13px", color: "#aaaaaa" }}>{event.date}</p>
              <p style={{ fontSize: "15px", color: "#111111", fontWeight: 300 }}>{event.title}</p>
              <p style={{ fontSize: "12px", color: "#bbbbbb", letterSpacing: "0.04em" }}>{event.type}</p>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #e5e5e5" }} />
        </div>
      </div>

    </div>
  );
}
