'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { X, Smartphone, Key } from 'lucide-react';

interface OtpBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (customerId: string, phone: string) => void;
}

type Step = 'phone' | 'otp';

interface CountryCodeItem {
  value: string;
  label: string;
  code: string;
  placeholder: string;
  minDigits: number;
}

const ALL_COUNTRY_CODES: CountryCodeItem[] = [
  { value: '+94',  label: '🇱🇰 +94 (Sri Lanka)', code: '+94', placeholder: '71 234 5678', minDigits: 9 },
  { value: '+1',   label: '🇺🇸 +1 (United States)', code: '+1', placeholder: '(555) 000-0000', minDigits: 10 },
  { value: '+44',  label: '🇬🇧 +44 (United Kingdom)', code: '+44', placeholder: '7123 456789', minDigits: 10 },
  { value: '+61',  label: '🇦🇺 +61 (Australia)', code: '+61', placeholder: '0412 345 678', minDigits: 9 },
  { value: '+49',  label: '🇩🇪 +49 (Germany)', code: '+49', placeholder: '151 23456789', minDigits: 10 },
  { value: '+91',  label: '🇮🇳 +91 (India)', code: '+91', placeholder: '98765 43210', minDigits: 10 },
  { value: '+33',  label: '🇫🇷 +33 (France)', code: '+33', placeholder: '6 12 34 56 78', minDigits: 9 },
  { value: '+81',  label: '🇯🇵 +81 (Japan)', code: '+81', placeholder: '90 1234 5678', minDigits: 10 },
  { value: '+971', label: '🇦🇪 +971 (UAE)', code: '+971', placeholder: '50 123 4567', minDigits: 9 },
  { value: '+65',  label: '🇸🇬 +65 (Singapore)', code: '+65', placeholder: '8123 4567', minDigits: 8 },
  { value: '+1-CA',label: '🇨🇦 +1 (Canada)', code: '+1', placeholder: '(416) 000-0000', minDigits: 10 },
  { value: '+60',  label: '🇲🇾 +60 (Malaysia)', code: '+60', placeholder: '12 345 6789', minDigits: 9 },
  { value: '+31',  label: '🇳🇱 +31 (Netherlands)', code: '+31', placeholder: '6 12345678', minDigits: 9 },
  { value: '+41',  label: '🇨🇭 +41 (Switzerland)', code: '+41', placeholder: '79 123 45 67', minDigits: 9 },
  { value: '+64',  label: '🇳🇿 +64 (New Zealand)', code: '+64', placeholder: '21 123 4567', minDigits: 8 },
  { value: '+39',  label: '🇮🇹 +39 (Italy)', code: '+39', placeholder: '312 345 6789', minDigits: 10 },
  { value: '+34',  label: '🇪🇸 +34 (Spain)', code: '+34', placeholder: '612 34 56 78', minDigits: 9 },
  { value: '+46',  label: '🇸🇪 +46 (Sweden)', code: '+46', placeholder: '70 123 45 67', minDigits: 9 },
  { value: '+82',  label: '🇰🇷 +82 (South Korea)', code: '+82', placeholder: '10 1234 5678', minDigits: 10 },
  { value: '+86',  label: '🇨🇳 +86 (China)', code: '+86', placeholder: '138 0013 8000', minDigits: 11 },
  { value: '+66',  label: '🇹🇭 +66 (Thailand)', code: '+66', placeholder: '81 234 5678', minDigits: 9 },
  { value: '+62',  label: '🇮🇩 +62 (Indonesia)', code: '+62', placeholder: '812 3456 7890', minDigits: 10 },
  { value: '+84',  label: '🇻🇳 +84 (Vietnam)', code: '+84', placeholder: '91 234 5678', minDigits: 9 },
  { value: '+63',  label: '🇵🇭 +63 (Philippines)', code: '+63', placeholder: '917 123 4567', minDigits: 10 },
  { value: '+966', label: '🇸🇦 +966 (Saudi Arabia)', code: '+966', placeholder: '50 123 4567', minDigits: 9 },
  { value: '+974', label: '🇶🇦 +974 (Qatar)', code: '+974', placeholder: '5512 3456', minDigits: 8 },
  { value: '+965', label: '🇰🇼 +965 (Kuwait)', code: '+965', placeholder: '9012 3456', minDigits: 8 },
  { value: '+968', label: '🇴🇲 +968 (Oman)', code: '+968', placeholder: '9123 4567', minDigits: 8 },
  { value: '+973', label: '🇧🇭 +973 (Bahrain)', code: '+973', placeholder: '3912 3456', minDigits: 8 },
  { value: '+27',  label: '🇿🇦 +27 (South Africa)', code: '+27', placeholder: '71 234 5678', minDigits: 9 },
  { value: '+55',  label: '🇧🇷 +55 (Brazil)', code: '+55', placeholder: '11 91234-5678', minDigits: 11 },
  { value: '+52',  label: '🇲🇽 +52 (Mexico)', code: '+52', placeholder: '55 1234 5678', minDigits: 10 },
  { value: '+54',  label: '🇦🇷 +54 (Argentina)', code: '+54', placeholder: '9 11 1234-5678', minDigits: 10 },
  { value: '+90',  label: '🇹🇷 +90 (Turkey)', code: '+90', placeholder: '501 234 5678', minDigits: 10 },
  { value: '+353', label: '🇮🇪 +353 (Ireland)', code: '+353', placeholder: '83 123 4567', minDigits: 9 },
  { value: '+32',  label: '🇧🇪 +32 (Belgium)', code: '+32', placeholder: '470 12 34 56', minDigits: 9 },
  { value: '+43',  label: '🇦🇹 +43 (Austria)', code: '+43', placeholder: '650 1234567', minDigits: 9 },
  { value: '+45',  label: '🇩🇰 +45 (Denmark)', code: '+45', placeholder: '20 12 34 56', minDigits: 8 },
  { value: '+47',  label: '🇳🇴 +47 (Norway)', code: '+47', placeholder: '401 23 456', minDigits: 8 },
  { value: '+358', label: '🇫🇮 +358 (Finland)', code: '+358', placeholder: '40 123 4567', minDigits: 9 },
  { value: '+48',  label: '🇵🇱 +48 (Poland)', code: '+48', placeholder: '501 234 567', minDigits: 9 },
  { value: '+351', label: '🇵🇹 +351 (Portugal)', code: '+351', placeholder: '912 345 678', minDigits: 9 },
  { value: '+30',  label: '🇬🇷 +30 (Greece)', code: '+30', placeholder: '691 234 5678', minDigits: 10 },
  { value: '+420', label: '🇨🇿 +420 (Czechia)', code: '+420', placeholder: '601 123 456', minDigits: 9 },
  { value: '+36',  label: '🇭🇺 +36 (Hungary)', code: '+36', placeholder: '20 123 4567', minDigits: 9 },
  { value: '+972', label: '🇮🇱 +972 (Israel)', code: '+972', placeholder: '50 123 4567', minDigits: 9 },
  { value: '+20',  label: '🇪🇬 +20 (Egypt)', code: '+20', placeholder: '100 123 4567', minDigits: 10 },
  { value: '+212', label: '🇲🇦 +212 (Morocco)', code: '+212', placeholder: '612 345 678', minDigits: 9 },
  { value: '+960', label: '🇲🇻 +960 (Maldives)', code: '+960', placeholder: '712 3456', minDigits: 7 },
];

export function OtpBottomSheet({ isOpen, onClose, onVerified }: OtpBottomSheetProps) {
  const [step, setStep]               = useState<Step>('phone');
  const [countryCode, setCountryCode] = useState('+94');
  const [phone, setPhone]             = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '']);
  const [demoCode, setDemoCode]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const inputRefs                     = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const phoneRef                      = useRef<HTMLInputElement>(null);

  const selectedCountry = ALL_COUNTRY_CODES.find(c => c.value === countryCode) || ALL_COUNTRY_CODES[0];
  const fullPhoneNumber = `${selectedCountry.code} ${phone.trim()}`;

  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhone('');
      setOtp(['', '', '', '']);
      setDemoCode('');
      setError('');
      setTimeout(() => phoneRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs[0].current?.focus(), 150);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSendOtp = async () => {
    setError('');
    const cleanDigits = phone.replace(/\D/g, '');
    if (!phone.trim() || cleanDigits.length < selectedCountry.minDigits - 2) {
      setError(`Please enter a valid phone number (e.g. ${selectedCountry.placeholder}).`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send OTP');
      setDemoCode(data.demoCode ?? '');
      setStep('otp');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) inputRefs[index + 1].current?.focus();
    if (next.every(d => d !== '') && value) {
      handleVerifyOtp(next.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride ?? otp.join('');
    if (code.length < 4) { setError('Enter all 4 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Invalid OTP');
      onVerified(data.customerId, fullPhoneNumber);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
      setOtp(['', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
      {/* Background Scrim */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Phone verification"
        className="relative z-10 w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl animate-scale-in"
        id="otp-modal-card"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-100 rounded-t-3xl md:rounded-t-2xl bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Phone Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 bg-white rounded-b-3xl md:rounded-b-2xl">
          {step === 'phone' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-slate-900">
                Enter your mobile number
              </h2>
              <p className="text-sm text-slate-500 mt-1 mb-6 leading-relaxed">
                We'll send a 4-digit SMS code to confirm your reservation.
              </p>

              <label htmlFor="otp-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Country & Phone Number
              </label>

              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <div className="w-full sm:w-44 flex-shrink-0">
                  <CustomSelect
                    options={ALL_COUNTRY_CODES}
                    value={countryCode}
                    onChange={setCountryCode}
                    minDropdownWidth="280px"
                  />
                </div>
                <input
                  ref={phoneRef}
                  id="otp-phone"
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  placeholder={selectedCountry.placeholder}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-orange-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-600/20 transition-all"
                  autoComplete="tel"
                />
              </div>

              {error && <p className="text-xs font-semibold text-red-600 mt-2">{error}</p>}

              <Button
                variant="primary"
                fullWidth
                size="lg"
                className="mt-6 font-bold py-4 text-base"
                onClick={handleSendOtp}
                loading={loading}
                id="send-otp-btn"
              >
                Send Verification Code
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-slate-900">
                Enter 4-digit code
              </h2>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Code sent to <strong className="text-slate-900">{fullPhoneNumber}</strong>
              </p>

              {/* Demo code display */}
              {demoCode && (
                <div className="flex items-center gap-3 mb-6 p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
                  <Key className="w-5 h-5 text-amber-700 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Demo Verification PIN</p>
                    <span className="text-xl font-bold tracking-widest font-mono text-amber-950">{demoCode}</span>
                  </div>
                </div>
              )}

              {/* 4-digit OTP inputs */}
              <div
                className="flex gap-3 justify-center my-6"
                role="group"
                aria-label="OTP code input"
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={inputRefs[i]}
                    id={`otp-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={[
                      'w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all tabular-nums',
                      digit
                        ? 'border-orange-600 bg-orange-50 text-orange-950 shadow-2xs'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none',
                    ].join(' ')}
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  />
                ))}
              </div>

              {error && <p className="text-xs font-semibold text-red-600 text-center mb-4">{error}</p>}

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => handleVerifyOtp()}
                loading={loading}
                disabled={otp.some(d => !d)}
                id="verify-otp-btn"
                className="font-bold py-4 text-base"
              >
                Verify & Complete Booking
              </Button>

              <button
                className="w-full text-center text-xs font-semibold text-slate-500 mt-4 hover:text-slate-900 transition-colors cursor-pointer"
                onClick={() => { setStep('phone'); setOtp(['', '', '', '']); setError(''); }}
                id="change-phone-btn"
              >
                ← Change phone number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
