'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NavBar } from '@/components/ui/NavBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PillTag } from '@/components/ui/PillTag';

type AdminTab = 'item-tiers' | 'locations' | 'addons' | 'audit-log';

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
  { id: 'a1', table: 'item_tiers', action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Updated ITEM_002 weekly rate from $9.00 to $10.00', createdAt: '2026-07-25T18:30:00Z' },
  { id: 'a2', table: 'locations',  action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Updated LOC_001 dropoff surcharge from $8.00 to $10.00', createdAt: '2026-07-25T17:00:00Z' },
  { id: 'a3', table: 'addon_services', action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Updated ADDON_001 fee from $4.00 to $5.00', createdAt: '2026-07-24T09:00:00Z' },
];

function InputField({ label, id, value, onChange, type = 'text', prefix }: {
  label: string; id: string; value: string | number; onChange: (v: string) => void;
  type?: string; prefix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-micro text-[#52525b] mb-1 uppercase tracking-[0.72px]">{label}</label>
      <div className="flex items-center">
        {prefix && <span className="px-2 py-2.5 border border-r-0 border-[#e4e4e7] rounded-l-lg bg-[#f4f4f5] text-caption text-[#71717a]">{prefix}</span>}
        <input
          id={id} type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={[
            'border border-[#e4e4e7] px-3 py-2.5 text-caption text-black bg-white focus:border-black focus:outline-none transition-colors w-full min-h-[40px]',
            prefix ? 'rounded-r-lg' : 'rounded-lg',
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
  const [savedId, setSavedId] = useState<string | null>(null);

  const save = (id: string) => {
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2000);
    // TODO: PATCH /api/admin/... + write audit_log entry
  };

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'item-tiers', label: 'Item Tiers',    icon: '🧳' },
    { id: 'locations',  label: 'Locations',     icon: '📍' },
    { id: 'addons',     label: 'Add-On Services', icon: '✈️' },
    { id: 'audit-log',  label: 'Audit Log',     icon: '📋' },
  ];

  return (
    <div className="min-h-screen canvas-cream">
      <NavBar variant="light" />

      <main className="container-content py-8 px-4" id="admin-panel-main">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <PillTag variant="shade" className="mb-2">SuperAdmin</PillTag>
            <h1 className="text-display-md text-black">Control Panel</h1>
            <p className="text-body-md text-[#52525b] mt-1">
              Changes take effect immediately across all frontends.
            </p>
          </div>
          <Link href="/login">
            <Button variant="outline-light" size="sm" id="admin-logout-btn">Sign Out</Button>
          </Link>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 bg-[#f4f4f5] rounded-xl w-full mb-6 overflow-x-auto"
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
                'flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-caption font-[500] transition-all whitespace-nowrap flex-1 justify-center',
                tab === t.id ? 'bg-white text-black shadow-sm' : 'text-[#52525b] hover:text-black',
              ].join(' ')}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Item Tiers ────────────────────────────────── */}
        {tab === 'item-tiers' && (
          <div className="flex flex-col gap-4">
            {tiers.map(tier => (
              <Card key={tier.id} variant="pricing">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <span className="text-micro font-mono text-[#71717a]">{tier.code}</span>
                    <p className="text-heading-sm font-[500] text-black">{tier.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PillTag variant={tier.isActive ? 'mint' : 'shade'}>
                      {tier.isActive ? 'Active' : 'Inactive'}
                    </PillTag>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
                    variant={savedId === tier.id ? 'aloe' : 'primary'}
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
          <div className="flex flex-col gap-4">
            {locs.map(loc => (
              <Card key={loc.id} variant="pricing">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <span className="text-micro font-mono text-[#71717a]">{loc.code}</span>
                    <p className="text-heading-sm font-[500] text-black">{loc.name}</p>
                  </div>
                  <div className="flex gap-2">
                    {loc.requiresStripe && <PillTag variant="shade">Stripe Required</PillTag>}
                    {loc.allowsCash    && <PillTag variant="mint">Cash Allowed</PillTag>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <InputField label="Drop-off Surcharge" id={`loc-dropoff-${loc.id}`} prefix="$"
                    type="number" value={loc.dropoffSurcharge}
                    onChange={v => setLocs(p => p.map(l => l.id === loc.id ? { ...l, dropoffSurcharge: parseFloat(v) || 0 } : l))}
                  />
                  <InputField label="Pick-up Surcharge" id={`loc-pickup-${loc.id}`} prefix="$"
                    type="number" value={loc.pickupSurcharge}
                    onChange={v => setLocs(p => p.map(l => l.id === loc.id ? { ...l, pickupSurcharge: parseFloat(v) || 0 } : l))}
                  />
                </div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer" htmlFor={`loc-stripe-${loc.id}`}>
                      <input type="checkbox" id={`loc-stripe-${loc.id}`} checked={loc.requiresStripe}
                        onChange={e => setLocs(p => p.map(l => l.id === loc.id ? { ...l, requiresStripe: e.target.checked } : l))}
                        className="accent-black w-4 h-4"
                      />
                      <span className="text-caption text-black">Stripe required</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer" htmlFor={`loc-cash-${loc.id}`}>
                      <input type="checkbox" id={`loc-cash-${loc.id}`} checked={loc.allowsCash}
                        onChange={e => setLocs(p => p.map(l => l.id === loc.id ? { ...l, allowsCash: e.target.checked } : l))}
                        className="accent-black w-4 h-4"
                      />
                      <span className="text-caption text-black">Cash allowed</span>
                    </label>
                  </div>
                  <Button variant={savedId === loc.id ? 'aloe' : 'primary'} size="sm" id={`save-loc-${loc.id}`} onClick={() => save(loc.id)}>
                    {savedId === loc.id ? '✓ Saved' : 'Save Changes'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Add-ons ───────────────────────────────────── */}
        {tab === 'addons' && (
          <div className="flex flex-col gap-4">
            {addons.map(addon => (
              <Card key={addon.id} variant="pricing">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <span className="text-micro font-mono text-[#71717a]">{addon.code}</span>
                    <p className="text-heading-sm font-[500] text-black">{addon.name}</p>
                  </div>
                  <PillTag variant={addon.isActive ? 'mint' : 'shade'}>
                    {addon.isActive ? 'Active' : 'Inactive'}
                  </PillTag>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <InputField label="Flat Fee" id={`addon-fee-${addon.id}`} prefix="$"
                    type="number" value={addon.feeUsd}
                    onChange={v => setAddons(p => p.map(a => a.id === addon.id ? { ...a, feeUsd: parseFloat(v) || 0 } : a))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant={savedId === addon.id ? 'aloe' : 'primary'} size="sm" id={`save-addon-${addon.id}`} onClick={() => save(addon.id)}>
                    {savedId === addon.id ? '✓ Saved' : 'Save Changes'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Audit Log ─────────────────────────────────── */}
        {tab === 'audit-log' && (
          <Card variant="pricing">
            <h2 className="text-heading-md font-[500] text-black mb-4">Recent Changes</h2>
            <div className="flex flex-col divide-y divide-[#e4e4e7]">
              {AUDIT_LOG.map(entry => (
                <div key={entry.id} className="py-4 flex items-start gap-3">
                  <div className={[
                    'px-2 py-0.5 rounded text-micro font-mono font-[600] flex-shrink-0 mt-0.5',
                    entry.action === 'UPDATE' ? 'bg-[#d4f9e0] text-black' : 'bg-[#fee2e2] text-red-700',
                  ].join(' ')}>
                    {entry.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-caption text-black font-[550]">{entry.summary}</p>
                    <p className="text-micro text-[#71717a] mt-0.5">
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
