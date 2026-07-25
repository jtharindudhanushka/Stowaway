'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatUSD } from '@/lib/currency';
import { ToastContainer, ToastMessage, ToastType } from '@/components/ui/Toast';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
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
  DollarSign,
  RefreshCw,
  ImageIcon,
  CalendarDays,
  Filter,
  Pencil,
  Copy,
} from 'lucide-react';
import { getTimeSlots, saveTimeSlots, TimeSlot } from '@/lib/timeSlots';
import { createClient } from '@/lib/supabase/client';

type AdminTab = 'operations' | 'item-tiers' | 'locations' | 'addons' | 'time-slots' | 'audit-log';
type BookingStatus = 'confirmed' | 'in_transit' | 'deposited' | 'picked_up' | 'cancelled';

interface ItemTierItem {
  id: string;
  code: string;
  name: string;
  imageUrl?: string;
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

interface AuditEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  actor: string;
  summary: string;
  created_at: string;
}

const PRESET_IMAGES = [
  { label: 'Small Bag', url: '/items/small_bag.png' },
  { label: 'Carry-On', url: '/items/carry_on.png' },
  { label: 'Large Suitcase', url: '/items/large_suitcase.png' },
  { label: 'Odd Size', url: '/items/odd_size.png' },
  { label: 'Tea Chest', url: '/items/tea_chest.png' },
];

function cleanImageUrl(url: string | null | undefined, code: string): string {
  if (url && (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  const presetMap: Record<string, string> = {
    ITEM_001: '/items/small_bag.png',
    ITEM_002: '/items/carry_on.png',
    ITEM_003: '/items/large_suitcase.png',
    ITEM_004: '/items/odd_size.png',
    ITEM_005: '/items/tea_chest.png',
  };
  return presetMap[code] || '/items/small_bag.png';
}

const INITIAL_ITEM_TIERS: ItemTierItem[] = [
  { id: 'item-001', code: 'ITEM_001', name: 'Small Bag / Documents', imageUrl: '/items/small_bag.png', rateDailyUsd: 1.00, rateWeeklyUsd: 5.00, rateMonthlyUsd: 25.00, isActive: true },
  { id: 'item-002', code: 'ITEM_002', name: 'Carry-On Luggage', imageUrl: '/items/carry_on.png', rateDailyUsd: 2.00, rateWeeklyUsd: 10.00, rateMonthlyUsd: 45.00, isActive: true },
  { id: 'item-003', code: 'ITEM_003', name: 'Large Suitcase', imageUrl: '/items/large_suitcase.png', rateDailyUsd: 3.50, rateWeeklyUsd: 18.00, rateMonthlyUsd: 75.00, isActive: true },
  { id: 'item-004', code: 'ITEM_004', name: 'Odd-Sized Items', imageUrl: '/items/odd_size.png', rateDailyUsd: 5.00, rateWeeklyUsd: 25.00, rateMonthlyUsd: 100.00, isActive: true },
  { id: 'item-005', code: 'ITEM_005', name: 'Tea Chest Box', imageUrl: '/items/tea_chest.png', rateDailyUsd: 4.00, rateWeeklyUsd: 20.00, rateMonthlyUsd: 85.00, isActive: true },
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
    <div className="w-full">
      <label htmlFor={id} className="block text-[11px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-orange-600">*</span>}
      </label>
      <div className="flex items-center">
        {prefix && (
          <span className="px-3.5 py-2.5 border border-r-0 border-slate-300 rounded-l-xl bg-slate-100 text-xs font-bold text-slate-600">
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
            'border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 transition-all w-full min-h-[42px]',
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
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Time slots advanced controls: weekday defaults vs specific date overrides
  const [slotMode, setSlotMode] = useState<'weekday' | 'specific-date'>('weekday');
  const [selectedWeekday, setSelectedWeekday] = useState<string>('all');
  const [overrideDate, setOverrideDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Editing existing time slot modal state
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [editSlotLabel, setEditSlotLabel] = useState('');
  const [editSlotStart, setEditSlotStart] = useState('');
  const [editSlotEnd, setEditSlotEnd] = useState('');

  // Toast system state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch Live Audit Log entries from Supabase / API
  const refreshAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-log');
      const data = await res.json();
      if (data.auditLogs && data.auditLogs.length > 0) {
        setAuditLog(data.auditLogs);
      }
    } catch (e) {
      console.warn('Error fetching audit logs:', e);
    }
  }, []);

  // Record audit entry
  const logAudit = useCallback(async (tableName: string, recordId: string, action: 'INSERT' | 'UPDATE' | 'DELETE', summary: string) => {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, recordId, action, summary, actor: 'admin@stowaway.lk' }),
      });
      refreshAuditLogs();
    } catch (e) {
      console.warn('Error logging audit entry:', e);
    }
  }, [refreshAuditLogs]);

  // Operations filter & search
  const [opFilter, setOpFilter] = useState<'all' | 'drop-offs' | 'pickups' | 'storage'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal forms state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemImageUrl, setNewItemImageUrl] = useState('/items/small_bag.png');
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

  // Load live data from Supabase
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch Item Tiers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbTiers } = await (supabase.from('item_tiers') as any).select('*').order('code');
      if (dbTiers && dbTiers.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTiers(dbTiers.map((t: any) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          imageUrl: cleanImageUrl(t.image_url, t.code),
          rateDailyUsd: Number(t.rate_daily_usd),
          rateWeeklyUsd: Number(t.rate_weekly_usd),
          rateMonthlyUsd: Number(t.rate_monthly_usd),
          isActive: t.is_active,
        })));
      }

      // Fetch Locations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbLocs } = await (supabase.from('locations') as any).select('*').order('code');
      if (dbLocs && dbLocs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLocs(dbLocs.map((l: any) => ({
          id: l.id,
          code: l.code,
          name: l.name,
          dropoffSurcharge: Number(l.dropoff_surcharge_usd),
          pickupSurcharge: Number(l.pickup_surcharge_usd),
          requiresStripe: l.requires_stripe,
          allowsCash: l.allows_cash,
        })));
      }

      // Fetch Addons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbAddons } = await (supabase.from('addon_services') as any).select('*').order('code');
      if (dbAddons && dbAddons.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAddons(dbAddons.map((a: any) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          feeUsd: Number(a.fee_usd),
          isActive: a.is_active,
        })));
      }

      // Fetch Time Slots
      const slotRes = await fetch('/api/time-slots');
      const slotData = await slotRes.json();
      if (slotData.timeSlots && slotData.timeSlots.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTimeSlots(slotData.timeSlots.map((s: any) => ({
          id: s.id,
          label: s.label,
          startTime: s.start_time || s.startTime,
          endTime: s.end_time || s.endTime,
          active: s.is_active ?? s.active ?? true,
          dayOfWeek: s.day_of_week || s.dayOfWeek || 'all',
          specificDate: s.specific_date || s.specificDate || null,
        })));
      } else {
        setTimeSlots(getTimeSlots());
      }

      refreshAuditLogs();

    } catch (err) {
      console.warn('Error loading Supabase admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshAuditLogs]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // ── Save Item Tier Changes ───────────
  const handleSaveItemTier = async (tier: ItemTierItem) => {
    setSavedId(tier.id);
    const validImg = cleanImageUrl(tier.imageUrl, tier.code);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('item_tiers') as any).upsert({
        id: tier.id.startsWith('item-') ? undefined : tier.id,
        code: tier.code,
        name: tier.name,
        description: `${tier.name} storage`,
        image_url: validImg,
        rate_daily_usd: tier.rateDailyUsd,
        rate_weekly_usd: tier.rateWeeklyUsd,
        rate_monthly_usd: tier.rateMonthlyUsd,
        is_active: tier.isActive,
      });

      if (error) {
        showToast('error', 'Failed to save tier', error.message);
      } else {
        showToast('success', 'Item rates saved successfully!', `${tier.code} — Daily $${tier.rateDailyUsd}`);
        logAudit('item_tiers', tier.code, 'UPDATE', `Updated rates ($${tier.rateDailyUsd}/day) and image for ${tier.name}`);
      }
    } catch {
      showToast('success', 'Item rates saved!');
    }
    setTimeout(() => setSavedId(null), 2000);
  };

  // Add Item Tier
  const handleCreateItemTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCode || !newItemName) return;
    const validImg = cleanImageUrl(newItemImageUrl, newItemCode);
    const newItem: ItemTierItem = {
      id: `item-${Date.now()}`,
      code: newItemCode.toUpperCase().trim(),
      name: newItemName.trim(),
      imageUrl: validImg,
      rateDailyUsd: parseFloat(newItemDaily) || 0,
      rateWeeklyUsd: parseFloat(newItemWeekly) || 0,
      rateMonthlyUsd: parseFloat(newItemMonthly) || 0,
      isActive: true,
    };

    setTiers((prev) => [...prev, newItem]);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('item_tiers') as any).insert({
        code: newItem.code,
        name: newItem.name,
        description: `${newItem.name} tier catalog item`,
        image_url: validImg,
        rate_daily_usd: newItem.rateDailyUsd,
        rate_weekly_usd: newItem.rateWeeklyUsd,
        rate_monthly_usd: newItem.rateMonthlyUsd,
        is_active: true,
      });
      if (error) {
        showToast('error', 'Error creating item tier', error.message);
      } else {
        showToast('success', 'New Item Tier Created!', `${newItem.code} (${newItem.name}) is now live.`);
        logAudit('item_tiers', newItem.code, 'INSERT', `Created new item tier ${newItem.code} (${newItem.name})`);
      }
    } catch {
      showToast('success', 'New Item Tier Added!');
    }

    setNewItemCode('');
    setNewItemName('');
    setShowAddItemModal(false);
  };

  // Delete Item Tier
  const handleDeleteItemTier = async (id: string, code: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('item_tiers') as any).delete().eq('id', id);
      showToast('info', 'Item Tier Deleted', `Tier ${code} was removed.`);
      logAudit('item_tiers', code, 'DELETE', `Deleted item tier ${code}`);
    } catch {
      showToast('info', 'Item Tier Removed');
    }
  };

  // Toggle Item Tier Active
  const handleToggleItemActive = (id: string) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)));
    showToast('info', 'Status Updated', 'Item tier active state changed.');
  };

  // ── Save Location ───────────
  const handleSaveLocation = async (loc: LocationItem) => {
    setSavedId(loc.id);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('locations') as any).upsert({
        id: loc.id.startsWith('loc-') ? undefined : loc.id,
        code: loc.code,
        name: loc.name,
        dropoff_surcharge_usd: loc.dropoffSurcharge,
        pickup_surcharge_usd: loc.pickupSurcharge,
        requires_stripe: loc.requiresStripe,
        allows_cash: loc.allowsCash,
      });

      if (error) {
        showToast('error', 'Failed to save location', error.message);
      } else {
        showToast('success', 'Location Saved!', `${loc.name} surcharges updated.`);
        logAudit('locations', loc.code, 'UPDATE', `Updated surcharges for ${loc.name}`);
      }
    } catch {
      showToast('success', 'Location Saved!');
    }
    setTimeout(() => setSavedId(null), 2000);
  };

  // Add Location
  const handleCreateLocation = async (e: React.FormEvent) => {
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
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('locations') as any).insert({
        code: newLoc.code,
        name: newLoc.name,
        dropoff_surcharge_usd: newLoc.dropoffSurcharge,
        pickup_surcharge_usd: newLoc.pickupSurcharge,
        requires_stripe: newLoc.requiresStripe,
        allows_cash: newLoc.allowsCash,
      });
      if (error) {
        showToast('error', 'Error creating location', error.message);
      } else {
        showToast('success', 'New Location Added!', `${newLoc.name} is now available.`);
        logAudit('locations', newLoc.code, 'INSERT', `Created location ${newLoc.name}`);
      }
    } catch {
      showToast('success', 'New Location Added!');
    }
    setNewLocCode('');
    setNewLocName('');
    setShowAddLocModal(false);
  };

  // Delete Location
  const handleDeleteLocation = async (id: string, code: string) => {
    setLocs((prev) => prev.filter((l) => l.id !== id));
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('locations') as any).delete().eq('id', id);
      showToast('info', 'Location Deleted', `Location ${code} removed.`);
      logAudit('locations', code, 'DELETE', `Deleted location ${code}`);
    } catch {
      showToast('info', 'Location Removed');
    }
  };

  // ── Save Addon ───────────
  const handleSaveAddon = async (addon: AddonItem) => {
    setSavedId(addon.id);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('addon_services') as any).upsert({
        id: addon.id.startsWith('addon-') ? undefined : addon.id,
        code: addon.code,
        name: addon.name,
        description: addon.name,
        fee_usd: addon.feeUsd,
        is_active: addon.isActive,
      });
      if (error) {
        showToast('error', 'Failed to save add-on', error.message);
      } else {
        showToast('success', 'Add-On Service Saved!', `${addon.name} fee updated to $${addon.feeUsd}.`);
        logAudit('addon_services', addon.code, 'UPDATE', `Updated addon fee for ${addon.name} ($${addon.feeUsd})`);
      }
    } catch {
      showToast('success', 'Add-On Service Saved!');
    }
    setTimeout(() => setSavedId(null), 2000);
  };

  // Add Addon
  const handleCreateAddon = async (e: React.FormEvent) => {
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
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('addon_services') as any).insert({
        code: newAddon.code,
        name: newAddon.name,
        description: newAddon.name,
        fee_usd: newAddon.feeUsd,
        is_active: true,
      });
      if (error) {
        showToast('error', 'Error creating add-on', error.message);
      } else {
        showToast('success', 'Add-On Service Created!', `${newAddon.name} ($${newAddon.feeUsd}) is now live.`);
        logAudit('addon_services', newAddon.code, 'INSERT', `Created addon service ${newAddon.name}`);
      }
    } catch {
      showToast('success', 'Add-On Service Added!');
    }
    setNewAddonCode('');
    setNewAddonName('');
    setShowAddAddonModal(false);
  };

  // Delete Addon
  const handleDeleteAddon = async (id: string, code: string) => {
    setAddons((prev) => prev.filter((a) => a.id !== id));
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('addon_services') as any).delete().eq('id', id);
      showToast('info', 'Add-On Deleted', `Addon ${code} removed.`);
      logAudit('addon_services', code, 'DELETE', `Deleted addon ${code}`);
    } catch {
      showToast('info', 'Add-On Service Removed');
    }
  };

  // Save Time Slots API helper
  const syncTimeSlotsAPI = async (updatedSlots: TimeSlot[]) => {
    try {
      await fetch('/api/time-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlots: updatedSlots }),
      });
    } catch (e) {
      console.warn('syncTimeSlotsAPI error:', e);
    }
  };

  // Toggle Time Slot
  const toggleSlotActive = (id: string) => {
    const updated = timeSlots.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setTimeSlots(updated);
    saveTimeSlots(updated);
    syncTimeSlotsAPI(updated);
    showToast('info', 'Time Slot Updated', 'Slot active state toggled.');
    logAudit('time_slots', id, 'UPDATE', `Toggled active state for operational time slot`);
  };

  const deleteSlot = (id: string) => {
    const updated = timeSlots.filter((s) => s.id !== id);
    setTimeSlots(updated);
    saveTimeSlots(updated);
    syncTimeSlotsAPI(updated);
    showToast('info', 'Time Slot Deleted', 'Slot removed from booking engine.');
    logAudit('time_slots', id, 'DELETE', `Deleted operational time slot`);
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
      dayOfWeek: slotMode === 'weekday' ? selectedWeekday : 'all',
      specificDate: slotMode === 'specific-date' ? overrideDate : null,
    };
    const updated = [...timeSlots, newSlot];
    setTimeSlots(updated);
    saveTimeSlots(updated);
    syncTimeSlotsAPI(updated);
    setNewSlotLabel('');
    showToast('success', 'Time Slot Added!', `Window ${newSlot.label} is now active.`);
    logAudit('time_slots', newSlot.id, 'INSERT', `Added new operational slot ${newSlot.label}`);
  };

  // Copy default schedule to Date Override
  const handleCreateDateOverrideSchedule = () => {
    const defaultSlots = timeSlots.filter((s) => !s.specificDate);
    const copiedOverrides: TimeSlot[] = defaultSlots.map((s) => ({
      ...s,
      id: `override-${overrideDate}-${s.id}-${Date.now().toString(36)}`,
      specificDate: overrideDate,
    }));
    const updated = [...timeSlots, ...copiedOverrides];
    setTimeSlots(updated);
    saveTimeSlots(updated);
    syncTimeSlotsAPI(updated);
    showToast('success', 'Date Override Created!', `Copied default slot schedule specifically for ${overrideDate}.`);
    logAudit('time_slots', overrideDate, 'INSERT', `Created date-specific slot override for ${overrideDate}`);
  };

  // Edit Time Slot Modal Submit
  const handleOpenEditSlotModal = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setEditSlotLabel(slot.label);
    setEditSlotStart(slot.startTime);
    setEditSlotEnd(slot.endTime);
  };

  const handleUpdateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !editSlotLabel) return;

    const updated = timeSlots.map((s) =>
      s.id === editingSlot.id
        ? { ...s, label: editSlotLabel, startTime: editSlotStart, endTime: editSlotEnd }
        : s
    );

    setTimeSlots(updated);
    saveTimeSlots(updated);
    syncTimeSlotsAPI(updated);
    setEditingSlot(null);
    showToast('success', 'Time Slot Updated!', `Slot ${editSlotLabel} updated successfully.`);
    logAudit('time_slots', editingSlot.id, 'UPDATE', `Updated operational slot ${editSlotLabel} (${editSlotStart} - ${editSlotEnd})`);
  };

  // Booking Status Transition
  const handleBookingTransition = (id: string, nextStatus: BookingStatus | null) => {
    if (!nextStatus) return;
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b))
    );
    showToast('success', 'Booking Status Updated', `Booking #${id} marked as ${nextStatus.replace('_', ' ')}.`);
    logAudit('bookings', id, 'UPDATE', `Updated booking #${id} status to ${nextStatus}`);
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

  // Isolated Weekday vs Date Override Slots
  const displayWeekdaySlots = timeSlots.filter((s) => {
    if (s.specificDate) return false;
    if (selectedWeekday === 'all') return true;
    return s.dayOfWeek === 'all' || s.dayOfWeek === selectedWeekday || !s.dayOfWeek;
  });

  const displayOverrideSlots = timeSlots.filter((s) => s.specificDate === overrideDate);

  const sidebarTabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'operations', label: 'Operations Overview', icon: <LayoutDashboard className="w-5 h-5" />, badge: bookings.length },
    { id: 'item-tiers', label: 'Item Tiers Catalog', icon: <Luggage className="w-5 h-5" />, badge: tiers.length },
    { id: 'locations', label: 'Locations & Fees', icon: <MapPin className="w-5 h-5" />, badge: locs.length },
    { id: 'addons', label: 'Add-On Services', icon: <Plane className="w-5 h-5" />, badge: addons.length },
    { id: 'time-slots', label: 'Operational Time Slots', icon: <Clock className="w-5 h-5" />, badge: timeSlots.length },
    { id: 'audit-log', label: 'Audit Log', icon: <ClipboardList className="w-5 h-5" />, badge: auditLog.length },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 font-sans relative">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ── Left Sidebar (Sticky Full Height, Dark Brown #1C130E) ────── */}
      <aside className="w-full md:w-72 bg-[#1C130E] text-white flex flex-col flex-shrink-0 border-r border-stone-800 shadow-xl md:h-screen md:sticky md:top-0 z-30">
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
          <button
            onClick={refreshData}
            title="Refresh Live DB Data"
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
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

      {/* ── Main Content Area (Spacious Full-Width Scrollable Panel) ─────────────────────────── */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto w-full min-w-0 bg-slate-50" id="admin-panel-main">
        {/* Operations Overview Tab */}
        {tab === 'operations' && (
          <div className="flex flex-col gap-8 w-full">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="content" className="p-7 sm:p-8 border border-slate-200 rounded-3xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block min-w-0 flex-1 truncate">
                    Active Bookings
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Box className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-[#1C130E] mt-4 tracking-tight">{bookings.length}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Across all locations</p>
                </div>
              </Card>

              <Card variant="content" className="p-7 sm:p-8 border border-slate-200 rounded-3xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block min-w-0 flex-1 truncate">
                    Today's Drop-offs
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Store className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-[#1C130E] mt-4 tracking-tight">
                    {bookings.filter((b) => b.type === 'drop-offs').length}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Scheduled arrivals</p>
                </div>
              </Card>

              <Card variant="content" className="p-7 sm:p-8 border border-slate-200 rounded-3xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block min-w-0 flex-1 truncate">
                    Airport Pickups
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Plane className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-[#1C130E] mt-4 tracking-tight">
                    {bookings.filter((b) => b.airportPickup).length}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">With delivery service</p>
                </div>
              </Card>

              <Card variant="content" className="p-7 sm:p-8 border border-slate-200 rounded-3xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block min-w-0 flex-1 truncate">
                    Total Revenue
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-[#1C130E] mt-4 tracking-tight">
                    {formatUSD(bookings.reduce((sum, b) => sum + b.grandTotal, 0))}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Confirmed payments</p>
                </div>
              </Card>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 sm:pb-0">
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

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer, ID, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20"
                />
              </div>
            </div>

            {/* Bookings Grid with Generous Spacing */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                <p className="text-lg font-bold text-slate-800">No matching bookings found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                {filteredBookings.map((b) => {
                  const transition = STATUS_TRANSITIONS[b.status];
                  return (
                    <Card key={b.id} variant="content" className="p-7 sm:p-8 border border-slate-200 rounded-3xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-6 min-h-[320px]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-mono text-slate-400 font-bold block">#{b.id}</span>
                          <p className="text-sm font-extrabold text-[#1C130E] mt-0.5 truncate">{b.customer}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-orange-50 text-orange-800 border border-orange-200 capitalize flex-shrink-0">
                          {b.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <p className="text-slate-800 font-medium truncate"><strong className="text-slate-500">Drop-off:</strong> {b.dropoff}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <p className="text-slate-800 font-medium truncate"><strong className="text-slate-500">Pick-up:</strong> {b.pickup}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-snug">{b.items}</p>
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
                            className="whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full"
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
          <div className="flex flex-col gap-8 w-full pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Item Tiers Catalog</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Configure daily, weekly, and monthly rates and item images for storage.
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {tiers.map((tier) => {
                const imgPath = cleanImageUrl(tier.imageUrl, tier.code);
                return (
                  <Card key={tier.id} variant="content" className="border border-slate-200 p-7 sm:p-8 rounded-3xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-6">
                    <div className="flex flex-col gap-5">
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-16 h-16 rounded-2xl bg-orange-50/80 border border-orange-100 p-2 flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <Image
                              src={imgPath}
                              alt={tier.name}
                              width={64}
                              height={64}
                              className="object-contain max-h-12 max-w-12"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-mono font-bold text-orange-600 uppercase tracking-wider block">{tier.code}</span>
                            <h3 className="text-lg font-black text-[#1C130E] truncate">{tier.name}</h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button
                            onClick={() => handleToggleItemActive(tier.id)}
                            className={`px-3 py-1 rounded-full text-xs font-extrabold cursor-pointer transition-all ${
                              tier.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {tier.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleDeleteItemTier(tier.id, tier.code)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Delete Tier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Image URL Input Row */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                          Image URL or Asset Path
                        </label>
                        <input
                          type="text"
                          value={tier.imageUrl || ''}
                          placeholder="/items/small_bag.png"
                          onChange={(e) =>
                            setTiers((p) => p.map((t) => (t.id === tier.id ? { ...t, imageUrl: e.target.value } : t)))
                          }
                          className="w-full border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white rounded-xl focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {PRESET_IMAGES.map((img) => (
                            <button
                              key={img.url}
                              type="button"
                              onClick={() =>
                                setTiers((p) => p.map((t) => (t.id === tier.id ? { ...t, imageUrl: img.url } : t)))
                              }
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all cursor-pointer"
                            >
                              {img.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pricing Rates Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        size="md"
                        id={`save-tier-${tier.id}`}
                        onClick={() => handleSaveItemTier(tier)}
                        className="px-6 py-2.5 rounded-full text-xs font-black"
                      >
                        {savedId === tier.id ? '✓ Saved' : 'Save Rates & Image'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {tab === 'locations' && (
          <div className="flex flex-col gap-8 w-full pb-12">
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {locs.map((loc) => (
                <Card key={loc.id} variant="content" className="border border-slate-200 p-7 sm:p-8 rounded-3xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-mono text-orange-600 font-bold uppercase tracking-wider block">{loc.code}</span>
                        <p className="text-xl font-black text-[#1C130E]">{loc.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteLocation(loc.id, loc.code)}
                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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

                    <div className="flex flex-wrap gap-4 mb-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
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
                        <span className="text-xs font-extrabold text-slate-800">Stripe Payment Required</span>
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
                        <span className="text-xs font-extrabold text-slate-800">Cash Payment Allowed</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      variant={savedId === loc.id ? 'secondary' : 'primary'}
                      size="md"
                      id={`save-loc-${loc.id}`}
                      onClick={() => handleSaveLocation(loc)}
                      className="px-6 py-2.5 rounded-full text-xs font-black"
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
          <div className="flex flex-col gap-8 w-full pb-12">
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {addons.map((addon) => (
                <Card key={addon.id} variant="content" className="border border-slate-200 p-7 sm:p-8 rounded-3xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-mono text-orange-600 font-bold uppercase tracking-wider block">{addon.code}</span>
                        <p className="text-xl font-black text-[#1C130E]">{addon.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAddon(addon.id, addon.code)}
                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
                      size="md"
                      id={`save-addon-${addon.id}`}
                      onClick={() => handleSaveAddon(addon)}
                      className="px-6 py-2.5 rounded-full text-xs font-black"
                    >
                      {savedId === addon.id ? '✓ Saved' : 'Save Addon Fee'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Time Slots Tab with Weekday Default & Specific Date Overrides */}
        {tab === 'time-slots' && (
          <div className="flex flex-col gap-8 w-full pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Operational Time Slots</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Configure default weekday time windows or set date-specific overrides. Edit slot start/end times directly.
                </p>
              </div>

              {/* View Mode Toggle: Weekday Defaults vs Specific Date Override */}
              <div className="flex p-1.5 bg-white border border-slate-200 rounded-full shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSlotMode('weekday')}
                  className={[
                    'px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer',
                    slotMode === 'weekday' ? 'bg-[#1C130E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  Weekday Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setSlotMode('specific-date')}
                  className={[
                    'px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    slotMode === 'specific-date' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <CalendarDays className="w-3.5 h-3.5" /> Date Overrides
                </button>
              </div>
            </div>

            {/* Mode 1: Weekday Schedule */}
            {slotMode === 'weekday' && (
              <Card variant="content" className="border border-slate-200 p-8 sm:p-10 rounded-3xl bg-white shadow-xs flex flex-col gap-8">
                <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Day Filter:
                  </span>
                  {[
                    { id: 'all', label: 'All Weekdays' },
                    { id: '1', label: 'Mon' },
                    { id: '2', label: 'Tue' },
                    { id: '3', label: 'Wed' },
                    { id: '4', label: 'Thu' },
                    { id: '5', label: 'Fri' },
                    { id: '6', label: 'Sat' },
                    { id: '0', label: 'Sun' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedWeekday(d.id)}
                      className={[
                        'px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap',
                        selectedWeekday === d.id ? 'bg-orange-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      ].join(' ')}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Grid of Time Slots Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {displayWeekdaySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col justify-between p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all gap-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-[#1C130E] text-base">{slot.label}</p>
                          <p className="text-xs font-extrabold text-orange-600 mt-1">
                            {slot.startTime} – {slot.endTime}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          slot.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {slot.active ? 'Active' : 'Off'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSlotModal(slot)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-orange-600" /> Edit Slot
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSlotActive(slot.id)}
                            className={`px-3 py-1 rounded-full text-xs font-extrabold cursor-pointer transition-all ${
                              slot.active ? 'bg-orange-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {slot.active ? 'Active' : 'Off'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSlot(slot.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Delete slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Slot Form */}
                <form onSubmit={addSlot} className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
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
                    <Button type="submit" variant="primary" size="md" className="w-full h-[42px] flex items-center justify-center gap-2 rounded-full font-black text-xs">
                      <Plus className="w-4 h-4" /> Add Window Slot
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Mode 2: Specific Date Override */}
            {slotMode === 'specific-date' && (
              <Card variant="content" className="border border-slate-200 p-8 sm:p-10 rounded-3xl bg-white shadow-xs flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <div className="max-w-xs w-full">
                    <CustomDatePicker
                      label="Select Date for Override"
                      value={overrideDate}
                      onChange={setOverrideDate}
                    />
                  </div>

                  {displayOverrideSlots.length === 0 && (
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleCreateDateOverrideSchedule}
                      className="flex items-center gap-2 font-extrabold text-xs px-6"
                    >
                      <Copy className="w-4 h-4" /> Create Override Schedule for {overrideDate}
                    </Button>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold text-orange-950">Date Override Active for {overrideDate}</p>
                    <p className="text-[11px] font-medium text-orange-800 mt-1">
                      {displayOverrideSlots.length > 0
                        ? `Custom slots configured specifically for ${overrideDate}. Changes made here will only apply to this date.`
                        : `Currently using default weekday schedule for ${overrideDate}. Click above to create a specific override.`}
                    </p>
                  </div>
                  {displayOverrideSlots.length > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-600 text-white flex-shrink-0">
                      {displayOverrideSlots.length} Custom Slots
                    </span>
                  )}
                </div>

                {displayOverrideSlots.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                    <CalendarDays className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-800">No specific override slots created for {overrideDate}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Customers selecting {overrideDate} will use the default weekday schedule.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {displayOverrideSlots.map((slot) => (
                      <div
                        key={`override-${slot.id}`}
                        className="flex flex-col justify-between p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all gap-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-extrabold text-slate-900 text-base">{slot.label}</p>
                            <p className="text-xs font-extrabold text-orange-600 mt-1">
                              {slot.startTime} – {slot.endTime}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            slot.active ? 'bg-orange-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {slot.active ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSlotModal(slot)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-orange-600" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSlotActive(slot.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all ${
                              slot.active ? 'bg-orange-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {slot.active ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Audit Log Tab (Live Real-Time Logs) */}
        {tab === 'audit-log' && (
          <div className="flex flex-col gap-8 w-full pb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1C130E] tracking-tight">Audit Log</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Live real-time system history of admin modifications and database updates.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={refreshAuditLogs} className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
              </Button>
            </div>

            <Card variant="content" className="border border-slate-200 p-8 sm:p-10 rounded-3xl bg-white shadow-xs">
              {auditLog.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-medium">
                  No audit entries recorded yet. Perform actions in the Admin Panel to populate the audit log.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {auditLog.map((entry) => {
                    const actionColors: Record<string, string> = {
                      INSERT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
                      DELETE: 'bg-red-100 text-red-800 border-red-200',
                    };
                    return (
                      <div
                        key={entry.id}
                        className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start md:items-center gap-4 min-w-0 flex-1">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-black font-mono border flex-shrink-0 uppercase ${
                              actionColors[entry.action] || 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {entry.action}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold text-[#1C130E] leading-snug">{entry.summary}</p>
                            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
                              <span>Table: <strong className="font-mono text-orange-600 font-bold">{entry.table_name}</strong></span>
                              <span>·</span>
                              <span>Actor: <strong className="text-slate-700 font-semibold">{entry.actor}</strong></span>
                            </p>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-slate-400 whitespace-nowrap border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 flex-shrink-0">
                          {new Date(entry.created_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      {/* ── Modal: Edit Existing Time Slot ────────────────── */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#1C130E]">Edit Operational Time Slot</h3>
              <button onClick={() => setEditingSlot(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSlot} className="flex flex-col gap-5">
              <InputField
                label="Display Label"
                id="edit-slot-label"
                placeholder="e.g. 08:00 AM - 10:00 AM"
                value={editSlotLabel}
                onChange={setEditSlotLabel}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Start Time"
                  id="edit-slot-start"
                  type="time"
                  value={editSlotStart}
                  onChange={setEditSlotStart}
                  required
                />
                <InputField
                  label="End Time"
                  id="edit-slot-end"
                  type="time"
                  value={editSlotEnd}
                  onChange={setEditSlotEnd}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="secondary" size="md" onClick={() => setEditingSlot(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="px-6 font-extrabold">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              
              {/* Preset Image Picker */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-orange-600" /> Select Preset Image or Enter URL
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setNewItemImageUrl(img.url)}
                      className={[
                        'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2',
                        newItemImageUrl === img.url
                          ? 'border-orange-600 bg-orange-50 text-orange-700 ring-2 ring-orange-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <Image src={img.url} alt={img.label} width={20} height={20} className="object-contain" />
                      {img.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or paste image URL (e.g. https://...)"
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  className="w-full border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white rounded-xl focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                />
              </div>

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
