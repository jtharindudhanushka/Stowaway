'use client';

import React, { useState } from 'react';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { Lock, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

function navigate(path: string, role: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('stowaway_staff_role', role);
    } catch (_) {}
    window.location.assign(path);
  }
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const doLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    if (clean.includes('admin') || clean === 'admin@stowaway.lk') {
      navigate('/admin', 'superadmin');
    } else {
      navigate('/staff', 'staff');
    }
  };

  const quickLogin = (role: 'superadmin' | 'staff') => {
    setLoading(true);
    if (role === 'superadmin') {
      setEmail('admin@stowaway.lk');
      setPassword('StowawayAdmin2026!');
      navigate('/admin', 'superadmin');
    } else {
      setEmail('staff@stowaway.lk');
      setPassword('StowawayStaff2026!');
      navigate('/staff', 'staff');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <NavBar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12" id="login-main">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Portal Sign In</h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Staff &amp; SuperAdmin authentication for Stowaway operations.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl">
            <form onSubmit={doLogin} className="flex flex-col gap-5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@stowaway.lk"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                />
              </div>

              {error && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={loading}
                id="login-submit-btn"
                className="mt-2 py-4 text-base font-black"
              >
                {loading ? 'Signing In...' : 'Sign In to Portal →'}
              </Button>
            </form>

            {/* Quick Access */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-orange-600" /> 1-Tap Portal Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin('superadmin')}
                  className="p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <p className="font-extrabold text-orange-950 flex items-center gap-1 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-600" /> SuperAdmin
                  </p>
                  <p className="text-[10px] text-orange-800 font-mono mt-0.5 truncate">admin@stowaway.lk</p>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('staff')}
                  className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <p className="font-extrabold text-slate-900 flex items-center gap-1 text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-slate-700" /> Operations Staff
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono mt-0.5 truncate">staff@stowaway.lk</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
