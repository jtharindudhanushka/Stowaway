'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { MapPin, ShieldCheck, Clock, CheckCircle2, Star, ArrowRight } from 'lucide-react';

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <NavBar showBookNow onBookNow={() => router.push('/book')} />

      {/* ── Hero Section (Bounce-style Clean CTAs) ──────────────── */}
      <section className="relative bg-white pb-16 pt-12 md:pt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-orange-100 text-orange-900 mb-4 inline-block tracking-wide">
              #1 Luggage Storage Near CMB Airport
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#1C130E] mb-6 leading-tight">
              Store light. Travel free.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Secure, insured luggage storage across Sri Lanka. Drop off your bags in minutes and explore the island without heavy lifting.
            </p>
          </div>

          {/* Action CTAs: Book Now & Learn More */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-10">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/book')}
              className="w-full sm:w-auto px-8 py-4 text-base font-black shadow-md flex items-center justify-center gap-2"
            >
              Book Storage Now <ArrowRight className="w-5 h-5" />
            </Button>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-[#1C130E]"
              >
                Learn More
              </Button>
            </a>
          </div>

          {/* Trust micro-stats */}
          <div className="flex justify-center flex-wrap gap-6 md:gap-10 text-slate-700 font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
              <span className="text-sm">Fully Insured Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
              <span className="text-sm">No Item Size Limits</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
              <span className="text-sm">Free Cancellation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Image Banner ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="w-full h-[320px] md:h-[450px] relative rounded-2xl overflow-hidden shadow-lg border border-slate-200">
           <Image
            src="/hero.png"
            alt="Secure luggage storage facility"
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
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#1C130E]">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-2xs">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#1C130E]">1. Book online</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">Select your drop-off location, date, and luggage items in seconds.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-2xs">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#1C130E]">2. Drop off bags</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">Show your QR pass at CMB Airport or hotel partner for instant check-in.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-2xs">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#1C130E]">3. Enjoy your trip</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">Explore Sri Lanka hands-free. Pick up your luggage when you are ready.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing & Benefits (Dark Brown Band) ───────────── */}
      <section id="pricing" className="bg-[#1C130E] text-white py-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">Transparent pricing. No hidden fees.</h2>
            <p className="text-lg text-slate-300 mb-8 max-w-lg leading-relaxed font-medium">
              Whether it's a small backpack or a large surfboard, our pricing is straightforward. Only pay for the time and space you use.
            </p>
            <ul className="flex flex-col gap-4 mb-8">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="text-base font-bold">Starting at just $1 / day</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="text-base font-bold">Discounts for weekly & monthly storage</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="text-base font-bold">$10,000 protection guarantee per booking</span>
              </li>
            </ul>
            <div>
              <Button variant="primary" size="lg" onClick={() => router.push('/book')} className="font-bold py-4 px-8 text-base">
                Book Storage Now
              </Button>
            </div>
          </div>
          <div className="flex-1 w-full bg-[#2E1C14] p-8 rounded-2xl border border-stone-800 shadow-xl">
             <div className="flex justify-between items-center border-b border-stone-700/60 pb-4 mb-4">
                <span className="text-base font-bold text-white">Small Bag / Laptop</span>
                <span className="text-lg font-black text-orange-500">$1.00 / day</span>
             </div>
             <div className="flex justify-between items-center border-b border-stone-700/60 pb-4 mb-4">
                <span className="text-base font-bold text-white">Carry-on Luggage</span>
                <span className="text-lg font-black text-orange-500">$2.00 / day</span>
             </div>
             <div className="flex justify-between items-center pb-2">
                <span className="text-base font-bold text-white">Large Suitcase</span>
                <span className="text-lg font-black text-orange-500">$3.50 / day</span>
             </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#1C130E] text-center mb-16">Trusted by thousands</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex text-amber-500 mb-4">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                "Incredibly easy to use. Dropped off my bags right outside the airport and spent my layover exploring Colombo completely hands-free!"
              </p>
              <p className="text-xs font-bold text-slate-500">— Sarah Jenkins, UK</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex text-amber-500 mb-4">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                "Felt very secure. The staff were professional, and the digital QR pass made pickup super fast!"
              </p>
              <p className="text-xs font-bold text-slate-500">— Mark D., Australia</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex text-amber-500 mb-4">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                "Saved me from lugging 3 heavy suitcases around the city. The booking was seamless and price was unbeatable."
              </p>
              <p className="text-xs font-bold text-slate-500">— Anjali M., India</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-[#1C130E] text-white border-t border-stone-800 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-sm">
              <h4 className="text-2xl font-black mb-3">Stowaway</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Secure luggage storage near Colombo International Airport & city centers. Travel lighter, explore further.
              </p>
            </div>
            <div className="flex gap-12">
              <div className="flex flex-col gap-2">
                <h5 className="text-sm font-bold text-white mb-1">Navigation</h5>
                <Link href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</Link>
                <Link href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link>
                <Link href="/book" className="text-sm text-slate-400 hover:text-white transition-colors">Book Storage</Link>
              </div>
              <div className="flex flex-col gap-2">
                <h5 className="text-sm font-bold text-white mb-1">Account</h5>
                <Link href="/my-bookings" className="text-sm text-slate-400 hover:text-white transition-colors">My Bookings</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-800 mt-12 pt-8 flex justify-between items-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Stowaway. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
