'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import { getTimeSlots, TimeSlot } from '@/lib/timeSlots';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';

interface DateTimePickerProps {
  dropoffTime: string; // ISO string like 2026-07-26T10:00
  pickupTime: string;  // ISO string
  onDropoffChange: (time: string) => void;
  onPickupChange: (time: string) => void;
}

export function DateTimePicker({
  dropoffTime,
  pickupTime,
  onDropoffChange,
  onPickupChange,
}: DateTimePickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    setSlots(getTimeSlots().filter(s => s.active));
  }, []);

  const splitDateTime = (isoString: string) => {
    if (!isoString) return { date: '', time: '10:00' };
    const [date, timePart] = isoString.split('T');
    return { date, time: timePart?.slice(0, 5) || '10:00' };
  };

  const dropoff = splitDateTime(dropoffTime);
  const pickup = splitDateTime(pickupTime);

  const handleDateChange = (type: 'dropoff' | 'pickup', newDate: string) => {
    const currentTime = type === 'dropoff' ? dropoff.time : pickup.time;
    const timeToUse = currentTime || (slots[0]?.startTime || '10:00');

    if (type === 'dropoff') {
      onDropoffChange(`${newDate}T${timeToUse}`);
      // Auto-secure: If pickup date is before new dropoff date, reset pickup to new dropoff date
      if (pickup.date && pickup.date < newDate) {
        onPickupChange(`${newDate}T${pickup.time || '10:00'}`);
      }
    } else {
      // Auto-secure: Prevent selecting pickup date prior to dropoff date
      if (dropoff.date && newDate < dropoff.date) {
        onPickupChange(`${dropoff.date}T${timeToUse}`);
      } else {
        onPickupChange(`${newDate}T${timeToUse}`);
      }
    }
  };

  const handleSlotSelect = (type: 'dropoff' | 'pickup', slot: TimeSlot) => {
    const currentDate = type === 'dropoff' ? dropoff.date : pickup.date;
    const dateToUse = currentDate || new Date().toISOString().split('T')[0];
    if (type === 'dropoff') {
      onDropoffChange(`${dateToUse}T${slot.startTime}`);
    } else {
      onPickupChange(`${dateToUse}T${slot.startTime}`);
    }
  };

  const now = new Date();
  const minDateStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const isInvalidRange = dropoffTime && pickupTime && new Date(pickupTime) <= new Date(dropoffTime);

  return (
    <div className="flex flex-col gap-6" id="datetime-picker">
      {/* ── Drop-off Section ─────────────────────────────── */}
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

        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Select Drop-off Time Window
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {slots.map((slot) => {
              const isSelected = dropoff.time === slot.startTime;
              return (
                <button
                  key={`dropoff-slot-${slot.id}`}
                  type="button"
                  onClick={() => handleSlotSelect('dropoff', slot)}
                  className={[
                    'py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5',
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-1 ring-orange-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300',
                  ].join(' ')}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="truncate">{slot.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Pick-up Section ──────────────────────────────── */}
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

        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Select Pick-up Time Window
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {slots.map((slot) => {
              const isSelected = pickup.time === slot.startTime;
              return (
                <button
                  key={`pickup-slot-${slot.id}`}
                  type="button"
                  onClick={() => handleSlotSelect('pickup', slot)}
                  className={[
                    'py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5',
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-1 ring-orange-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300',
                  ].join(' ')}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="truncate">{slot.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Validation Warning if Pick-up <= Drop-off */}
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
