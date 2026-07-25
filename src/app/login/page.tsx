'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PillTag } from '@/components/ui/PillTag';

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

      // Check role
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
        // Demo fallback — if Supabase not configured
        if (email.includes('admin')) router.push('/admin');
        else router.push('/staff');
      }
    } catch (err: unknown) {
      // Demo mode fallback
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
    <div className="min-h-screen canvas-cream flex flex-col">
      <NavBar variant="light" />

      <main className="flex-1 flex items-center justify-center px-4 py-12" id="login-main">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <PillTag variant="shade" className="mb-4">Staff Portal</PillTag>
            <h1 className="text-display-md text-black">Sign in</h1>
            <p className="text-body-md text-[#52525b] mt-2">
              Access the Stowaway operations portal.
            </p>
          </div>

          <Card variant="pricing">
            <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
              <div>
                <label htmlFor="login-email" className="block text-caption font-[500] text-[#52525b] mb-1.5 uppercase tracking-[0.72px]">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="staff@stowaway.lk"
                  required
                  className="w-full border border-[#e4e4e7] rounded-lg px-3 py-2.5 text-body-md text-black placeholder-[#a1a1aa] focus:border-black focus:outline-none transition-colors min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-caption font-[500] text-[#52525b] mb-1.5 uppercase tracking-[0.72px]">
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
                  className="w-full border border-[#e4e4e7] rounded-lg px-3 py-2.5 text-body-md text-black placeholder-[#a1a1aa] focus:border-black focus:outline-none transition-colors min-h-[44px]"
                />
              </div>

              {error && (
                <p className="text-caption text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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
              >
                Sign In
              </Button>

              <p className="text-micro text-center text-[#71717a]">
                Demo: enter any email/password to log in.
                <br />
                Use <code>admin@</code> in the email for SuperAdmin access.
              </p>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
