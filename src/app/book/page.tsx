'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { ItemSelector, type ItemTier } from '@/components/booking/ItemSelector';
import { DateTimePicker } from '@/components/booking/DateTimePicker';
import { LocationSelector, type Location } from '@/components/booking/LocationSelector';
import { AddOnToggle } from '@/components/booking/AddOnToggle';
import { PriceSummaryPanel } from '@/components/booking/PriceSummaryPanel';
import { OtpBottomSheet } from '@/components/auth/OtpBottomSheet';
import { User, Mail, FileText, Plane, AlertCircle } from 'lucide-react';

const AIRPORT_PICKUP_FEE = 5.00;

function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dynamic API states
  const [itemTiers, setItemTiers] = useState<ItemTier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [airportPickupFee, setAirportPickupFee] = useState(5.00);

  // Booking state
  const [quantities,     setQuantities]     = useState<Record<string, number>>({});
  const [dropoffTime,    setDropoffTime]    = useState('');
  const [pickupTime,     setPickupTime]     = useState('');
  const [dropoffId,      setDropoffId]      = useState<string | null>(null);
  const [pickupId,       setPickupId]       = useState<string | null>(null);
  const [airportPickup,  setAirportPickup]  = useState(false);

  // Customer Personal Details state
  const [fullName,       setFullName]       = useState('');
  const [email,          setEmail]          = useState('');
  const [passportNo,     setPassportNo]     = useState('');
  const [specialNotes,   setSpecialNotes]   = useState('');

  // Validation Error States
  const [fullNameError,  setFullNameError]  = useState('');
  const [emailError,     setEmailError]     = useState('');
  const [passportError,  setPassportError]  = useState('');

  // Verification Modal states
  const [otpOpen,        setOtpOpen]        = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // 4-Step Flow: 1. Location -> 2. Time -> 3. Items -> 4. Details
  const [bookingStep,    setBookingStep]    = useState(1);

  // Fetch dynamic catalog data from APIs
  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => setLocations(data.locations || []))
      .catch(console.error);

    fetch('/api/item-tiers')
      .then(res => res.json())
      .then(data => setItemTiers(data.itemTiers || []))
      .catch(console.error);

    fetch('/api/addons')
      .then(res => res.json())
      .then(data => {
        if (data.addons && data.addons.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activeAddon = data.addons.find((a: any) => a.code === 'ADDON_001') || data.addons[0];
          if (activeAddon?.fee_usd) {
            setAirportPickupFee(Number(activeAddon.fee_usd));
          }
        }
      })
      .catch(console.error);
  }, []);

  // Initialize from search params
  useEffect(() => {
    const loc = searchParams.get('loc');
    const dTime = searchParams.get('dropoff');
    const pTime = searchParams.get('pickup');
    
    if (loc) {
      setDropoffId(loc);
      setPickupId(loc);
    }
    if (dTime) setDropoffTime(dTime);
    if (pTime) setPickupTime(pTime);

    if (loc && dTime && pTime) {
      setBookingStep(3);
    } else if (loc) {
      setBookingStep(2);
    }
  }, [searchParams]);

  const nextStep = () => {
    setBookingStep(s => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuantityChange = useCallback((tierId: string, delta: number) => {
    setQuantities(prev => {
      const next = { ...prev };
      const current = next[tierId] ?? 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) delete next[tierId]; else next[tierId] = updated;
      return next;
    });
  }, []);

  const validatePersonalDetails = (): boolean => {
    let isValid = true;
    setFullNameError('');
    setEmailError('');
    setPassportError('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFullNameError('Please enter your full name (at least 2 characters).');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address (e.g. name@example.com).');
      isValid = false;
    }

    if (passportNo.trim() && passportNo.trim().length < 3) {
      setPassportError('Passport / NIC number should be at least 3 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleStartBooking = () => {
    if (validatePersonalDetails()) {
      setOtpOpen(true);
    }
  };

  const handleOtpVerified = async (customerId: string, verifiedPhone: string) => {
    setOtpOpen(false);
    setBookingLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          phone: verifiedPhone,
          fullName,
          email,
          passportNo,
          notes: specialNotes,
          dropoffLocationId: dropoffId,
          pickupLocationId: pickupId,
          dropoffTime,
          pickupTime,
          items: Object.entries(quantities).map(([tierId, qty]) => ({ tierId, qty })),
          airportPickup,
        }),
      });
      const data = await res.json();
      const bookingId = data.bookingId || `bk-${Date.now()}`;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('stowaway_customer_phone', verifiedPhone);
      }
      
      router.push(`/checkout/${bookingId}`);
    } catch (err) {
      console.error(err);
      router.push(`/checkout/bk-${Date.now().toString(36)}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const dropoffLocation = locations.find(l => l.id === dropoffId) ?? null;
  const pickupLocation  = locations.find(l => l.id === pickupId)  ?? null;
  const hasItems = Object.values(quantities).some(q => q > 0);

  const STEP_TITLES = [
    '1. Drop-off & Pick-up Location',
    '2. Storage Dates & Time',
    '3. Storage Items & Quantities',
    '4. Contact & Personal Details',
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1C130E] tracking-tight">Book your storage</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: selectors & wizard */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Clean Mobile & Desktop Progress Indicator */}
            <div className="mb-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {bookingStep}
                  </span>
                  <span className="text-sm font-bold text-[#1C130E] truncate">
                    {STEP_TITLES[bookingStep - 1]}
                  </span>
                </span>
                <span className="text-slate-400 font-bold flex-shrink-0 ml-2">Step {bookingStep} of 4</span>
              </div>

              {/* 4 Segment Progress Bar */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(s => (
                  <button
                    key={s}
                    type="button"
                    disabled={s > bookingStep}
                    onClick={() => setBookingStep(s)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      s <= bookingStep ? 'bg-orange-600' : 'bg-slate-200'
                    }`}
                    title={`Step ${s}`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 sm:p-8 rounded-2xl shadow-2xs">
              
              {/* Step 1: Location */}
              {bookingStep === 1 && (
                <div className="animate-fade-in">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                    Where are you drop-off and pickup?
                  </h3>
                  <LocationSelector
                    locations={locations}
                    dropoffId={dropoffId}
                    pickupId={pickupId}
                    onDropoffChange={setDropoffId}
                    onPickupChange={setPickupId}
                  />
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <AddOnToggle
                      enabled={airportPickup}
                      onChange={setAirportPickup}
                      feeUsd={AIRPORT_PICKUP_FEE}
                    />
                  </div>
                  <div className="mt-8 flex justify-end">
                    <Button variant="primary" size="lg" onClick={nextStep} disabled={!dropoffId || !pickupId}>
                      Select Time →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Time */}
              {bookingStep === 2 && (
                <div className="animate-fade-in">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                    When do you need storage?
                  </h3>
                  <DateTimePicker
                    dropoffTime={dropoffTime}
                    pickupTime={pickupTime}
                    onDropoffChange={setDropoffTime}
                    onPickupChange={setPickupTime}
                  />
                  <div className="mt-8 flex items-center justify-between gap-3">
                    <Button variant="secondary" size="md" onClick={() => setBookingStep(1)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={nextStep}
                      disabled={!dropoffTime || !pickupTime || (new Date(pickupTime) <= new Date(dropoffTime))}
                    >
                      Select Items →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Items */}
              {bookingStep === 3 && (
                <div className="animate-fade-in">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                    What are you storing?
                  </h3>
                  <ItemSelector
                    tiers={itemTiers}
                    quantities={quantities}
                    onQuantityChange={handleQuantityChange}
                  />
                  <div className="mt-8 flex items-center justify-between gap-3">
                    <Button variant="secondary" size="md" onClick={() => setBookingStep(2)}>
                      Back
                    </Button>
                    <Button variant="primary" size="md" onClick={nextStep} disabled={!hasItems}>
                      Enter Details →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Personal Details Form */}
              {bookingStep === 4 && (
                <div className="animate-fade-in">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    Personal Information
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-6">
                    Your digital receipt & QR pass will be sent to your email.
                  </p>

                  <div className="flex flex-col gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-orange-600" /> Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={e => { setFullName(e.target.value); setFullNameError(''); }}
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                          fullNameError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20'
                        }`}
                        required
                      />
                      {fullNameError && (
                        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {fullNameError}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-orange-600" /> Email Address (for receipt) *
                      </label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                          emailError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20'
                        }`}
                        required
                      />
                      {emailError && (
                        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {emailError}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Passport */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" /> Passport / NIC No (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. N1234567"
                          value={passportNo}
                          onChange={e => { setPassportNo(e.target.value); setPassportError(''); }}
                          className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                            passportError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20'
                          }`}
                        />
                        {passportError && (
                          <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {passportError}
                          </p>
                        )}
                      </div>

                      {/* Flight / Special Notes */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5 text-slate-400" /> Flight No / Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. UL 504 arrival"
                          value={specialNotes}
                          onChange={e => setSpecialNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:border-orange-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-600/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3">
                    <Button variant="secondary" size="md" onClick={() => setBookingStep(3)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleStartBooking}
                      loading={bookingLoading}
                    >
                      Verify & Complete →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Pure Summary Panel */}
          <div className="lg:col-span-1 sticky top-24">
            <div>
              <PriceSummaryPanel
                tiers={itemTiers}
                quantities={quantities}
                dropoffTime={dropoffTime}
                pickupTime={pickupTime}
                dropoffLocation={dropoffLocation}
                pickupLocation={pickupLocation}
                airportPickupEnabled={airportPickup}
                airportPickupFee={airportPickupFee}
              />
            </div>
          </div>
        </div>
      </main>

      <OtpBottomSheet
        isOpen={otpOpen}
        onClose={() => setOtpOpen(false)}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold">Loading booking engine...</div>}>
      <BookingWizard />
    </Suspense>
  );
}
