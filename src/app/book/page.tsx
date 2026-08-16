'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { ItemSelector, type ItemTier } from '@/components/booking/ItemSelector';
import { DateTimePicker } from '@/components/booking/DateTimePicker';
import { LocationSelector, type Location } from '@/components/booking/LocationSelector';
import { PriceSummaryPanel } from '@/components/booking/PriceSummaryPanel';
import { InsuranceToggle } from '@/components/booking/InsuranceToggle';
import { SearchableCountrySelect, type CountryOption } from '@/components/booking/SearchableCountrySelect';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { User, Mail, FileText, Plane, AlertCircle, Phone } from 'lucide-react';

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'US', label: 'United States', value: '+1' },
  { code: 'UK', label: 'United Kingdom', value: '+44' },
  { code: 'AU', label: 'Australia', value: '+61' },
  { code: 'IN', label: 'India', value: '+91' },
  { code: 'LK', label: 'Sri Lanka', value: '+94' },
  { code: 'AE', label: 'United Arab Emirates', value: '+971' },
  { code: 'SG', label: 'Singapore', value: '+65' },
  { code: 'MY', label: 'Malaysia', value: '+60' },
  { code: 'MV', label: 'Maldives', value: '+960' },
  { code: 'SA', label: 'Saudi Arabia', value: '+966' },
];

// ─── Step definitions ───────────────────────────────────────────────────────
const STEP_TITLES = [
  '1. Storage Items & Quantities',
  '2. Drop-off & Pick-up Location',
  '3. Storage Dates & Time',
  '4. Contact Details & Insurance',
];

function BookingWizard() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ── Dynamic catalog ──────────────────────────────────────────
  const [itemTiers,      setItemTiers]      = useState<ItemTier[]>([]);
  const [locations,      setLocations]      = useState<Location[]>([]);
  const [airportAddonFee, setAirportAddonFee] = useState(5.00);

  // ── Booking state ────────────────────────────────────────────
  const [quantities,    setQuantities]    = useState<Record<string, number>>({});
  const [dropoffId,     setDropoffId]     = useState<string | null>(null);
  const [pickupId,      setPickupId]      = useState<string | null>(null);
  const [dropoffTime,   setDropoffTime]   = useState('');
  const [pickupTime,    setPickupTime]    = useState('');
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);

  // ── Personal details ─────────────────────────────────────────
  const [fullName,      setFullName]      = useState('');
  const [email,         setEmail]         = useState('');
  const [passportNo,    setPassportNo]    = useState('');
  const [specialNotes,  setSpecialNotes]  = useState('');
  const [countryCode,   setCountryCode]   = useState('+94');
  const [whatsappNo,    setWhatsappNo]    = useState('');

  // ── Validation ───────────────────────────────────────────────
  const [fullNameError, setFullNameError] = useState('');
  const [emailError,    setEmailError]    = useState('');
  const [passportError, setPassportError] = useState('');
  const [whatsappError, setWhatsappError] = useState('');

  // ── UI state ─────────────────────────────────────────────────
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingStep,    setBookingStep]    = useState(1);

  // ── Fetch catalog data ───────────────────────────────────────
  useEffect(() => {
    fetch('/api/locations')
      .then((r) => r.json())
      .then((d) => setLocations(d.locations || []))
      .catch(console.error);

    fetch('/api/item-tiers')
      .then((r) => r.json())
      .then((d) => setItemTiers(d.itemTiers || []))
      .catch(console.error);

    fetch('/api/addons')
      .then((r) => r.json())
      .then((d) => {
        if (d.addons?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const addon = d.addons.find((a: any) => a.code === 'ADDON_001') || d.addons[0];
          if (addon?.fee_usd) setAirportAddonFee(Number(addon.fee_usd));
        }
      })
      .catch(console.error);
  }, []);

  // ── Initialise from search params (deep-link support) ────────
  useEffect(() => {
    const loc   = searchParams.get('loc');
    const dTime = searchParams.get('dropoff');
    const pTime = searchParams.get('pickup');
    if (loc)   { setDropoffId(loc); setPickupId(loc); }
    if (dTime)   setDropoffTime(dTime);
    if (pTime)   setPickupTime(pTime);

    // Skip to appropriate step if params present
    if (loc && dTime && pTime) setBookingStep(3);
    else if (loc)              setBookingStep(2);
  }, [searchParams]);

  // ── Persistent state ─────────────────────────────────────────
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    const saved = sessionStorage.getItem('stowaway_booking_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.quantities) setQuantities(state.quantities);
        if (state.dropoffId) setDropoffId(state.dropoffId);
        if (state.pickupId) setPickupId(state.pickupId);
        if (state.dropoffTime) setDropoffTime(state.dropoffTime);
        if (state.pickupTime) setPickupTime(state.pickupTime);
        if (state.insuranceEnabled !== undefined) setInsuranceEnabled(state.insuranceEnabled);
        if (state.fullName) setFullName(state.fullName);
        if (state.email) setEmail(state.email);
        if (state.passportNo) setPassportNo(state.passportNo);
        if (state.specialNotes) setSpecialNotes(state.specialNotes);
        if (state.countryCode) setCountryCode(state.countryCode);
        if (state.whatsappNo) setWhatsappNo(state.whatsappNo);
        if (state.bookingStep) setBookingStep(state.bookingStep);
      } catch(e) {}
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    sessionStorage.setItem('stowaway_booking_state', JSON.stringify({
      quantities, dropoffId, pickupId, dropoffTime, pickupTime,
      insuranceEnabled, fullName, email, passportNo, specialNotes,
      countryCode, whatsappNo, bookingStep
    }));
  }, [quantities, dropoffId, pickupId, dropoffTime, pickupTime, insuranceEnabled, fullName, email, passportNo, specialNotes, countryCode, whatsappNo, bookingStep, hasLoaded]);

  // ── Derived values ───────────────────────────────────────────
  const dropoffLocation = locations.find((l) => l.id === dropoffId) ?? null;
  const pickupLocation  = locations.find((l) => l.id === pickupId)  ?? null;

  const airportServiceFee = 0;

  const hasItems = Object.values(quantities).some((q) => q > 0);

  // ── Navigation ───────────────────────────────────────────────
  const nextStep = () => {
    setBookingStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const prevStep = (n: number) => {
    setBookingStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Quantity handlers ────────────────────────────────────────
  const handleQuantityChange = useCallback((tierId: string, delta: number) => {
    setQuantities((prev) => {
      const next    = { ...prev };
      const updated = Math.max(0, (next[tierId] ?? 0) + delta);
      if (updated === 0) delete next[tierId];
      else next[tierId] = updated;
      return next;
    });
  }, []);

  // ── Validation ───────────────────────────────────────────────
  const validatePersonalDetails = (): boolean => {
    let valid = true;
    setFullNameError('');
    setEmailError('');
    setPassportError('');
    setWhatsappError('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFullNameError('Please enter your full name (at least 2 characters).');
      valid = false;
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRx.test(email.trim())) {
      setEmailError('Please enter a valid email address (e.g. name@example.com).');
      valid = false;
    }
    if (!passportNo.trim() || passportNo.trim().length < 3) {
      setPassportError('Please enter your Passport / NIC number (at least 3 characters).');
      valid = false;
    }
    const fullPhone = `${countryCode}${whatsappNo.replace(/\D/g, '')}`;
    if (!whatsappNo.trim() || !isValidPhoneNumber(fullPhone)) {
      setWhatsappError('Please enter a valid WhatsApp number for the selected country.');
      valid = false;
    }
    return valid;
  };

  const handleStartBooking = async () => {
    if (!validatePersonalDetails()) return;
    
    setBookingLoading(true);
    const verifiedPhone = `${countryCode}${whatsappNo.replace(/\D/g, '')}`;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: verifiedPhone,
          fullName,
          email,
          passportNo,
          notes: specialNotes,
          dropoffLocationId: dropoffId,
          pickupLocationId:  pickupId,
          dropoffTime,
          pickupTime,
          items: Object.entries(quantities).map(([tierId, qty]) => ({ tierId, qty })),
          insuranceEnabled,
        }),
      });
      const data      = await res.json();
      const bookingId = data.bookingId || `bk-${Date.now()}`;

      if (typeof window !== 'undefined') {
        localStorage.setItem('stowaway_customer_phone', verifiedPhone);
        sessionStorage.removeItem('stowaway_booking_state');
      }

      router.push(`/checkout/${bookingId}`);
    } catch (err) {
      console.error(err);
      router.push(`/checkout/bk-${Date.now().toString(36)}`);
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1C130E] tracking-tight">
            Book your storage
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── Left: Wizard ──────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Progress indicator */}
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
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((s) => (
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

              {/* ── Step 1: Items ──────────────────────────────── */}
              {bookingStep === 1 && (
                <div className="animate-fade-in">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    What are you storing?
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-6">
                    Select the items and quantities you want to store.
                  </p>
                  <ItemSelector
                    tiers={itemTiers}
                    quantities={quantities}
                    onQuantityChange={handleQuantityChange}
                  />
                  <div className="mt-8 flex justify-end">
                    <Button variant="primary" size="lg" onClick={nextStep} disabled={!hasItems}>
                      Select Location →
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Location ───────────────────────────── */}
              {bookingStep === 2 && (
                <div className="animate-fade-in">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                    Where are you dropping off & picking up?
                  </h3>
                  <LocationSelector
                    locations={locations}
                    dropoffId={dropoffId}
                    pickupId={pickupId}
                    onDropoffChange={setDropoffId}
                    onPickupChange={setPickupId}
                  />
                  <div className="mt-8 flex items-center justify-between gap-3">
                    <Button variant="secondary" size="md" onClick={() => prevStep(1)}>Back</Button>
                    <Button variant="primary" size="md" onClick={nextStep} disabled={!dropoffId || !pickupId}>
                      Select Time →
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Time ───────────────────────────────── */}
              {bookingStep === 3 && (
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
                    <Button variant="secondary" size="md" onClick={() => prevStep(2)}>Back</Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={nextStep}
                      disabled={!dropoffTime || !pickupTime || new Date(pickupTime) < new Date(dropoffTime)}
                    >
                      Enter Details →
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 4: Details + Insurance ────────────────── */}
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
                          onChange={(e) => { setFullName(e.target.value); setFullNameError(''); }}
                          className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                            fullNameError
                              ? 'border-red-500 ring-2 ring-red-500/20'
                              : 'border-slate-300 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20'
                          }`}
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
                          onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                          className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                            emailError
                              ? 'border-red-500 ring-2 ring-red-500/20'
                              : 'border-slate-300 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20'
                          }`}
                        />
                        {emailError && (
                          <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {emailError}
                          </p>
                        )}
                      </div>

                      {/* WhatsApp */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-orange-600" /> WhatsApp Number *
                        </label>
                        <div className="flex gap-3">
                          <div className="w-[140px] flex-shrink-0">
                            <SearchableCountrySelect
                              options={COUNTRY_OPTIONS}
                              value={countryCode}
                              onChange={setCountryCode}
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="tel"
                              placeholder="77 123 4567"
                              value={whatsappNo}
                              onChange={(e) => { setWhatsappNo(e.target.value); setWhatsappError(''); }}
                              className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                                whatsappError
                                  ? 'border-red-500 ring-2 ring-red-500/20'
                                  : 'border-slate-300 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20'
                              }`}
                            />
                          </div>
                        </div>
                        {whatsappError && (
                          <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {whatsappError}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Passport */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-orange-600" /> Passport / NIC Number *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. N1234567"
                          value={passportNo}
                          onChange={(e) => { setPassportNo(e.target.value); setPassportError(''); }}
                          className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                            passportError
                              ? 'border-red-500 ring-2 ring-red-500/20'
                              : 'border-slate-300 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20'
                          }`}
                        />
                        {passportError && (
                          <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {passportError}
                          </p>
                        )}
                      </div>
                      {/* Arrival Flight Number */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5 text-slate-400" /> Arrival Flight Number (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. UL 504"
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 focus:border-orange-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-600/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* ── Insurance toggle (above total) ───────── */}
                    <div className="pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Insurance Add-on
                      </p>
                      <InsuranceToggle
                        enabled={insuranceEnabled}
                        onChange={setInsuranceEnabled}
                        tiers={itemTiers}
                        quantities={quantities}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3">
                    <Button variant="secondary" size="md" onClick={() => prevStep(3)}>Back</Button>
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

          {/* ── Right: Price Summary ───────────────────────────── */}
          <div className="lg:col-span-1 sticky top-24">
            <PriceSummaryPanel
              tiers={itemTiers}
              quantities={quantities}
              dropoffTime={dropoffTime}
              pickupTime={pickupTime}
              dropoffLocation={dropoffLocation}
              pickupLocation={pickupLocation}
              airportServiceFee={airportServiceFee}
              insuranceEnabled={insuranceEnabled}
            />
          </div>
        </div>
      </main>
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
