'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, AlertCircle, Hourglass } from 'lucide-react';
import { getTimeSlots, type TimeSlot } from '@/lib/timeSlots';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';

interface DateTimePickerProps {
  dropoffTime: string; // ISO string like 2026-07-26T10:00
  pickupTime: string;
  onDropoffChange: (time: string) => void;
  onPickupChange: (time: string) => void;
}

function formatSlotDisplay(rawLabel: string): string {
  return rawLabel.replace(/^0/, '').replace(/ - 0/g, ' – ').replace(/ - /g, ' – ');
}

function SlotBadge({ slotType }: { slotType: 'window' | 'hourly' }) {
  if (slotType === 'hourly') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200 leading-none">
        <Hourglass className="w-2.5 h-2.5" />1h
      </span>
    );
  }
  return null; // window slots are the default — no badge needed
}

export function DateTimePicker({
  dropoffTime,
  pickupTime,
  onDropoffChange,
  onPickupChange,
}: DateTimePickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const targetDate = dropoffTime?.split('T')[0];
    const url = targetDate ? `/api/time-slots?date=${targetDate}` : '/api/time-slots';
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.timeSlots && data.timeSlots.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: TimeSlot[] = data.timeSlots.map((s: any) => ({
            id:           s.id,
            label:        s.label,
            startTime:    s.start_time || s.startTime,
            endTime:      s.end_time   || s.endTime,
            slotType:     s.slot_type  || s.slotType || 'window',
            active:       s.is_active  ?? s.active ?? true,
            dayOfWeek:    s.day_of_week || s.dayOfWeek,
            specificDate: s.specific_date || s.specificDate,
          })).filter((s: TimeSlot) => s.active);
          setSlots(mapped);
        } else {
          setSlots(getTimeSlots().filter((s) => s.active));
        }
      })
      .catch(() => setSlots(getTimeSlots().filter((s) => s.active)));
  }, [dropoffTime]);

  const splitDateTime = (isoString: string) => {
    if (!isoString) return { date: '', time: '10:00' };
    const [date, timePart] = isoString.split('T');
    return { date, time: timePart?.slice(0, 5) || '10:00' };
  };

  const dropoff = splitDateTime(dropoffTime);
  const pickup  = splitDateTime(pickupTime);

  const handleDateChange = (type: 'dropoff' | 'pickup', newDate: string) => {
    const currentTime = type === 'dropoff' ? dropoff.time : pickup.time;
    const timeToUse = currentTime || (slots[0]?.startTime || '10:00');

    if (type === 'dropoff') {
      onDropoffChange(`${newDate}T${timeToUse}`);
      if (pickup.date && pickup.date < newDate) {
        onPickupChange(`${newDate}T${pickup.time || '10:00'}`);
      }
    } else {
      if (dropoff.date && newDate < dropoff.date) {
        onPickupChange(`${dropoff.date}T${timeToUse}`);
      } else {
        onPickupChange(`${newDate}T${timeToUse}`);
      }
    }
  };

  const handleSlotSelect = (type: 'dropoff' | 'pickup', slot: TimeSlot) => {
    const currentDate = type === 'dropoff' ? dropoff.date : pickup.date;
    const dateToUse   = currentDate || new Date().toISOString().split('T')[0];
    if (type === 'dropoff') {
      onDropoffChange(`${dateToUse}T${slot.startTime}`);
    } else {
      onPickupChange(`${dateToUse}T${slot.startTime}`);
    }
  };

  const now        = new Date();
  const minDateStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

  const isInvalidRange =
    dropoffTime && pickupTime && new Date(pickupTime) <= new Date(dropoffTime);

  const slotGrid = (type: 'dropoff' | 'pickup') => {
    const currentTime = type === 'dropoff' ? dropoff.time : pickup.time;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map((slot) => {
          const isSelected = currentTime === slot.startTime;
          return (
            <button
              key={`${type}-slot-${slot.id}`}
              type="button"
              onClick={() => handleSlotSelect(type, slot)}
              className={[
                'py-2.5 px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 leading-tight',
                isSelected
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-1 ring-orange-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300',
              ].join(' ')}
            >
              <span className="flex items-center gap-1">
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                <span>{formatSlotDisplay(slot.label)}</span>
              </span>
              {slot.slotType === 'hourly' && (
                <SlotBadge slotType="hourly" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6" id="datetime-picker">
      {/* ── Drop-off ─────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Calendar className="w-5 h-5 text-orange-600" />
          <h4 className="font-bold text-slate-900 text-base">Drop-off Date & Time</h4>
        </div>
        <div className="mb-5">
          <CustomDatePicker
            label="Select Drop-off Date"
            value={dropoff.date}
            minDate={minDateStr}
            onChange={(d) => handleDateChange('dropoff', d)}
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Select Drop-off Time Window
        </label>
        {slotGrid('dropoff')}
      </div>

      {/* ── Pick-up ──────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Calendar className="w-5 h-5 text-orange-600" />
          <h4 className="font-bold text-slate-900 text-base">Pick-up Date & Time</h4>
        </div>
        <div className="mb-5">
          <CustomDatePicker
            label="Select Pick-up Date"
            value={pickup.date}
            minDate={dropoff.date || minDateStr}
            onChange={(d) => handleDateChange('pickup', d)}
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Select Pick-up Time Window
        </label>
        {slotGrid('pickup')}

        {isInvalidRange && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-bold text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>Pick-up time must be after drop-off time. Please select a later date or time window.</span>
          </div>
        )}
      </div>
    </div>
  );
}
