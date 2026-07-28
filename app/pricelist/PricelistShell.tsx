'use client';

import { useRef, useState } from 'react';
import { registerVietnameseFont, VIETNAMESE_FONT_NAME } from '@/lib/pdfFonts';

export type PricelistItem = {
  _id: string;
  artist: string;
  title: string;
  medium: string;
  year: number;
  dimensions: string;
  edition?: string;
  description?: string;
  image?: string | null;
  price?: string;
};

const MOT_PAYMENT_QR_URL = '/pricelist/mot-payment-qr.png';

function mediumYear(item: PricelistItem): string {
  return [item.medium, item.year ? String(item.year) : null].filter(Boolean).join(', ');
}

type PdfImage = { dataUrl: string; width: number; height: number; format: 'JPEG' | 'PNG' };

// Fetches an image (same-origin or cross-origin CDN) and re-encodes it via canvas into a data
// URL jsPDF's addImage() can embed directly -- avoids format issues (e.g. WEBP) and CORS taint
// on the raw blob. Downscales to maxDimension since work photos only ever render at ~180mm wide
// in the PDF -- embedding at full 1600px source resolution just bloats the file. Returns null on
// any failure so a broken image just gets skipped in the PDF.
async function fetchImageForPdf(url: string, mime: 'image/jpeg' | 'image/png' = 'image/jpeg', maxDimension = 1200): Promise<PdfImage | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const dataUrl = mime === 'image/jpeg' ? canvas.toDataURL(mime, 0.8) : canvas.toDataURL(mime);
    return { dataUrl, width, height, format: mime === 'image/jpeg' ? 'JPEG' : 'PNG' };
  } catch {
    return null;
  }
}

async function downloadPdf(items: PricelistItem[]) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  registerVietnameseFont(doc); // embeds + activates a Vietnamese-safe font for ALL text below --
                                // jsPDF's built-in fonts (Helvetica etc.) are Latin-only and
                                // corrupt/drop Vietnamese diacritics in artist names and titles.

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const imageMaxHeight = 110;
  const qrSize = 22;

  // per-line height (mm) at a given font size, matching jsPDF's own text-layout math --
  // used to reserve accurate vertical space before drawing each item's block.
  const lineHeight = (fontSize: number) => (fontSize * doc.getLineHeightFactor()) / doc.internal.scaleFactor;

  doc.setFontSize(20);
  doc.setTextColor(17, 17, 17);
  doc.text('MoT+++', margin, 18);

  doc.setFontSize(11);
  doc.setTextColor(85, 85, 85);
  doc.text('+1 trash — pricelist', margin, 26);

  const generated = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  doc.setFontSize(9);
  doc.setTextColor(153, 153, 153);
  doc.text(`generated ${generated}`, margin, 32);

  let y = 42;

  const qrImage = await fetchImageForPdf(MOT_PAYMENT_QR_URL, 'image/png');

  for (const item of items) {
    const workImage = item.image ? await fetchImageForPdf(item.image, 'image/jpeg') : null;

    // Fit within a (contentWidth x imageMaxHeight) box like CSS object-fit: contain --
    // scale by whichever dimension is more constraining so the image never stretches,
    // then center it horizontally if it doesn't use the full width.
    let imgRenderWidth = 0;
    let imgRenderHeight = 0;
    let imgOffsetX = 0;
    if (workImage) {
      const scale = Math.min(contentWidth / workImage.width, imageMaxHeight / workImage.height);
      imgRenderWidth = workImage.width * scale;
      imgRenderHeight = workImage.height * scale;
      imgOffsetX = (contentWidth - imgRenderWidth) / 2;
    }

    doc.setFontSize(10);
    const artistBlockHeight = item.artist ? lineHeight(10) + 2 : 0;

    doc.setFontSize(13);
    const titleLines = doc.splitTextToSize(`${item.title || 'untitled'}${item.year ? `, ${item.year}` : ''}`, contentWidth);
    doc.setFontSize(10);
    const descLines = item.description ? doc.splitTextToSize(item.description, contentWidth) : [];
    const metaLine = [item.dimensions, item.medium, item.edition].filter(Boolean).join('  ·  ');

    const titleBlockHeight = titleLines.length * lineHeight(13);
    const descBlockHeight = descLines.length * lineHeight(10);
    const metaBlockHeight = metaLine ? lineHeight(10) + 2 : 0;
    const priceBlockHeight = lineHeight(13) + 4;
    const qrBlockHeight = qrImage ? qrSize + 8 : 0;

    const totalHeight =
      (imgRenderHeight ? imgRenderHeight + 6 : 0) +
      artistBlockHeight +
      titleBlockHeight + 3 +
      metaBlockHeight +
      (descLines.length ? descBlockHeight + 4 : 0) +
      priceBlockHeight +
      qrBlockHeight +
      12; // divider + trailing gap

    if (y + totalHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // 1. image, contained within the box (no stretching), centered
    if (workImage) {
      doc.addImage(workImage.dataUrl, workImage.format, margin + imgOffsetX, y, imgRenderWidth, imgRenderHeight);
      y += imgRenderHeight + 6;
    }

    // 2. artist, title, dimensions, medium, edition, description
    doc.setFont(VIETNAMESE_FONT_NAME, 'normal');
    if (item.artist) {
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(item.artist, margin, y + lineHeight(10) * 0.75);
      y += artistBlockHeight;
    }

    doc.setFontSize(13);
    doc.setTextColor(17, 17, 17);
    doc.text(titleLines, margin, y + lineHeight(13) * 0.75);
    y += titleBlockHeight + 3;

    if (metaLine) {
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(metaLine, margin, y + lineHeight(10) * 0.75);
      y += metaBlockHeight;
    }

    if (descLines.length) {
      doc.setFontSize(10);
      doc.setTextColor(85, 85, 85);
      doc.text(descLines, margin, y + lineHeight(10) * 0.75);
      y += descBlockHeight + 4;
    }

    // 3. price
    doc.setFontSize(13);
    doc.setTextColor(17, 17, 17);
    doc.text(item.price || 'price on inquiry', margin, y + lineHeight(13) * 0.75);
    y += priceBlockHeight;

    // 4. QR code, below every item
    if (qrImage) {
      doc.addImage(qrImage.dataUrl, qrImage.format, margin, y, qrSize, qrSize);
      doc.setFontSize(8);
      doc.setTextColor(153, 153, 153);
      doc.text('scan to pay via MoT+++', margin + qrSize + 6, y + qrSize / 2 + 1);
      y += qrSize + 8;
    }

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`motplusplusplus-pricelist-${stamp}.pdf`);
}

export default function PricelistShell({ items: initialItems }: { items: PricelistItem[] }) {
  // Items arrive from the static export WITHOUT prices (see page.tsx). The prices
  // are merged in only after the worker verifies the password server-side.
  const [items, setItems] = useState(initialItems);
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const rejectPassword = () => {
    setError(true);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Real gate: POST the password to the worker, which checks it against the
  // PRICELIST_PASSWORD secret and returns prices only on success. A wrong or
  // absent password gets a 401 and no price data ever reaches the browser.
  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/pricelist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password: input}),
      });
      if (!res.ok) {
        rejectPassword();
        return;
      }
      const data = await res.json();
      const prices: Record<string, string> = data.prices || {};
      setItems(prev => prev.map(i => ({...i, price: prices[i._id] ?? i.price})));
      setUnlocked(true);
      setInput('');
      setError(false);
    } catch {
      rejectPassword();
    }
  };

  if (!unlocked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <p style={{ fontSize: '10px', color: '#767676', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            enter password
          </p>
          <input
            ref={inputRef}
            type="password"
            value={input}
            autoFocus
            onChange={e => { setInput(e.target.value); setError(false); }}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            style={{
              width: '100%', border: 'none',
              borderBottom: `1px solid ${error ? '#cc2222' : '#dddddd'}`,
              fontSize: '14px', padding: '4px 0', outline: 'none',
              boxSizing: 'border-box', background: 'none',
              transition: 'border-color 0.15s',
            }}
          />
          {error && (
            <p style={{ fontSize: '10px', color: '#cc2222', marginTop: '10px', letterSpacing: '0.06em' }}>
              incorrect
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ fontSize: '11px', color: '#767676', letterSpacing: '0.08em' }}>
          {items.length} available {items.length === 1 ? 'work' : 'works'}
        </p>
        <button
          onClick={() => downloadPdf(items)}
          style={{
            fontSize: '11px', color: '#ffffff', backgroundColor: '#111111',
            padding: '8px 18px', border: 'none', cursor: 'pointer',
            letterSpacing: '0.04em', fontFamily: 'inherit',
          }}
        >
          download PDF
        </button>
      </div>

      <div style={{ borderTop: '1px solid #e5e5e5' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1.4fr 0.8fr',
          gap: '12px', padding: '10px 0',
          borderBottom: '1px solid #e5e5e5',
          fontSize: '10px', color: '#767676', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <span>Artist</span>
          <span>Title</span>
          <span>Medium / Year</span>
          <span>Price</span>
        </div>
        {items.map(item => (
          <div key={item._id} style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1.4fr 0.8fr',
            gap: '12px', padding: '14px 0',
            borderBottom: '1px solid #f0f0f0',
            fontSize: '13px', color: '#333333', alignItems: 'baseline',
          }}>
            <span>{item.artist}</span>
            <span style={{ color: '#111111' }}>{item.title}</span>
            <span style={{ color: '#767676' }}>{mediumYear(item)}</span>
            <span>{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
