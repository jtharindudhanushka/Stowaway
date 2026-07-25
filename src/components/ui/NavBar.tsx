'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { Menu, X } from 'lucide-react';

type NavVariant = 'dark' | 'light';

interface NavBarProps {
  variant?: NavVariant;
  /** Show the staff login button */
  showStaffLogin?: boolean;
  /** Show Book Now CTA */
  showBookNow?: boolean;
  onBookNow?: () => void;
}

export function NavBar({
  variant = 'dark',
  showStaffLogin = false,
  showBookNow = false,
  onBookNow,
}: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = variant === 'dark';

  const navBg    = isDark ? 'bg-black'  : 'bg-white';
  const textCol  = isDark ? 'text-white' : 'text-black';
  const borderCol = isDark ? 'border-[#1e2c31]' : 'border-[#e4e4e7]';
  const menuBg   = isDark ? 'bg-black' : 'bg-white';

  return (
    <header
      className={`${navBg} ${textCol} border-b ${borderCol} sticky top-0 z-50`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <nav
        className="container-content flex items-center justify-between"
        style={{ padding: '16px 24px' }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className={`text-heading-xl font-[Inter_Display,Inter,sans-serif] font-light tracking-tight ${textCol} hover:opacity-80 transition-opacity`}
          style={{ fontWeight: 300, letterSpacing: '-0.5px', fontFeatureSettings: '"ss03"' }}
        >
          Stowaway
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-body-md">
          <Link href="#how-it-works" className={`${textCol} opacity-70 hover:opacity-100 transition-opacity`}>
            How It Works
          </Link>
          <Link href="#pricing" className={`${textCol} opacity-70 hover:opacity-100 transition-opacity`}>
            Pricing
          </Link>
          <Link href="#locations" className={`${textCol} opacity-70 hover:opacity-100 transition-opacity`}>
            Locations
          </Link>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {showStaffLogin && (
            <Link href="/login">
              <Button variant={isDark ? 'outline-dark' : 'outline-light'} size="sm" id="nav-staff-login">
                Staff Login
              </Button>
            </Link>
          )}
          {showBookNow && (
            <Button variant="aloe" size="sm" id="nav-book-now" onClick={onBookNow}>
              Book Now
            </Button>
          )}
          {!showStaffLogin && !showBookNow && (
            <Link href="/login">
              <Button variant={isDark ? 'outline-dark' : 'outline-light'} size="sm" id="nav-login">
                Staff Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden ${textCol} p-2 rounded-lg hover:bg-white/10 transition-colors`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          id="nav-hamburger"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={`${menuBg} ${textCol} border-t ${borderCol} md:hidden animate-fade-in`}
          id="mobile-menu"
        >
          <div className="container-content py-4 flex flex-col gap-4" style={{ padding: '16px 24px' }}>
            <Link
              href="#how-it-works"
              className={`${textCol} opacity-70 hover:opacity-100 transition-opacity text-body-md py-2`}
              onClick={() => setMobileOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className={`${textCol} opacity-70 hover:opacity-100 transition-opacity text-body-md py-2`}
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#locations"
              className={`${textCol} opacity-70 hover:opacity-100 transition-opacity text-body-md py-2`}
              onClick={() => setMobileOpen(false)}
            >
              Locations
            </Link>
            <div className="pt-2 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button
                  variant={isDark ? 'outline-dark' : 'outline-light'}
                  fullWidth
                  id="mobile-nav-login"
                >
                  Staff Login
                </Button>
              </Link>
              {showBookNow && (
                <Button
                  variant="aloe"
                  fullWidth
                  id="mobile-nav-book-now"
                  onClick={() => { setMobileOpen(false); onBookNow?.(); }}
                >
                  Book Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
