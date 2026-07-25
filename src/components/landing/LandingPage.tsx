'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { MapPin, ShieldCheck, Clock, CheckCircle2, Star } from 'lucide-react';

const LOCATIONS = [
  { id: 'loc-001', name: 'Colombo International Airport (CMB)' },
  { id: 'loc-002', name: 'Hotel Thilon, Colombo' },
];

export function LandingPage() {
  const router = useRouter();
  const [selectedLoc, setSelectedLoc] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLoc) {
      router.push(`/book?loc=${encodeURIComponent(selectedLoc)}`);
    } else {
      router.push('/book');
    }
  };

  const locationOptions = LOCATIONS.map(l => ({
    value: l.id,
    label: l.name,
  }));

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <NavBar showStaffLogin />

      {/* ── Hero Section (Bounce-style Search) ──────────────── */}
      <section className="relative bg-white pb-16 pt-12 md:pt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-4">
              Store light. Travel free.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              Secure luggage storage across Sri Lanka. Drop your bags in minutes and enjoy the city without the heavy lifting.
            </p>
          </div>

          {/* Search Widget with CustomSelect */}
          <div className="max-w-3xl mx-auto bg-slate-50 p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 items-center">
              <div className="w-full flex-1">
                <CustomSelect
                  options={locationOptions}
                  value={selectedLoc}
                  onChange={setSelectedLoc}
                  placeholder="Where do you want to store your bags?"
                  icon={<MapPin className="w-5 h-5 text-indigo-600" />}
                />
              </div>
              <Button type="submit" variant="primary" size="lg" className="w-full md:w-auto h-[50px] px-8 text-base font-bold shadow-xs">
                Find Storage
              </Button>
            </form>
          </div>

          {/* Trust micro-stats */}
          <div className="flex justify-center flex-wrap gap-6 md:gap-10 mt-8 text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">Fully Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">No Size Limits</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">Free Cancellation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Image Banner ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="w-full h-[320px] md:h-[450px] relative rounded-2xl overflow-hidden shadow-md border border-slate-200">
           <Image
            src="/hero.png"
            alt="Secure luggage storage"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-2xs">
              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">1. Find a location</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-normal">Search for a convenient storage location near the airport or in the city.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-2xs">
              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">2. Drop off</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-normal">Show your confirmation to our staff and safely leave your bags.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-2xs">
              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">3. Enjoy your day</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-normal">Explore hands-free. Your items are insured and securely monitored.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing & Benefits (Vibrant Indigo Band) ────────── */}
      <section id="pricing" className="bg-indigo-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Transparent pricing. No hidden fees.</h2>
            <p className="text-lg text-indigo-100 mb-8 max-w-lg leading-relaxed font-normal">
              Whether it's a small backpack or a large surfboard, our pricing is straightforward. Only pay for the time and space you use.
            </p>
            <ul className="flex flex-col gap-4 mb-8">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span className="text-base font-semibold">Starting at just $1 / day</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span className="text-base font-semibold">Discounts for weekly & monthly storage</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span className="text-base font-semibold">$10,000 protection guarantee per item</span>
              </li>
            </ul>
            <div>
              <Button variant="secondary" size="lg" onClick={() => router.push('/book')}>
                Check Prices
              </Button>
            </div>
          </div>
          <div className="flex-1 w-full bg-indigo-700/60 backdrop-blur-md p-8 rounded-2xl border border-indigo-500/40">
             <div className="flex justify-between items-center border-b border-indigo-500/40 pb-4 mb-4">
                <span className="text-base font-semibold text-white">Small Bag</span>
                <span className="text-lg font-bold text-white">$1.00 / day</span>
             </div>
             <div className="flex justify-between items-center border-b border-indigo-500/40 pb-4 mb-4">
                <span className="text-base font-semibold text-white">Carry-on Luggage</span>
                <span className="text-lg font-bold text-white">$2.00 / day</span>
             </div>
             <div className="flex justify-between items-center pb-2">
                <span className="text-base font-semibold text-white">Large Suitcase</span>
                <span className="text-lg font-bold text-white">$3.50 / day</span>
             </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 text-center mb-16">Trusted by thousands</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex text-amber-400 mb-4">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 font-normal">
                "Incredibly easy to use. Dropped off my bags right outside the airport and spent my layover exploring Colombo completely hands-free!"
              </p>
              <p className="text-xs font-bold text-slate-500">— Sarah Jenkins, UK</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex text-amber-400 mb-4">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 font-normal">
                "Felt very secure. The staff were professional, and the $10k insurance gave me complete peace of mind while storing my camera gear."
              </p>
              <p className="text-xs font-bold text-slate-500">— Mark D., Australia</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex text-amber-400 mb-4">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 font-normal">
                "Saved me from lugging 3 heavy suitcases around the city. The booking was seamless and it was so cheap. Highly recommended."
              </p>
              <p className="text-xs font-bold text-slate-500">— Anjali M., India</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-sm">
              <h4 className="text-2xl font-bold mb-3">Stowaway</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-normal">
                Secure luggage storage near Colombo International Airport. Travel lighter, explore further.
              </p>
            </div>
            <div className="flex gap-12">
              <div className="flex flex-col gap-2">
                <h5 className="text-sm font-semibold text-white mb-1">Support</h5>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Contact Us</Link>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">FAQs</Link>
              </div>
              <div className="flex flex-col gap-2">
                <h5 className="text-sm font-semibold text-white mb-1">Legal</h5>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 flex justify-between items-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Stowaway. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
