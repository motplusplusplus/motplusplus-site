export const DEFAULT_OG_IMAGE = "https://motplusplusplus.com/og-default.jpg";

/** Image dimensions are only known (1200x630) for the default fallback — real
 *  subject photos have arbitrary aspect ratios, so we don't assert a size for them. */
export function ogImage(url: string | undefined | null, subjectAlt: string) {
  if (!url || url === DEFAULT_OG_IMAGE) {
    return { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "MoT+++" };
  }
  return { url, alt: subjectAlt };
}
