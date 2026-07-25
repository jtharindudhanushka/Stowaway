export interface TimeSlot {
  id: string;
  label: string;
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  active: boolean;
}

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 'slot-1', label: '08:00 AM - 10:00 AM', startTime: '08:00', endTime: '10:00', active: true },
  { id: 'slot-2', label: '10:00 AM - 12:00 PM', startTime: '10:00', endTime: '12:00', active: true },
  { id: 'slot-3', label: '12:00 PM - 02:00 PM', startTime: '12:00', endTime: '14:00', active: true },
  { id: 'slot-4', label: '02:00 PM - 04:00 PM', startTime: '14:00', endTime: '16:00', active: true },
  { id: 'slot-5', label: '04:00 PM - 06:00 PM', startTime: '16:00', endTime: '18:00', active: true },
  { id: 'slot-6', label: '06:00 PM - 08:00 PM', startTime: '18:00', endTime: '20:00', active: true },
  { id: 'slot-7', label: '08:00 PM - 10:00 PM', startTime: '20:00', endTime: '22:00', active: true },
];

const LOCAL_STORAGE_KEY = 'stowaway_custom_time_slots';

export function getTimeSlots(): TimeSlot[] {
  if (typeof window === 'undefined') return DEFAULT_TIME_SLOTS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load custom time slots', e);
  }
  return DEFAULT_TIME_SLOTS;
}

export function saveTimeSlots(slots: TimeSlot[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(slots));
  } catch (e) {
    console.error('Failed to save time slots', e);
  }
}
