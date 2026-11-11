import { CANCELLED, RULES } from './config.ts';
import type { Order, Slot } from './types.ts';

// 5 → "05"  (aggiunge lo zero davanti)
const pad = (n: number) => String(n).padStart(2, '0');

// "19:15" → 1155  (minuti dalla mezzanotte: 19*60 + 15)
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// data → "2026-10-21"
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;


// ["19:00", "19:15", "19:30", ... "20:45"]
export function slotTimes(): string[] {
  const times: string[] = [];
  for (let t = toMinutes(RULES.FIRST_SLOT); t <= toMinutes(RULES.LAST_SLOT); t += RULES.SLOT_MINUTES) {
    times.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return times;
}

// "2026-10-21T19:15" → la data vera, per confrontarla con "adesso"
export function slotStart(id: string): Date {
  const [date, time] = id.split('T');
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi);
}

// Quanti ordini ci sono in questo slot (gli annullati NON contano)
export function countBooked(orders: Order[], slotId: string): number {
  return orders.filter((o) => o.slot === slotId && o.status !== CANCELLED).length;
}


export function buildSlots(orders: Order[], now: Date = new Date()): Slot[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const days = [
    { day: 'oggi' as const, date: today },
    { day: 'domani' as const, date: tomorrow },
  ];

  const result: Slot[] = [];
  for (const { day, date } of days) {
    for (const time of slotTimes()) {
      const id = `${toDateKey(date)}T${time}`;
      const booked = countBooked(orders, id);
      const started = slotStart(id) <= now;               // già iniziato?
      const full = booked >= RULES.SLOT_CAPACITY;         // pieno?
      result.push({
        id, day, time, booked,
        capacity: RULES.SLOT_CAPACITY,
        started, full,
        available: !started && !full,                     // scegliibile solo se NON iniziato e NON pieno
      });
    }
  }
  return result;
}