// genera gli slot, i giorni prenotabili, il prezzo


import { RULES } from '../config.ts';
import type {User} from '../types.ts';

export const pad = (n:number) => String (n).padStart(2, '0');


//18:30


export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

//Date --> 2026-10-21 (ora locale)

export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// '2026-10-21' + '18:30' → Date vera, per confrontare con "adesso"
export function toDate(date: string, hhmm: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const min = toMinutes(hhmm);
  return new Date(y, mo - 1, d, Math.floor(min / 60), min % 60);
}

// Req. 2: slot da 90 minuti dalle 8:00, l'ultimo deve finire entro le 23:00
export function slotTimes(): { start: string; end: string }[] {
  const list: { start: string; end: string }[] = [];
  const close = toMinutes(RULES.CLOSING_TIME);
  for (let t = toMinutes(RULES.FIRST_SLOT); t + RULES.SLOT_MINUTES <= close; t += RULES.SLOT_MINUTES) {
    list.push({ start: toHHMM(t), end: toHHMM(t + RULES.SLOT_MINUTES) });
  }
  return list;
}

// Req. 2 e 8: giorni prenotabili, da oggi a +7 (+14 per i tesserati)
export function bookableDays(user: User, now = new Date()): string[] {
  const ahead = user.member ? RULES.MEMBER_DAYS_AHEAD : RULES.DAYS_AHEAD;
  const days: string[] = [];
  for (let i = 0; i <= ahead; i++) {
    days.push(toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)));
  }
  return days;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Req. 5 e 8: prezzo di uno slot per un certo utente
export function priceFor(date: string, start: string, user: User): number {
  const day = toDate(date, start).getDay(); // 0 = domenica, 6 = sabato
  const weekend = day === 0 || day === 6;
  const evening = toMinutes(start) >= toMinutes(RULES.SURCHARGE_FROM);

  let price = RULES.BASE_PRICE;
  if (weekend || evening) price *= 1 + RULES.SURCHARGE; // non cumulabili: si applica una volta sola
  if (user.member) price *= 1 - RULES.MEMBER_DISCOUNT;  // sconto sul prezzo finale
  return round2(price);
}