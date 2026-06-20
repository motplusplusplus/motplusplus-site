'use client';

import { useRef, useState } from 'react';
import { PRICE_REVEAL_PASSWORD } from '@/lib/priceReveal';
import { registerVietnameseFont, VIETNAMESE_FONT_NAME } from '@/lib/pdfFonts';

export type PricelistItem = {
  _id: string;
  artist: string;
  title: string;
  medium: string;
  year: number;
  dimensions: string;
  price?: string;
};

function mediumYear(item: PricelistItem): string {
  return [item.medium, item.year ? String(item.year) : null].filter(Boolean).join(', ');
}

async function downloadPdf(items: PricelistItem[]) {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  registerVietnameseFont(doc); // embeds + activates a Vietnamese-safe font for ALL text below --
                                // jsPDF's built-in fonts (Helvetica etc.) are Latin-only and
                                // corrupt/drop Vietnamese diacritics in artist names and titles.

  doc.setFontSize(20);
  doc.setTextColor(17, 17, 17);
  doc.text('MoT+++', 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(85, 85, 85);
  doc.text('+1 trash — pricelist', 14, 26);

  const generated = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  doc.setFontSize(9);
  doc.setTextColor(153, 153, 153);
  doc.text(`generated ${generated}`, 14, 32);

  autoTable(doc, {
    startY: 40,
    head: [['Artist', 'Title', 'Medium / Year', 'Price']],
    body: items.map(i => [i.artist, i.title, mediumYear(i), i.price || '']),
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontStyle: 'normal', fontSize: 10, font: VIETNAMESE_FONT_NAME },
    bodyStyles: { textColor: [51, 51, 51], fontSize: 10, font: VIETNAMESE_FONT_NAME },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { cellPadding: 6, font: VIETNAMESE_FONT_NAME },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`motplusplusplus-pricelist-${stamp}.pdf`);
}

export default function PricelistShell({ items }: { items: PricelistItem[] }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (input === PRICE_REVEAL_PASSWORD) {
      setUnlocked(true);
      setInput('');
      setError(false);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (!unlocked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <p style={{ fontSize: '10px', color: '#bbbbbb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
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
        <p style={{ fontSize: '11px', color: '#999999', letterSpacing: '0.08em' }}>
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
          fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.08em', textTransform: 'uppercase',
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
            <span style={{ color: '#888888' }}>{mediumYear(item)}</span>
            <span>{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
