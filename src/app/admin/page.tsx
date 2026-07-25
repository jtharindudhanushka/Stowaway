'use client';

import React, { useState, useEffect } from 'react';
import { NavBar } from '@/components/ui/NavBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Luggage, MapPin, Plane, ClipboardList, Clock, Plus, Trash2, LogOut, Shield } from 'lucide-react';
import { getTimeSlots, saveTimeSlots, TimeSlot } from '@/lib/timeSlots';
import { createClient } from '@/lib/supabase/client';

type AdminTab = 'item-tiers' | 'locations' | 'addons' | 'time-slots' | 'audit-log';

// Demo data
const ITEM_TIERS = [
  { id: 'item-001', code: 'ITEM_001', name: 'Small Bag / Documents',  rateDailyUsd: 1.00, rateWeeklyUsd: 5.00,  rateMonthlyUsd: 25.00,  isActive: true  },
  { id: 'item-002', code: 'ITEM_002', name: 'Carry-On Luggage',       rateDailyUsd: 2.00, rateWeeklyUsd: 10.00, rateMonthlyUsd: 45.00,  isActive: true  },
  { id: 'item-003', code: 'ITEM_003', name: 'Large Suitcase',         rateDailyUsd: 3.50, rateWeeklyUsd: 18.00, rateMonthlyUsd: 75.00,  isActive: true  },
  { id: 'item-004', code: 'ITEM_004', name: 'Odd-Sized Items',        rateDailyUsd: 5.00, rateWeeklyUsd: 25.00, rateMonthlyUsd: 100.00, isActive: true  },
  { id: 'item-005', code: 'ITEM_005', name: 'Tea Chest Box',          rateDailyUsd: 4.00, rateWeeklyUsd: 20.00, rateMonthlyUsd: 85.00,  isActive: true  },
];

const LOCATIONS = [
  { id: 'loc-001', code: 'LOC_001', name: 'CMB Airport',  dropoffSurcharge: 10.00, pickupSurcharge: 10.00, requiresStripe: true,  allowsCash: false },
  { id: 'loc-002', code: 'LOC_002', name: 'Hotel Thilon', dropoffSurcharge: 0.00,  pickupSurcharge: 0.00,  requiresStripe: false, allowsCash: true  },
];

const ADDONS = [
  { id: 'addon-001', code: 'ADDON_001', name: 'Airport Pickup / Delivery Service', feeUsd: 5.00, isActive: true },
];

const AUDIT_LOG = [
  { id: 'a1', table: 'time_slots', action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Updated available operational time slots', createdAt: '2026-07-25T19:00:00Z' },
  { id: 'a2', table: 'item_tiers', action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Updated ITEM_002 weekly rate from $9.00 to $10.00', createdAt: '2026-07-25T18:30:00Z' },
  { id: 'a3', table: 'locations',  action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Updated LOC_001 dropoff surcharge from $8.00 to $10.00', createdAt: '2026-07-25T17:00:00Z' },
];

function InputField({ label, id, value, onChange, type = 'text', prefix }: {
  label: string; id: string; value: string | number; onChange: (v: string) => void;
  type?: string; prefix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">{label}</label>
      <div className="flex items-center">
        {prefix && <span className="px-3 py-2.5 border border-r-0 border-slate-300 rounded-l-xl bg-slate-100 text-sm font-bold text-slate-600">{prefix}</span>}
        <input
          id={id} type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={[
            'border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 bg-white focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 transition-colors w-full min-h-[40px]',
            prefix ? 'rounded-r-xl' : 'rounded-xl',
          ].join(' ')}
        />
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('item-tiers');
  const [tiers, setTiers] = useState(ITEM_TIERS);
  const [locs,  setLocs]  = useState(LOCATIONS);
  const [addons, setAddons] = useState(ADDONS);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState('');
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('10:00');

  useEffect(() => {
    setTimeSlots(getTimeSlots());
  }, []);

  const save = (id: string) => {
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const toggleSlotActive = (id: string) => {
    const updated = timeSlots.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setTimeSlots(updated);
    saveTimeSlots(updated);
  };

  const deleteSlot = (id: string) => {
    const updated = timeSlots.filter(s => s.id !== id);
    setTimeSlots(updated);
    saveTimeSlots(updated);
  };

  const addSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;
    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      label: newLabel,
      startTime: newStart,
      endTime: newEnd,
      active: true,
    };
    const updated = [...timeSlots, newSlot];
    setTimeSlots(updated);
    saveTimeSlots(updated);
    setNewLabel('');
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'item-tiers', label: 'Item Tiers',    icon: <Luggage className="w-4 h-4" /> },
    { id: 'locations',  label: 'Locations',     icon: <MapPin className="w-4 h-4" /> },
    { id: 'addons',     label: 'Add-On Services', icon: <Plane className="w-4 h-4" /> },
    { id: 'time-slots', label: 'Time Slots',    icon: <Clock className="w-4 h-4" /> },
    { id: 'audit-log',  label: 'Audit Log',     icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Internal Portal Header — no customer nav */}
      <header className="bg-[#1C130E] text-white sticky top-0 z-40 border-b border-stone-800 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Stowaway</span>
              <p className="text-sm font-extrabold text-white leading-none">SuperAdmin Portal</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            id="admin-logout-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-stone-300 hover:bg-stone-800 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-10 px-6" id="admin-panel-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 mb-2 inline-block">SuperAdmin</span>
            <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Control Panel</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Changes take effect immediately across all booking engines.
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-full w-full mb-8 overflow-x-auto shadow-2xs"
          role="tablist"
        >
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              id={`admin-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={[
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center cursor-pointer',
                tab === t.id ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Item Tiers ────────────────────────────────── */}
        {tab === 'item-tiers' && (
          <div className="flex flex-col gap-6">
            {tiers.map(tier => (
              <Card key={tier.id} variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-mono text-slate-400">{tier.code}</span>
                    <p className="text-lg font-bold text-slate-900">{tier.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${tier.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                    {tier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <InputField label="Daily Rate" id={`tier-daily-${tier.id}`} prefix="$"
                    type="number" value={tier.rateDailyUsd}
                    onChange={v => setTiers(p => p.map(t => t.id === tier.id ? { ...t, rateDailyUsd: parseFloat(v) || 0 } : t))}
                  />
                  <InputField label="Weekly Rate" id={`tier-weekly-${tier.id}`} prefix="$"
                    type="number" value={tier.rateWeeklyUsd}
                    onChange={v => setTiers(p => p.map(t => t.id === tier.id ? { ...t, rateWeeklyUsd: parseFloat(v) || 0 } : t))}
                  />
                  <InputField label="Monthly Rate" id={`tier-monthly-${tier.id}`} prefix="$"
                    type="number" value={tier.rateMonthlyUsd}
                    onChange={v => setTiers(p => p.map(t => t.id === tier.id ? { ...t, rateMonthlyUsd: parseFloat(v) || 0 } : t))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant={savedId === tier.id ? 'secondary' : 'primary'}
                    size="sm"
                    id={`save-tier-${tier.id}`}
                    onClick={() => save(tier.id)}
                  >
                    {savedId === tier.id ? '✓ Saved' : 'Save Changes'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Locations ─────────────────────────────────── */}
        {tab === 'locations' && (
          <div className="flex flex-col gap-6">
            {locs.map(loc => (
              <Card key={loc.id} variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-mono text-slate-400">{loc.code}</span>
                    <p className="text-lg font-bold text-slate-900">{loc.name}</p>
                  </div>
                  <div className="flex gap-2">
                    {loc.requiresStripe && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">Stripe Required</span>}
                    {loc.allowsCash    && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Cash Allowed</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <InputField label="Drop-off Surcharge" id={`loc-dropoff-${loc.id}`} prefix="$"
                    type="number" value={loc.dropoffSurcharge}
                    onChange={v => setLocs(p => p.map(l => l.id === loc.id ? { ...l, dropoffSurcharge: parseFloat(v) || 0 } : l))}
                  />
                  <InputField label="Pick-up Surcharge" id={`loc-pickup-${loc.id}`} prefix="$"
                    type="number" value={loc.pickupSurcharge}
                    onChange={v => setLocs(p => p.map(l => l.id === loc.id ? { ...l, pickupSurcharge: parseFloat(v) || 0 } : l))}
                  />
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer" htmlFor={`loc-stripe-${loc.id}`}>
                      <input type="checkbox" id={`loc-stripe-${loc.id}`} checked={loc.requiresStripe}
                        onChange={e => setLocs(p => p.map(l => l.id === loc.id ? { ...l, requiresStripe: e.target.checked } : l))}
                        className="accent-orange-600 w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-800">Stripe required</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer" htmlFor={`loc-cash-${loc.id}`}>
                      <input type="checkbox" id={`loc-cash-${loc.id}`} checked={loc.allowsCash}
                        onChange={e => setLocs(p => p.map(l => l.id === loc.id ? { ...l, allowsCash: e.target.checked } : l))}
                        className="accent-orange-600 w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-800">Cash allowed</span>
                    </label>
                  </div>
                  <Button variant={savedId === loc.id ? 'secondary' : 'primary'} size="sm" id={`save-loc-${loc.id}`} onClick={() => save(loc.id)}>
                    {savedId === loc.id ? '✓ Saved' : 'Save Changes'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Add-ons ───────────────────────────────────── */}
        {tab === 'addons' && (
          <div className="flex flex-col gap-6">
            {addons.map(addon => (
              <Card key={addon.id} variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-mono text-slate-400">{addon.code}</span>
                    <p className="text-lg font-bold text-slate-900">{addon.name}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <InputField label="Flat Fee" id={`addon-fee-${addon.id}`} prefix="$"
                    type="number" value={addon.feeUsd}
                    onChange={v => setAddons(p => p.map(a => a.id === addon.id ? { ...a, feeUsd: parseFloat(v) || 0 } : a))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant={savedId === addon.id ? 'secondary' : 'primary'} size="sm" id={`save-addon-${addon.id}`} onClick={() => save(addon.id)}>
                    {savedId === addon.id ? '✓ Saved' : 'Save Changes'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Time Slots Management ────────────────────── */}
        {tab === 'time-slots' && (
          <div className="flex flex-col gap-6">
            <Card variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Operational Time Slots</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">
                Configure available drop-off & pick-up windows shown to customers in the booking engine.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {timeSlots.map(slot => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{slot.label}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">Start: {slot.startTime} · End: {slot.endTime}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSlotActive(slot.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                          slot.active
                            ? 'bg-orange-600 text-white shadow-2xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {slot.active ? 'Active' : 'Disabled'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSlot(slot.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Time Slot Form */}
              <form onSubmit={addSlot} className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Slot Display Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 PM - 12:00 AM"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20"
                    required
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Start Time</label>
                  <input
                    type="time"
                    value={newStart}
                    onChange={e => setNewStart(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">End Time</label>
                  <input
                    type="time"
                    value={newEnd}
                    onChange={e => setNewEnd(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>
                <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto h-[42px]">
                  <Plus className="w-4 h-4" /> Add Slot
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* ── Audit Log ─────────────────────────────────── */}
        {tab === 'audit-log' && (
          <Card variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Changes</h2>
            <div className="flex flex-col divide-y divide-slate-100">
              {AUDIT_LOG.map(entry => (
                <div key={entry.id} className="py-4 flex items-start gap-4">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-slate-100 text-slate-800 flex-shrink-0 mt-0.5">
                    {entry.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{entry.summary}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {entry.table} · {entry.actor} · {new Date(entry.createdAt).toLocaleString('en-GB')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
