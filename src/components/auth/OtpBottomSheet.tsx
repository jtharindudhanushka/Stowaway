'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PillTag } from '@/components/ui/PillTag';

interface OtpBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (customerId: string, phone: string) => void;
}

type Step = 'phone' | 'otp';

export function OtpBottomSheet({ isOpen, onClose, onVerified }: OtpBottomSheetProps) {
  const [step, setStep]           = useState<Step>('phone');
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState(['', '', '', '']);
  const [demoCode, setDemoCode]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const inputRefs                 = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const phoneRef                  = useRef<HTMLInputElement>(null);

  // Reset on open
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

  // Auto-focus first OTP digit on step change
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs[0].current?.focus(), 150);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSendOtp = async () => {
    setError('');
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
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
    // Auto-verify when all 4 filled
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
        body: JSON.stringify({ phone: phone.trim(), code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Invalid OTP');
      onVerified(data.customerId, phone.trim());
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
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Phone verification"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl animate-slide-up"
        style={{ maxHeight: '90dvh', overflowY: 'auto' }}
        id="otp-bottom-sheet"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#d4d4d8] rounded-full" />
        </div>

        <div className="px-6 pt-2 pb-8">
          {step === 'phone' && (
            <div className="animate-fade-in">
              <h2 className="text-heading-xl font-[500] text-black mt-2">
                Verify your number
              </h2>
              <p className="text-body-md text-[#52525b] mt-2 mb-6">
                We&apos;ll send a 4-digit code to confirm your booking.
              </p>

              <label htmlFor="otp-phone" className="block text-caption font-[500] text-[#52525b] mb-2 uppercase tracking-[0.72px]">
                Mobile number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 border border-[#e4e4e7] rounded-lg bg-[#f4f4f5] text-body-md text-[#52525b] whitespace-nowrap">
                  🇱🇰 +94
                </div>
                <input
                  ref={phoneRef}
                  id="otp-phone"
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  placeholder="71 234 5678"
                  className="flex-1 border border-[#e4e4e7] rounded-lg px-3 py-2.5 text-body-md text-black placeholder-[#a1a1aa] focus:border-black focus:outline-none transition-colors"
                  autoComplete="tel"
                />
              </div>

              {error && <p className="text-caption text-red-600 mt-2">{error}</p>}

              <Button
                variant="primary"
                fullWidth
                size="lg"
                className="mt-6"
                onClick={handleSendOtp}
                loading={loading}
                id="send-otp-btn"
              >
                Send Code
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="animate-fade-in">
              <h2 className="text-heading-xl font-[500] text-black mt-2">
                Enter your code
              </h2>
              <p className="text-body-md text-[#52525b] mt-2 mb-2">
                Code sent to <strong>{phone}</strong>
              </p>

              {/* Demo code display */}
              {demoCode && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-[#d4f9e0] rounded-lg">
                  <span className="text-lg">🔑</span>
                  <div>
                    <p className="text-micro text-[#52525b] uppercase tracking-widest">Demo mode — your code</p>
                    <div className="flex items-center gap-2 mt-1">
                      <PillTag variant="shade">
                        <span className="text-lg font-[700] tracking-[8px] font-mono">{demoCode}</span>
                      </PillTag>
                    </div>
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
                      'w-14 h-16 text-center text-2xl font-[600] rounded-xl border-2 transition-all',
                      '[font-feature-settings:"ss03"] tabular-nums',
                      digit
                        ? 'border-black bg-[#c1fbd4] text-black'
                        : 'border-[#e4e4e7] bg-white text-black focus:border-black focus:outline-none',
                    ].join(' ')}
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  />
                ))}
              </div>

              {error && <p className="text-caption text-red-600 text-center mb-3">{error}</p>}

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => handleVerifyOtp()}
                loading={loading}
                disabled={otp.some(d => !d)}
                id="verify-otp-btn"
              >
                Verify & Continue
              </Button>

              <button
                className="w-full text-center text-caption text-[#71717a] mt-3 hover:text-black transition-colors"
                onClick={() => { setStep('phone'); setOtp(['', '', '', '']); setError(''); }}
                id="change-phone-btn"
              >
                Change number
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
