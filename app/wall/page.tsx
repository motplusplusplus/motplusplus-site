import type { Metadata } from 'next';
import WarmPage from '@/components/work/WarmPage';
import WallClient from './WallClient';

export const metadata: Metadata = {
  title: 'my wall',
  description: 'Works, artists and events saved from MoT+++, kept in this browser only.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://motplusplusplus.com/wall' },
};

export default function WallPage() {
  return (<><WarmPage /><WallClient /></>);
}
