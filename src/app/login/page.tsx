'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { Lock, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router   = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Check official seed accounts first
      if (cleanEmail === 'admin@stowaway.lk' && cleanPassword === 'StowawayAdmin2026!') {
        if (typeof window !== 'undefined') localStorage.setItem('stowaway_staff_role', 'superadmin');
        router.push('/admin');
        return;
      }

      if (cleanEmail === 'staff@stowaway.lk' && cleanPassword === 'StowawayStaff2026!') {
        if (typeof window !== 'undefined') localStorage.setItem('stowaway_staff_role', 'staff');
        router.push('/staff');
        return;
      }

      // 2. Authenticate against Supabase Auth if configured
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) throw authError;

      if (data?.user) {
        const { data: staffRecord } = await supabase
          .from('staff')
          .select('role')
          .eq('user_id', data.user.id)
          .single() as { data: { role: string } | null };

        if (staffRecord?.role === 'superadmin') {
          if (typeof window !== 'undefined') localStorage.setItem('stowaway_staff_role', 'superadmin');
          router.push('/admin');
        } else {
          if (typeof window !== 'undefined') localStorage.setItem('stowaway_staff_role', 'staff');
          router.push('/staff');
        }
        return;
      }

      // If credentials do not match any seed or DB user, reject login (NO BYPASS!)
      throw new Error('Invalid credentials. Please enter a valid staff or superadmin email and password.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickCreds = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError('');
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
            <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>
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
                  required
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
                id="login-submit-btn"
                className="mt-2 py-4 text-base font-black shadow-xs"
              >
                Sign In to Portal →
              </Button>
            </form>

            {/* Official Seed Accounts Info Box */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-orange-600" /> Production Seed Accounts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setQuickCreds('admin@stowaway.lk', 'StowawayAdmin2026!')}
                  className="p-3 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <p className="font-extrabold text-slate-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-600" /> SuperAdmin
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">admin@stowaway.lk</p>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCreds('staff@stowaway.lk', 'StowawayStaff2026!')}
                  className="p-3 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <p className="font-extrabold text-slate-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-700" /> Operational Staff
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">staff@stowaway.lk</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
