import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Stowaway — Secure Luggage Storage Near CMB Airport',
  description:
    'Store your luggage securely near Colombo Airport. 24/7 drop-off and collection, airport pickup and delivery available. Book online in minutes.',
  keywords: 'luggage storage, Colombo airport, CMB, bag storage, travel, Hotel Thilon',
  openGraph: {
    title: 'Stowaway — Secure Luggage Storage Near CMB Airport',
    description: 'Store your luggage securely near Colombo Airport. 24/7 drop-off and collection.',
    type: 'website',
  },
};

export default function HomePage() {
  return <LandingPage />;
}
