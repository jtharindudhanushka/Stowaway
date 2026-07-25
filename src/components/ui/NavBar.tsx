'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { Menu, X } from 'lucide-react';

interface NavBarProps {
  /** Show the staff login button */
  showStaffLogin?: boolean;
  /** Show Book Now CTA */
  showBookNow?: boolean;
  onBookNow?: () => void;
}

export function NavBar({
  showStaffLogin = false,
  showBookNow = false,
  onBookNow,
}: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white text-[#1C130E] sticky top-0 z-40 border-b border-stone-200 shadow-2xs">
      <nav
        className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-[#1C130E] hover:opacity-80 transition-opacity"
        >
          Stowaway
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-stone-700">
          <Link href="/#how-it-works" className="hover:text-orange-600 transition-colors">
            How It Works
          </Link>
          <Link href="/#pricing" className="hover:text-orange-600 transition-colors">
            Pricing
          </Link>
          <Link href="/#locations" className="hover:text-orange-600 transition-colors">
            Locations
          </Link>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {showStaffLogin && (
            <Link href="/login">
              <Button variant="secondary" size="sm" id="nav-staff-login">
                Log in
              </Button>
            </Link>
          )}
          {showBookNow && (
            <Button variant="primary" size="sm" id="nav-book-now" onClick={onBookNow}>
              Book Storage
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-stone-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          id="nav-hamburger"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="bg-white text-[#1C130E] border-t border-stone-200 md:hidden absolute w-full left-0 top-[100%] shadow-xl animate-fade-in"
          id="mobile-menu"
        >
          <div className="flex flex-col p-6 gap-4">
            <Link
              href="/#how-it-works"
              className="text-sm font-bold py-2 hover:text-orange-600"
              onClick={() => setMobileOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-bold py-2 hover:text-orange-600"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/#locations"
              className="text-sm font-bold py-2 hover:text-orange-600"
              onClick={() => setMobileOpen(false)}
            >
              Locations
            </Link>
            
            <div className="pt-4 mt-2 border-t border-stone-200 flex flex-col gap-3">
              {showStaffLogin && (
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" fullWidth id="mobile-nav-login">
                    Log in
                  </Button>
                </Link>
              )}
              {showBookNow && (
                <Button
                  variant="primary"
                  fullWidth
                  id="mobile-nav-book-now"
                  onClick={() => { setMobileOpen(false); onBookNow?.(); }}
                >
                  Book Storage
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
