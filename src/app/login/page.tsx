'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: staffRecord } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', data.user?.id ?? '')
        .single() as { data: { role: string } | null };

      if (staffRecord?.role === 'superadmin') {
        router.push('/admin');
      } else if (staffRecord?.role === 'staff') {
        router.push('/staff');
      } else {
        if (email.includes('admin')) router.push('/admin');
        else router.push('/staff');
      }
    } catch (err: unknown) {
      if (email && password) {
        if (email.includes('admin')) router.push('/admin');
        else router.push('/staff');
        return;
      }
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <NavBar />

      <main className="flex-1 flex items-center justify-center px-6 py-16" id="login-main">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff Sign In</h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Access the Stowaway operations & management portal.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
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
                  placeholder="staff@stowaway.lk"
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
                className="mt-2 py-4 text-base font-extrabold shadow-xs"
              >
                Sign In to Portal
              </Button>

              <p className="text-xs text-center text-slate-400 font-medium mt-2 leading-relaxed">
                Demo Mode: Enter any email to log in.
                <br />
                Use <code className="text-orange-600 font-bold">admin@</code> in the email for SuperAdmin control panel.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
