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
import { EmailVerificationModal } from '@/components/auth/EmailVerificationModal';
import { User, Mail, FileText, Plane, AlertCircle, CheckCircle2 } from 'lucide-react';

const AIRPORT_PICKUP_FEE = 5.00;

function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dynamic API states
  const [itemTiers, setItemTiers] = useState<ItemTier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

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
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailVerified,  setEmailVerified]  = useState(false);
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

  const handleStartEmailVerification = () => {
    if (validatePersonalDetails()) {
      if (emailVerified) {
        setOtpOpen(true);
      } else {
        setEmailModalOpen(true);
      }
    }
  };

  const handleEmailVerifiedSuccess = () => {
    setEmailModalOpen(false);
    setEmailVerified(true);
    setOtpOpen(true);
  };

  const handleBookNow = () => {
    if (bookingStep < 4) {
      setBookingStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleStartEmailVerification();
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
      router.push(`/checkout/demo-${Date.now()}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const dropoffLocation = locations.find(l => l.id === dropoffId) ?? null;
  const pickupLocation  = locations.find(l => l.id === pickupId)  ?? null;
  const hasItems = Object.values(quantities).some(q => q > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1C130E] tracking-tight">Book your storage</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: selectors & wizard */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* 4-Step Progress Indicator */}
            <div className="flex items-center gap-3 mb-2 px-2 text-xs font-bold overflow-x-auto pb-2">
              <span className={`cursor-pointer whitespace-nowrap ${bookingStep >= 1 ? 'text-orange-600' : 'text-slate-400'}`} onClick={() => setBookingStep(1)}>1. Location</span>
              <span className="text-slate-300">—</span>
              <span className={`cursor-pointer whitespace-nowrap ${bookingStep >= 2 ? 'text-orange-600' : 'text-slate-400'}`} onClick={() => bookingStep >= 2 && setBookingStep(2)}>2. Date & Time</span>
              <span className="text-slate-300">—</span>
              <span className={`cursor-pointer whitespace-nowrap ${bookingStep >= 3 ? 'text-orange-600' : 'text-slate-400'}`} onClick={() => bookingStep >= 3 && setBookingStep(3)}>3. Items</span>
              <span className="text-slate-300">—</span>
              <span className={`cursor-pointer whitespace-nowrap ${bookingStep >= 4 ? 'text-orange-600' : 'text-slate-400'}`} onClick={() => bookingStep >= 4 && setBookingStep(4)}>4. Details</span>
            </div>

            <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-2xs">
              
              {/* Step 1: Location */}
              {bookingStep === 1 && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">
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
                      Next: Select Time
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Time */}
              {bookingStep === 2 && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">
                    When do you need storage?
                  </h3>
                  <DateTimePicker
                    dropoffTime={dropoffTime}
                    pickupTime={pickupTime}
                    onDropoffChange={setDropoffTime}
                    onPickupChange={setPickupTime}
                  />
                  <div className="mt-8 flex justify-between">
                    <Button variant="secondary" onClick={() => setBookingStep(1)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={nextStep}
                      disabled={!dropoffTime || !pickupTime || (new Date(pickupTime) <= new Date(dropoffTime))}
                    >
                      Next: Add Items
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Items */}
              {bookingStep === 3 && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">
                    What are you storing?
                  </h3>
                  <ItemSelector
                    tiers={itemTiers}
                    quantities={quantities}
                    onQuantityChange={handleQuantityChange}
                  />
                  <div className="mt-8 flex justify-between">
                    <Button variant="secondary" onClick={() => setBookingStep(2)}>
                      Back
                    </Button>
                    <Button variant="primary" onClick={nextStep} disabled={!hasItems}>
                      Next: Personal Details
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Personal Details Form with Strict Validations */}
              {bookingStep === 4 && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Personal Information
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-6">
                    Please provide your contact info for confirmation & security check-in.
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-orange-600" /> Email Address (for receipt) *
                        </span>
                        {emailVerified && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                      </label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailError(''); setEmailVerified(false); }}
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

                  <div className="mt-8 flex justify-between">
                    <Button variant="secondary" onClick={() => setBookingStep(3)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartEmailVerification}
                    >
                      {emailVerified ? 'Verify Phone & Complete →' : 'Verify Email & Continue →'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary Panel */}
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
                airportPickupFee={AIRPORT_PICKUP_FEE}
                onBookNow={handleBookNow}
                isLoading={bookingLoading}
              />
            </div>
          </div>
        </div>
      </main>

      <EmailVerificationModal
        isOpen={emailModalOpen}
        email={email}
        onClose={() => setEmailModalOpen(false)}
        onVerified={handleEmailVerifiedSuccess}
      />

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
