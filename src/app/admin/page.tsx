'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatUSD } from '@/lib/currency';
import {
  Luggage,
  MapPin,
  Plane,
  ClipboardList,
  Clock,
  Plus,
  Trash2,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Box,
  Store,
  CheckCircle2,
  Search,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';
import { getTimeSlots, saveTimeSlots, TimeSlot } from '@/lib/timeSlots';
import { createClient } from '@/lib/supabase/client';

type AdminTab = 'operations' | 'item-tiers' | 'locations' | 'addons' | 'time-slots' | 'audit-log';
type BookingStatus = 'confirmed' | 'in_transit' | 'deposited' | 'picked_up' | 'cancelled';

interface ItemTierItem {
  id: string;
  code: string;
  name: string;
  rateDailyUsd: number;
  rateWeeklyUsd: number;
  rateMonthlyUsd: number;
  isActive: boolean;
}

interface LocationItem {
  id: string;
  code: string;
  name: string;
  dropoffSurcharge: number;
  pickupSurcharge: number;
  requiresStripe: boolean;
  allowsCash: boolean;
}

interface AddonItem {
  id: string;
  code: string;
  name: string;
  feeUsd: number;
  isActive: boolean;
}

interface BookingRecord {
  id: string;
  customer: string;
  dropoff: string;
  pickup: string;
  items: string;
  grandTotal: number;
  status: BookingStatus;
  storageStart: string;
  storageEnd: string;
  type: 'drop-offs' | 'pickups' | 'storage';
  airportPickup: boolean;
}

const INITIAL_ITEM_TIERS: ItemTierItem[] = [
  { id: 'item-001', code: 'ITEM_001', name: 'Small Bag / Documents', rateDailyUsd: 1.00, rateWeeklyUsd: 5.00, rateMonthlyUsd: 25.00, isActive: true },
  { id: 'item-002', code: 'ITEM_002', name: 'Carry-On Luggage', rateDailyUsd: 2.00, rateWeeklyUsd: 10.00, rateMonthlyUsd: 45.00, isActive: true },
  { id: 'item-003', code: 'ITEM_003', name: 'Large Suitcase', rateDailyUsd: 3.50, rateWeeklyUsd: 18.00, rateMonthlyUsd: 75.00, isActive: true },
  { id: 'item-004', code: 'ITEM_004', name: 'Odd-Sized Items', rateDailyUsd: 5.00, rateWeeklyUsd: 25.00, rateMonthlyUsd: 100.00, isActive: true },
  { id: 'item-005', code: 'ITEM_005', name: 'Tea Chest Box', rateDailyUsd: 4.00, rateWeeklyUsd: 20.00, rateMonthlyUsd: 85.00, isActive: true },
];

const INITIAL_LOCATIONS: LocationItem[] = [
  { id: 'loc-001', code: 'LOC_001', name: 'CMB Airport Storage Hub', dropoffSurcharge: 10.00, pickupSurcharge: 10.00, requiresStripe: true, allowsCash: false },
  { id: 'loc-002', code: 'LOC_002', name: 'Hotel Thilon Drop Point', dropoffSurcharge: 0.00, pickupSurcharge: 0.00, requiresStripe: false, allowsCash: true },
  { id: 'loc-003', code: 'LOC_003', name: 'Colombo Fort Railway Terminal', dropoffSurcharge: 2.00, pickupSurcharge: 2.00, requiresStripe: false, allowsCash: true },
];

const INITIAL_ADDONS: AddonItem[] = [
  { id: 'addon-001', code: 'ADDON_001', name: 'Airport Pickup / Delivery Service', feeUsd: 5.00, isActive: true },
  { id: 'addon-002', code: 'ADDON_002', name: 'Express 24/7 Priority Handling', feeUsd: 3.00, isActive: true },
];

const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'bk-8921a4',
    customer: '+94 77 555 1234 (Pasan Dhanushka)',
    dropoff: 'CMB Airport Storage Hub',
    pickup: 'Hotel Thilon Drop Point',
    items: '2× Carry-On Luggage, 1× Odd-Sized Item',
    grandTotal: 33.00,
    status: 'confirmed',
    storageStart: '2026-07-27',
    storageEnd: '2026-07-29',
    type: 'drop-offs',
    airportPickup: true,
  },
  {
    id: 'bk-4410e2',
    customer: '+1 415 555 0199 (Alex Rivera)',
    dropoff: 'Hotel Thilon Drop Point',
    pickup: 'CMB Airport Storage Hub',
    items: '1× Large Suitcase, 1× Odd-Sized Item',
    grandTotal: 42.50,
    status: 'deposited',
    storageStart: '2026-07-26',
    storageEnd: '2026-07-29',
    type: 'storage',
    airportPickup: false,
  },
  {
    id: 'bk-7719f0',
    customer: '+81 90 1234 5678 (Sophia Tanaka)',
    dropoff: 'CMB Airport Storage Hub',
    pickup: 'CMB Airport Storage Hub',
    items: '3× Carry-On Luggage',
    grandTotal: 26.00,
    status: 'in_transit',
    storageStart: '2026-07-26',
    storageEnd: '2026-07-27',
    type: 'pickups',
    airportPickup: true,
  },
];

const INITIAL_AUDIT_LOG = [
  { id: 'a1', table: 'time_slots', action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Updated operational time slots', createdAt: '2026-07-25T19:00:00Z' },
  { id: 'a2', table: 'item_tiers', action: 'CREATE', actor: 'admin@stowaway.lk', summary: 'Added ITEM_005 (Tea Chest Box)', createdAt: '2026-07-25T18:30:00Z' },
  { id: 'a3', table: 'locations', action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Updated LOC_001 surcharges', createdAt: '2026-07-25T17:00:00Z' },
];

const STATUS_TRANSITIONS: Record<BookingStatus, { label: string; next: BookingStatus | null }> = {
  confirmed: { label: 'Mark In-Transit', next: 'in_transit' },
  in_transit: { label: 'Mark Deposited', next: 'deposited' },
  deposited: { label: 'Mark Picked Up', next: 'picked_up' },
  picked_up: { label: 'Completed', next: null },
  cancelled: { label: 'Cancelled', next: null },
};

function InputField({
  label,
  id,
  value,
  onChange,
  type = 'text',
  prefix,
  placeholder,
  required = false
}: {
  label: string;
  id: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  prefix?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-orange-600">*</span>}
      </label>
      <div className="flex items-center">
        {prefix && (
          <span className="px-3.5 py-2.5 border border-r-0 border-slate-300 rounded-l-xl bg-slate-100 text-sm font-bold text-slate-600">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={[
            'border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 transition-all w-full min-h-[42px]',
            prefix ? 'rounded-r-xl' : 'rounded-xl',
          ].join(' ')}
        />
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('operations');
  const [tiers, setTiers] = useState<ItemTierItem[]>(INITIAL_ITEM_TIERS);
  const [locs, setLocs] = useState<LocationItem[]>(INITIAL_LOCATIONS);
  const [addons, setAddons] = useState<AddonItem[]>(INITIAL_ADDONS);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [auditLog, setAuditLog] = useState(INITIAL_AUDIT_LOG);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Operations filter & search
  const [opFilter, setOpFilter] = useState<'all' | 'drop-offs' | 'pickups' | 'storage'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal forms state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDaily, setNewItemDaily] = useState('2.50');
  const [newItemWeekly, setNewItemWeekly] = useState('12.00');
  const [newItemMonthly, setNewItemMonthly] = useState('50.00');

  const [showAddLocModal, setShowAddLocModal] = useState(false);
  const [newLocCode, setNewLocCode] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocDropoff, setNewLocDropoff] = useState('0.00');
  const [newLocPickup, setNewLocPickup] = useState('0.00');
  const [newLocStripe, setNewLocStripe] = useState(false);
  const [newLocCash, setNewLocCash] = useState(true);

  const [showAddAddonModal, setShowAddAddonModal] = useState(false);
  const [newAddonCode, setNewAddonCode] = useState('');
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonFee, setNewAddonFee] = useState('5.00');

  // Time slot form state
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('08:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');

  useEffect(() => {
    setTimeSlots(getTimeSlots());
  }, []);

  const triggerSavedNotice = (id: string) => {
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Add Item Tier
  const handleCreateItemTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCode || !newItemName) return;
    const newItem: ItemTierItem = {
      id: `item-${Date.now()}`,
      code: newItemCode.toUpperCase().trim(),
      name: newItemName.trim(),
      rateDailyUsd: parseFloat(newItemDaily) || 0,
      rateWeeklyUsd: parseFloat(newItemWeekly) || 0,
      rateMonthlyUsd: parseFloat(newItemMonthly) || 0,
      isActive: true,
    };
    setTiers((prev) => [...prev, newItem]);
    setAuditLog((prev) => [
      {
        id: `a-${Date.now()}`,
        table: 'item_tiers',
        action: 'CREATE',
        actor: 'admin@stowaway.lk',
        summary: `Created tier ${newItem.code} (${newItem.name})`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNewItemCode('');
    setNewItemName('');
    setShowAddItemModal(false);
  };

  // Delete Item Tier
  const handleDeleteItemTier = (id: string, code: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
    setAuditLog((prev) => [
      {
        id: `a-${Date.now()}`,
        table: 'item_tiers',
        action: 'DELETE',
        actor: 'admin@stowaway.lk',
        summary: `Deleted tier ${code}`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // Toggle Item Tier Active
  const handleToggleItemActive = (id: string) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)));
  };

  // Add Location
  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocCode || !newLocName) return;
    const newLoc: LocationItem = {
      id: `loc-${Date.now()}`,
      code: newLocCode.toUpperCase().trim(),
      name: newLocName.trim(),
      dropoffSurcharge: parseFloat(newLocDropoff) || 0,
      pickupSurcharge: parseFloat(newLocPickup) || 0,
      requiresStripe: newLocStripe,
      allowsCash: newLocCash,
    };
    setLocs((prev) => [...prev, newLoc]);
    setAuditLog((prev) => [
      {
        id: `a-${Date.now()}`,
        table: 'locations',
        action: 'CREATE',
        actor: 'admin@stowaway.lk',
        summary: `Added location ${newLoc.code} (${newLoc.name})`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNewLocCode('');
    setNewLocName('');
    setShowAddLocModal(false);
  };

  // Delete Location
  const handleDeleteLocation = (id: string, code: string) => {
    setLocs((prev) => prev.filter((l) => l.id !== id));
    setAuditLog((prev) => [
      {
        id: `a-${Date.now()}`,
        table: 'locations',
        action: 'DELETE',
        actor: 'admin@stowaway.lk',
        summary: `Deleted location ${code}`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // Add Addon
  const handleCreateAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonCode || !newAddonName) return;
    const newAddon: AddonItem = {
      id: `addon-${Date.now()}`,
      code: newAddonCode.toUpperCase().trim(),
      name: newAddonName.trim(),
      feeUsd: parseFloat(newAddonFee) || 0,
      isActive: true,
    };
    setAddons((prev) => [...prev, newAddon]);
    setAuditLog((prev) => [
      {
        id: `a-${Date.now()}`,
        table: 'addon_services',
        action: 'CREATE',
        actor: 'admin@stowaway.lk',
        summary: `Added addon ${newAddon.code} (${newAddon.name})`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNewAddonCode('');
    setNewAddonName('');
    setShowAddAddonModal(false);
  };

  // Delete Addon
  const handleDeleteAddon = (id: string, code: string) => {
    setAddons((prev) => prev.filter((a) => a.id !== id));
  };

  // Toggle Time Slot
  const toggleSlotActive = (id: string) => {
    const updated = timeSlots.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setTimeSlots(updated);
    saveTimeSlots(updated);
  };

  const deleteSlot = (id: string) => {
    const updated = timeSlots.filter((s) => s.id !== id);
    setTimeSlots(updated);
    saveTimeSlots(updated);
  };

  const addSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotLabel) return;
    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      label: newSlotLabel,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      active: true,
    };
    const updated = [...timeSlots, newSlot];
    setTimeSlots(updated);
    saveTimeSlots(updated);
    setNewSlotLabel('');
  };

  // Booking Status Transition
  const handleBookingTransition = (id: string, nextStatus: BookingStatus | null) => {
    if (!nextStatus) return;
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b))
    );
  };

  // Filtered Bookings for Operations view
  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = opFilter === 'all' || b.type === opFilter;
    const matchesSearch =
      b.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.dropoff.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickup.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sidebarTabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'operations', label: 'Operations Overview', icon: <LayoutDashboard className="w-5 h-5" />, badge: bookings.length },
    { id: 'item-tiers', label: 'Item Tiers Catalog', icon: <Luggage className="w-5 h-5" />, badge: tiers.length },
    { id: 'locations', label: 'Locations & Fees', icon: <MapPin className="w-5 h-5" />, badge: locs.length },
    { id: 'addons', label: 'Add-On Services', icon: <Plane className="w-5 h-5" />, badge: addons.length },
    { id: 'time-slots', label: 'Operational Time Slots', icon: <Clock className="w-5 h-5" />, badge: timeSlots.length },
    { id: 'audit-log', label: 'Audit Log', icon: <ClipboardList className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* ── Left Sidebar (Dark Brown #1C130E Design System) ────── */}
      <aside className="w-full md:w-72 bg-[#1C130E] text-white flex flex-col flex-shrink-0 border-r border-stone-800 shadow-xl">
        {/* Brand Header */}
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">STOWAWAY</span>
              <p className="text-base font-extrabold text-white leading-none">SuperAdmin</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 flex-1 flex flex-col gap-1.5 overflow-y-auto" aria-label="Sidebar navigation">
          {sidebarTabs.map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                id={`admin-nav-${item.id}`}
                className={[
                  'flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer w-full text-left',
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={[
                      'px-2 py-0.5 rounded-full text-[11px] font-black',
                      isActive ? 'bg-white text-orange-700' : 'bg-stone-800 text-stone-300',
                    ].join(' ')}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-stone-800 bg-[#140D0A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">admin@stowaway.lk</p>
                <p className="text-[10px] text-stone-400 font-medium">SuperAdmin Role</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              id="admin-logout-btn"
              title="Sign Out"
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────── */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl" id="admin-panel-main">
        {/* Operations Overview Tab */}
        {tab === 'operations' && (
          <div className="flex flex-col gap-8">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 mb-2 inline-block">
                  Live Operations
                </span>
                <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Operations Overview</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Manage active drop-offs, airport pickups, and current luggage storage inventory.
                </p>
              </div>
            </div>

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="content" className="p-5 border border-slate-200 rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Bookings</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Box className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-[#1C130E] mt-2">{bookings.length}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Across all locations</p>
              </Card>

              <Card variant="content" className="p-5 border border-slate-200 rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Drop-offs</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-[#1C130E] mt-2">
                  {bookings.filter((b) => b.type === 'drop-offs').length}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-1">Scheduled arrivals</p>
              </Card>

              <Card variant="content" className="p-5 border border-slate-200 rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Airport Pickups</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Plane className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-[#1C130E] mt-2">
                  {bookings.filter((b) => b.airportPickup).length}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-1">With delivery service</p>
              </Card>

              <Card variant="content" className="p-5 border border-slate-200 rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-[#1C130E] mt-2">
                  {formatUSD(bookings.reduce((sum, b) => sum + b.grandTotal, 0))}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-1">Confirmed payments</p>
              </Card>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                {(['all', 'drop-offs', 'pickups', 'storage'] as const).map((filterOpt) => (
                  <button
                    key={filterOpt}
                    onClick={() => setOpFilter(filterOpt)}
                    className={[
                      'px-4 py-2 rounded-full text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap',
                      opFilter === filterOpt
                        ? 'bg-[#1C130E] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    ].join(' ')}
                  >
                    {filterOpt === 'all' ? 'All Bookings' : filterOpt.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer, ID, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-300 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20"
                />
              </div>
            </div>

            {/* Bookings Grid */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                <p className="text-lg font-bold text-slate-800">No matching bookings found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings.map((b) => {
                  const transition = STATUS_TRANSITIONS[b.status];
                  return (
                    <Card key={b.id} variant="content" className="p-6 border border-slate-200 rounded-2xl bg-white shadow-2xs flex flex-col justify-between gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-mono text-slate-400 font-bold">#{b.id}</span>
                          <p className="text-sm font-extrabold text-[#1C130E] mt-0.5">{b.customer}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-orange-50 text-orange-800 border border-orange-200 capitalize">
                          {b.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <p className="text-slate-800 font-medium"><strong className="text-slate-500">Drop-off:</strong> {b.dropoff}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <p className="text-slate-800 font-medium"><strong className="text-slate-500">Pick-up:</strong> {b.pickup}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900">{b.items}</p>
                        {b.airportPickup && (
                          <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Plane className="w-3 h-3" /> Airport Pickup Service
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Start: {b.storageStart}</p>
                          <p className="text-base font-extrabold text-[#1C130E]">{formatUSD(b.grandTotal)}</p>
                        </div>
                        {transition.next && (
                          <Button
                            variant="primary"
                            size="sm"
                            id={`op-transition-${b.id}`}
                            onClick={() => handleBookingTransition(b.id, transition.next)}
                          >
                            {transition.label}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Item Tiers Catalog Tab */}
        {tab === 'item-tiers' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Item Tiers Catalog</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Configure daily, weekly, and monthly rates for storage items.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                id="add-item-tier-btn"
                onClick={() => setShowAddItemModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Item Tier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tiers.map((tier) => (
                <Card key={tier.id} variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs font-mono text-slate-400 font-bold">{tier.code}</span>
                        <p className="text-lg font-extrabold text-[#1C130E]">{tier.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleItemActive(tier.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                            tier.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {tier.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => handleDeleteItemTier(tier.id, tier.code)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                          title="Delete Tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <InputField
                        label="Daily Rate"
                        id={`tier-daily-${tier.id}`}
                        prefix="$"
                        type="number"
                        value={tier.rateDailyUsd}
                        onChange={(v) =>
                          setTiers((p) => p.map((t) => (t.id === tier.id ? { ...t, rateDailyUsd: parseFloat(v) || 0 } : t)))
                        }
                      />
                      <InputField
                        label="Weekly Rate"
                        id={`tier-weekly-${tier.id}`}
                        prefix="$"
                        type="number"
                        value={tier.rateWeeklyUsd}
                        onChange={(v) =>
                          setTiers((p) => p.map((t) => (t.id === tier.id ? { ...t, rateWeeklyUsd: parseFloat(v) || 0 } : t)))
                        }
                      />
                      <InputField
                        label="Monthly Rate"
                        id={`tier-monthly-${tier.id}`}
                        prefix="$"
                        type="number"
                        value={tier.rateMonthlyUsd}
                        onChange={(v) =>
                          setTiers((p) => p.map((t) => (t.id === tier.id ? { ...t, rateMonthlyUsd: parseFloat(v) || 0 } : t)))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      variant={savedId === tier.id ? 'secondary' : 'primary'}
                      size="sm"
                      id={`save-tier-${tier.id}`}
                      onClick={() => triggerSavedNotice(tier.id)}
                    >
                      {savedId === tier.id ? '✓ Saved' : 'Save Rates'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {tab === 'locations' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Drop-off & Pick-up Locations</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Manage operating hubs, surcharges, and payment rules.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                id="add-loc-btn"
                onClick={() => setShowAddLocModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Location
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locs.map((loc) => (
                <Card key={loc.id} variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs font-mono text-slate-400 font-bold">{loc.code}</span>
                        <p className="text-lg font-extrabold text-[#1C130E]">{loc.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteLocation(loc.id, loc.code)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="Delete Location"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <InputField
                        label="Drop-off Surcharge"
                        id={`loc-dropoff-${loc.id}`}
                        prefix="$"
                        type="number"
                        value={loc.dropoffSurcharge}
                        onChange={(v) =>
                          setLocs((p) => p.map((l) => (l.id === loc.id ? { ...l, dropoffSurcharge: parseFloat(v) || 0 } : l)))
                        }
                      />
                      <InputField
                        label="Pick-up Surcharge"
                        id={`loc-pickup-${loc.id}`}
                        prefix="$"
                        type="number"
                        value={loc.pickupSurcharge}
                        onChange={(v) =>
                          setLocs((p) => p.map((l) => (l.id === loc.id ? { ...l, pickupSurcharge: parseFloat(v) || 0 } : l)))
                        }
                      />
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer" htmlFor={`loc-stripe-${loc.id}`}>
                        <input
                          type="checkbox"
                          id={`loc-stripe-${loc.id}`}
                          checked={loc.requiresStripe}
                          onChange={(e) =>
                            setLocs((p) => p.map((l) => (l.id === loc.id ? { ...l, requiresStripe: e.target.checked } : l)))
                          }
                          className="accent-orange-600 w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">Stripe Payment Required</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer" htmlFor={`loc-cash-${loc.id}`}>
                        <input
                          type="checkbox"
                          id={`loc-cash-${loc.id}`}
                          checked={loc.allowsCash}
                          onChange={(e) =>
                            setLocs((p) => p.map((l) => (l.id === loc.id ? { ...l, allowsCash: e.target.checked } : l)))
                          }
                          className="accent-orange-600 w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">Cash Payment Allowed</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      variant={savedId === loc.id ? 'secondary' : 'primary'}
                      size="sm"
                      id={`save-loc-${loc.id}`}
                      onClick={() => triggerSavedNotice(loc.id)}
                    >
                      {savedId === loc.id ? '✓ Saved' : 'Save Location'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Addons Tab */}
        {tab === 'addons' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Add-On Services</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Configure extra services available during customer checkout.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                id="add-addon-btn"
                onClick={() => setShowAddAddonModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Add-On Service
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addons.map((addon) => (
                <Card key={addon.id} variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs font-mono text-slate-400 font-bold">{addon.code}</span>
                        <p className="text-lg font-extrabold text-[#1C130E]">{addon.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAddon(addon.id, addon.code)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="Delete Addon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <InputField
                        label="Flat Fee (USD)"
                        id={`addon-fee-${addon.id}`}
                        prefix="$"
                        type="number"
                        value={addon.feeUsd}
                        onChange={(v) =>
                          setAddons((p) => p.map((a) => (a.id === addon.id ? { ...a, feeUsd: parseFloat(v) || 0 } : a)))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      variant={savedId === addon.id ? 'secondary' : 'primary'}
                      size="sm"
                      id={`save-addon-${addon.id}`}
                      onClick={() => triggerSavedNotice(addon.id)}
                    >
                      {savedId === addon.id ? '✓ Saved' : 'Save Addon'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Time Slots Tab */}
        {tab === 'time-slots' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Operational Time Slots</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Configure time windows available for drop-off and pickup selection.
              </p>
            </div>

            <Card variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{slot.label}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSlotActive(slot.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                          slot.active ? 'bg-orange-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {slot.active ? 'Active' : 'Off'}
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

              {/* Add New Slot */}
              <form onSubmit={addSlot} className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-2">
                  <InputField
                    label="Display Label"
                    id="new-slot-label"
                    placeholder="e.g. 10:00 PM - 12:00 AM"
                    value={newSlotLabel}
                    onChange={setNewSlotLabel}
                    required
                  />
                </div>
                <div>
                  <InputField
                    label="Start Time"
                    id="new-slot-start"
                    type="time"
                    value={newSlotStart}
                    onChange={setNewSlotStart}
                  />
                </div>
                <div>
                  <Button type="submit" variant="primary" size="md" className="w-full h-[42px] flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Slot
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Audit Log Tab */}
        {tab === 'audit-log' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Audit Log</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                System history of admin modifications and database updates.
              </p>
            </div>

            <Card variant="content" className="border border-slate-200 p-6 rounded-2xl bg-white shadow-2xs">
              <div className="flex flex-col divide-y divide-slate-100">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="py-4 flex items-start gap-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-slate-100 text-slate-800 flex-shrink-0 mt-0.5">
                      {entry.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{entry.summary}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Table: <span className="font-mono text-slate-700">{entry.table}</span> · {entry.actor} ·{' '}
                        {new Date(entry.createdAt).toLocaleString('en-GB')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* ── Modal: Add New Item Tier ────────────────────────── */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#1C130E]">Add New Item Tier</h3>
              <button onClick={() => setShowAddItemModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateItemTier} className="flex flex-col gap-4">
              <InputField label="Tier Code" id="new-item-code" placeholder="e.g. ITEM_006" value={newItemCode} onChange={setNewItemCode} required />
              <InputField label="Item Tier Name" id="new-item-name" placeholder="e.g. Heavy Duty Trunk Box" value={newItemName} onChange={setNewItemName} required />
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Daily Rate ($)" id="new-item-daily" type="number" value={newItemDaily} onChange={setNewItemDaily} required />
                <InputField label="Weekly Rate ($)" id="new-item-weekly" type="number" value={newItemWeekly} onChange={setNewItemWeekly} required />
                <InputField label="Monthly Rate ($)" id="new-item-monthly" type="number" value={newItemMonthly} onChange={setNewItemMonthly} required />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="secondary" size="md" onClick={() => setShowAddItemModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="md">Create Tier</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add New Location ────────────────────────── */}
      {showAddLocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#1C130E]">Add New Location</h3>
              <button onClick={() => setShowAddLocModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLocation} className="flex flex-col gap-4">
              <InputField label="Location Code" id="new-loc-code" placeholder="e.g. LOC_004" value={newLocCode} onChange={setNewLocCode} required />
              <InputField label="Location Name" id="new-loc-name" placeholder="e.g. Mount Lavinia Drop Point" value={newLocName} onChange={setNewLocName} required />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Drop-off Surcharge ($)" id="new-loc-dropoff" type="number" value={newLocDropoff} onChange={setNewLocDropoff} required />
                <InputField label="Pick-up Surcharge ($)" id="new-loc-pickup" type="number" value={newLocPickup} onChange={setNewLocPickup} required />
              </div>
              <div className="flex flex-col gap-2 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newLocStripe} onChange={(e) => setNewLocStripe(e.target.checked)} className="accent-orange-600 w-4 h-4 rounded" />
                  <span className="text-xs font-bold text-slate-800">Stripe Payment Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newLocCash} onChange={(e) => setNewLocCash(e.target.checked)} className="accent-orange-600 w-4 h-4 rounded" />
                  <span className="text-xs font-bold text-slate-800">Cash Payment Allowed</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="secondary" size="md" onClick={() => setShowAddLocModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="md">Create Location</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add New Addon ────────────────────────── */}
      {showAddAddonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#1C130E]">Add New Add-On Service</h3>
              <button onClick={() => setShowAddAddonModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAddon} className="flex flex-col gap-4">
              <InputField label="Add-on Code" id="new-addon-code" placeholder="e.g. ADDON_003" value={newAddonCode} onChange={setNewAddonCode} required />
              <InputField label="Service Name" id="new-addon-name" placeholder="e.g. Fragile Handling & Protective Wrap" value={newAddonName} onChange={setNewAddonName} required />
              <InputField label="Flat Fee ($)" id="new-addon-fee" type="number" value={newAddonFee} onChange={setNewAddonFee} required />
              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="secondary" size="md" onClick={() => setShowAddAddonModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="md">Create Service</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
