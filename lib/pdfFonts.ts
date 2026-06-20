import type { jsPDF } from 'jspdf';
import { BE_VIETNAM_PRO_REGULAR_BASE64 } from './beVietnamProRegularBase64';

const FONT_FILE = 'BeVietnamPro-Regular.ttf';
const FONT_NAME = 'BeVietnamPro';

/**
 * Embeds Be Vietnam Pro (Google Fonts, OFL, Vietnamese-safe) into a jsPDF
 * document and sets it as the active/default font. jsPDF's built-in fonts
 * (Helvetica, etc.) are Latin-only and silently drop or corrupt Vietnamese
 * diacritics -- this is the fix for that, shared across every PDF this site
 * generates (pricelist today; invoices/receipts/COAs in a later phase).
 *
 * Call this once, right after `new jsPDF()`, before any text is rendered.
 */
export function registerVietnameseFont(doc: jsPDF): void {
  doc.addFileToVFS(FONT_FILE, BE_VIETNAM_PRO_REGULAR_BASE64);
  doc.addFont(FONT_FILE, FONT_NAME, 'normal');
  doc.setFont(FONT_NAME, 'normal');
}

/** The registered font family name, for call sites that need to switch back
 *  to it after temporarily setting a different font/style (e.g. bold headers
 *  -- this font is only registered at 'normal' weight, see module doc). */
export const VIETNAMESE_FONT_NAME = FONT_NAME;
