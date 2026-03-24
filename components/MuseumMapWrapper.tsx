'use client';

import dynamic from 'next/dynamic';

const MuseumMap = dynamic(() => import('./MuseumMap'), { ssr: false });

export default function MuseumMapWrapper() {
  return <MuseumMap />;
}
