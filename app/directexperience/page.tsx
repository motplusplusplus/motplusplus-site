import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "+1 Direct Experience Meditation Residency — MoT+++",
  description:
    "A one-on-one meditation residency in Ho Chi Minh City. One month in a private penthouse — unstructured, silent, and deeply personal. For artists, writers, and seekers. $10,000/month.",
  openGraph: {
    title: "+1 Direct Experience Meditation Residency — MoT+++",
    description: "A one-on-one meditation residency in a private penthouse in Ho Chi Minh City. Unstructured, silent, and deeply personal.",
    url: "https://motplusplusplus.com/directexperience",
  },
  alternates: { canonical: "https://motplusplusplus.com/directexperience" },
};

export default function DirectExperiencePage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 24px 96px" }}>

      {/* page header */}
      <div style={{ marginBottom: "64px" }}>
        <h1
          style={{
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#111111",
            marginBottom: "12px",
          }}
        >
          +1 direct experience meditation residency
        </h1>
        <p style={{ fontSize: "15px", color: "#999999", fontWeight: 300 }}>
          a meditative awareness with the art of non doer
        </p>
      </div>

      {/* penthouse image */}
      <div style={{ marginBottom: "64px", maxWidth: "900px" }}>
        <img
          src="https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/directexperience/ha-penthouse.jpg"
          alt="the penthouse"
          style={{ display: "block", width: "100%", objectFit: "cover" }}
        />
      </div>

      <div style={{ maxWidth: "720px" }}>

        {/* the inner portrait */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            the inner portrait
          </p>
          <p style={{ fontSize: "18px", fontWeight: 300, color: "#222222", marginBottom: "24px", lineHeight: 1.5 }}>
            a one-on-one invitation to be with yourself.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            i am an artist. not of paint or canvas, but of presence. what i offer is not a teaching, not a method, not a program. it is a gathering in my personal penthouse, a space of light and stillness, where we simply be together, and in that being, you are invited to recognize your own inner portrait.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            not the portrait you&apos;ve been told you are. not the image built from thoughts, roles, or history. but the one that has always been here, before any of that arose. the nature of all things, vast and impersonal, and yet uniquely, unmistakably you.
          </p>
        </div>

        {/* the setting */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            the setting
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            we meet one-on-one in a beautiful penthouse. it is a place apart, yet open to the city below. here, there is no rush, no agenda. just a quiet room, a view, and the simplicity of being together.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444" }}>
            you are welcomed for a month, not as a retreat with schedules and practices, but as a period of unstructured living. days are yours. there is nothing to accomplish. the inner portrait is not something we "work on"; it is recognized in the gaps between doing.
          </p>
        </div>

        {/* the gathering */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            the gathering itself
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            when we come together, sometimes for minutes, sometimes longer, there is no posture to perfect, no technique to apply. you are simply here to be. in that resting, the mind, which has spent a lifetime trying to frame, define, and perfect the portrait, begins to step aside. what remains is what cannot be framed. the non-local heart. the cosmic heart. your original face.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444" }}>
            i do not guide. i do not instruct. i am simply present, holding a space where nothing is asked of you. sometimes silence is enough. sometimes a few words arise, not as teaching, but as a pointing: look. this is you. this has always been you.
          </p>
        </div>

        {/* what you may see */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            what you may see
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            not a concept. not a feeling. but a direct recognition, sudden perhaps, or quietly settling, of your own true nature. the ending of seeking. the eternal beginning of all things. and within that vastness, the unmistakable texture of you: your particular way of being, your unrepeatable presence, seen clearly for the first time.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            this recognition, call it satori, call it awakening, preferably a nameless state as it&apos;s not a state one can paint with word, however, experience with no experiencer may arrive in any gathering. perhaps it comes quietly. perhaps it arrives like a flash of lightning. sometimes it happens in a single meeting; other times it deepens over the course of the month. however it appears, once seen, it is never truly forgotten.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444" }}>
            the insight stays with you, not as a memory to hold onto, but as a shift in the very ground you stand on. you may not remain in the peak of the experience, but the knowing that arises, of what you have always been, remains, available to be recognized again and again, forever. there is nothing to take away. no practice to bring home. what is recognized is not new. it is what you have always been, simply uncovered.
          </p>
        </div>

        {/* if you come */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            if you come
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444" }}>
            come with nothing. no expectations. no effort. just a willingness to sit for your own portrait, not to create one, but to see what has been there all along. we meet for a month, but the true meeting happens outside of time. the door is open.
          </p>
        </div>

        {/* a note on form */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            a note on form
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444" }}>
            there is no schedule, no curriculum. we arrange our one-on-one gatherings naturally, when the moment feels right. dinners are offered each evening, simple vietnamese food, a taste of home, but you are free to join or not. the city, the artists, the penthouse, all of it is simply a container for you to be. no lineage. no titles. no teacher. just the simple spaciousness of one being meeting another, and in that space and time, the non-locality self comes online.
          </p>
        </div>

        {/* fees */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            fees
          </p>
          <p
            style={{
              fontSize: "32px",
              fontWeight: 300,
              marginBottom: "16px",
              letterSpacing: "-0.01em",
            }}
          >
            USD $10,000 / month
          </p>
          <div style={{ fontSize: "14px", color: "#666666", lineHeight: 1.9 }}>
            <p style={{ marginBottom: "4px" }}>one month minimum.</p>
            <p style={{ marginBottom: "4px" }}>no refunds.</p>
            <p>inquiries are welcome — commitments are firm.</p>
          </div>
        </div>

        {/* accommodation */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            accommodation
          </p>
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.9 }}>
            accommodation at either{" "}
            <Link
              href="/afarm/studios/saigon-domaine"
              style={{ color: "#333333", borderBottom: "1px solid #cccccc", paddingBottom: "1px" }}
            >
              Saigon Domaine
            </Link>
            {" "}or{" "}
            <Link
              href="/afarm/hotel"
              style={{ color: "#333333", borderBottom: "1px solid #cccccc", paddingBottom: "1px" }}
            >
              Amanaki Hotel Thao Dien
            </Link>
          </p>
        </div>

      </div>

      {/* inquire CTA */}
      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
        <p style={{ fontSize: "15px", marginBottom: "24px", color: "#444444", maxWidth: "480px", lineHeight: 1.7 }}>
          to inquire, reach out directly by email.
        </p>
        <a
          href="mailto:motplusplusplus@gmail.com?subject=+1 direct experience inquiry"
          style={{
            display: "inline-block",
            fontSize: "15px",
            fontWeight: 400,
            color: "#ffffff",
            backgroundColor: "#111111",
            padding: "14px 32px",
            textDecoration: "none",
          }}
        >
          inquire
        </a>
      </div>

    </div>
  );
}
