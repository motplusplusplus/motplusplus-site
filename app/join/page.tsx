import type { Metadata } from "next";
import { Suspense } from "react";
import JoinClient from "./JoinClient";

export const metadata: Metadata = {
  title: "join the newsletter | MoT+++",
  robots: { index: false, follow: false },
};

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinClient />
    </Suspense>
  );
}
