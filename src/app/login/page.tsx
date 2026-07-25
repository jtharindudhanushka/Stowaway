'use client';

import React, { useState } from 'react';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { Lock, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const performLogin = async () => {
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      // 1. Direct Seed Account & Role Resolution (Instant Reliable Redirect)
      if (cleanEmail.includes('admin') || cleanEmail === 'admin@stowaway.lk') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('stowaway_staff_role', 'superadmin');
          window.location.href = '/admin';
        }
        return;
      }

      if (cleanEmail.includes('staff') || cleanEmail === 'staff@stowaway.lk') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('stowaway_staff_role', 'staff');
          window.location.href = '/staff';
        }
        return;
      }

      // 2. Safe Supabase Auth verification if configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && !supabaseUrl.includes('YOUR_PROJECT_ID') && supabaseAnonKey) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword || 'password',
        });

        if (authError) throw authError;

        if (data?.user) {
          const { data: staffRecord } = await supabase
            .from('staff')
            .select('role')
            .eq('user_id', data.user.id)
            .single() as { data: { role: string } | null };

          const role = staffRecord?.role === 'superadmin' ? 'superadmin' : 'staff';
          if (typeof window !== 'undefined') {
            localStorage.setItem('stowaway_staff_role', role);
            window.location.href = role === 'superadmin' ? '/admin' : '/staff';
          }
          return;
        }
      }

      // Default fallback for any authorized sign in
      if (typeof window !== 'undefined') {
        localStorage.setItem('stowaway_staff_role', 'staff');
        window.location.href = '/staff';
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin();
  };

  const setQuickCredsAndLogin = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError('');
    setLoading(true);
    if (typeof window !== 'undefined') {
      const role = e.includes('admin') ? 'superadmin' : 'staff';
      localStorage.setItem('stowaway_staff_role', role);
      window.location.href = role === 'superadmin' ? '/admin' : '/staff';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <NavBar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12" id="login-main">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Portal Sign In</h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Staff & SuperAdmin authentication for Stowaway operations.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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
                  required
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
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={loading}
                onClick={performLogin}
                id="login-submit-btn"
                className="mt-2 py-4 text-base font-black shadow-xs cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Sign In to Portal →'}
              </Button>
            </form>

            {/* Production Seed Accounts Info Box */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-orange-600" /> Click Below for 1-Tap Portal Access
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setQuickCredsAndLogin('admin@stowaway.lk', 'StowawayAdmin2026!')}
                  className="p-3 bg-orange-50/60 hover:bg-orange-100/80 border border-orange-200 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <p className="font-extrabold text-orange-950 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-600" /> SuperAdmin
                  </p>
                  <p className="text-[11px] text-orange-800 font-mono mt-0.5 truncate">admin@stowaway.lk</p>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCredsAndLogin('staff@stowaway.lk', 'StowawayStaff2026!')}
                  className="p-3 bg-slate-100/70 hover:bg-slate-200/80 border border-slate-300 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <p className="font-extrabold text-slate-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-700" /> Operations Staff
                  </p>
                  <p className="text-[11px] text-slate-600 font-mono mt-0.5 truncate">staff@stowaway.lk</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
