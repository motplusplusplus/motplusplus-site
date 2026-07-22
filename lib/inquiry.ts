/** Client-safe helper for POSTing to the /api/inquiry Worker endpoint.
 *  Dependency-free so any client component can import it. Returns true only
 *  when the endpoint recorded the inquiry ({ok:true}); on any network error,
 *  non-2xx, or malformed response it returns false so callers can fall back
 *  to mailto and never silently drop a lead.
 */
export type InquiryType = "trash" | "residency" | "museum";

export type InquiryPayload = {
  type: InquiryType;
  name: string;
  email: string;
  message: string;
  // type-conditional fields (see Sanity `inquiry` schema); all optional
  artworkTitle?: string;
  artworkId?: string;
  studioType?: string;
  startMonth?: string;
  duration?: string;
  portfolioUrl?: string;
  locationName?: string;
  locationId?: string;
};

export async function submitInquiry(payload: InquiryPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return data?.ok === true;
  } catch {
    return false;
  }
}
