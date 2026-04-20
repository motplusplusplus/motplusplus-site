'use client';

import { useState } from 'react';
import type { StudioProfile } from '@/lib/studios';

type Props = {
  profile: StudioProfile;
  profileVi?: StudioProfile;
  hostLabel?: string;
};

export default function StudioProfileContent({ profile, profileVi, hostLabel }: Props) {
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const p = lang === 'vi' && profileVi ? profileVi : profile;
  const bilingual = !!profileVi;

  const label = (en: string, vi: string) => lang === 'vi' && bilingual ? vi : en;

  return (
    <div>
      {/* language toggle */}
      {bilingual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
          <button
            onClick={() => setLang('en')}
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 0',
              color: lang === 'en' ? '#111111' : '#bbbbbb',
              borderBottom: lang === 'en' ? '1px solid #111111' : '1px solid transparent',
              fontFamily: 'inherit',
            }}
          >
            EN
          </button>
          <span style={{ color: '#dddddd', fontSize: '11px' }}>|</span>
          <button
            onClick={() => setLang('vi')}
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 0',
              color: lang === 'vi' ? '#111111' : '#bbbbbb',
              borderBottom: lang === 'vi' ? '1px solid #111111' : '1px solid transparent',
              fontFamily: 'inherit',
            }}
          >
            VI
          </button>
        </div>
      )}

      {/* practice bio */}
      {p.practiceBio && (
        <div style={{ maxWidth: '680px', marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', color: '#999999', letterSpacing: '0.08em', marginBottom: '24px' }}>
            {hostLabel ?? label('about the artist', 'về nghệ sĩ')}
          </p>
          {p.practiceBio.split(/\n{2,}/).filter(Boolean).map((para, i) => (
            <p key={i} style={{ fontSize: '15px', lineHeight: 1.85, color: '#444444', marginBottom: '20px' }}>
              {para.trim()}
            </p>
          ))}
        </div>
      )}

      {/* welcome bio */}
      {p.welcomeBio && (
        <div style={{ maxWidth: '680px', marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', color: '#999999', letterSpacing: '0.08em', marginBottom: '24px' }}>
            {label('about the space', 'về không gian')}
          </p>
          {p.welcomeBio.split(/\n{2,}/).filter(Boolean).map((para, i) => (
            <p key={i} style={{ fontSize: '15px', lineHeight: 1.85, color: '#444444', marginBottom: '20px' }}>
              {para.trim()}
            </p>
          ))}
        </div>
      )}

      {/* collaboration */}
      {p.collaboration && (
        <div style={{ maxWidth: '680px', marginBottom: '56px', borderLeft: '2px solid #e5e5e5', paddingLeft: '20px' }}>
          <p style={{ fontSize: '11px', color: '#999999', letterSpacing: '0.08em', marginBottom: '24px' }}>
            {label('collaboration', 'hợp tác')}
          </p>
          {p.collaboration.split(/\n{2,}/).filter(Boolean).map((para, i) => (
            <p key={i} style={{ fontSize: '14px', lineHeight: 1.85, color: '#555555', marginBottom: '16px' }}>
              {para.trim()}
            </p>
          ))}
        </div>
      )}

      {/* practical details */}
      {(p.languages || p.availability || p.neighbourhood || p.environment || p.transport || p.amenities) && (
        <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '40px', marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', color: '#999999', letterSpacing: '0.08em', marginBottom: '28px' }}>
            {label('practical', 'thông tin thực tế')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px 40px', maxWidth: '720px' }}>
            {p.languages && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('languages', 'ngôn ngữ')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>{p.languages.join(', ')}</p>
              </div>
            )}
            {p.availability && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('availability', 'lịch mở cửa')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>{p.availability}</p>
              </div>
            )}
            {p.neighbourhood && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('neighbourhood', 'khu vực')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>{p.neighbourhood}</p>
              </div>
            )}
            {p.environment && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('environment', 'môi trường')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>{p.environment}</p>
              </div>
            )}
            {p.transport && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('transport', 'giao thông')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>{p.transport}</p>
              </div>
            )}
            {p.amenities && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('amenities', 'tiện ích')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>{p.amenities}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* house rules */}
      {(p.smoking !== undefined || p.guests !== undefined || p.livingArrangement || p.residentRoom || p.rules) && (
        <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '40px', marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', color: '#999999', letterSpacing: '0.08em', marginBottom: '28px' }}>
            {label('house rules', 'quy định')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px 40px', maxWidth: '720px' }}>
            {p.smoking !== undefined && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('smoking', 'hút thuốc')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>
                  {p.smoking
                    ? (p.smokingDetail || label('permitted', 'cho phép'))
                    : label('not permitted', 'không cho phép')}
                </p>
              </div>
            )}
            {p.guests !== undefined && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('guests', 'khách')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>
                  {p.guests
                    ? (p.guestsDetail || label('welcome', 'được phép'))
                    : label('not permitted', 'không cho phép')}
                </p>
              </div>
            )}
            {p.livingArrangement && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('arrangement', 'bố trí')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>{p.livingArrangement}</p>
              </div>
            )}
            {p.residentRoom && (
              <div>
                <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {label('resident room', 'phòng lưu trú')}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#333333' }}>{p.residentRoom}</p>
              </div>
            )}
          </div>
          {p.rules && (
            <p style={{ fontSize: '13px', color: '#777777', lineHeight: 1.75, fontWeight: 300, maxWidth: '560px', marginTop: '24px' }}>
              {p.rules}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
