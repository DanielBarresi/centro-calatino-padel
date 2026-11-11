// crea e annulla, controlla occupato/passato/limite, calcola la penale


import { randomUUID } from 'node:crypto';
import { COURTS, RULES, USERS } from '../config.ts';
import type { Booking, Database, User } from '../types.ts';
import { bookableDays, priceFor, slotTimes, toDate } from './slots.ts';

//errore previsto

export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function findUser(id: unknown): User {
  const user = USERS.find((u) => u.id === id);
  if (!user) throw new AppError(400, 'Utente non valido');
  return user;
}


//req 6:attiva

export const isActive = (b: Booking, now = new Date()) =>
  b.status !== 'annullata' && toDate(b.date, b.end) > now;


//req 7 gratis fino a letteralmente 24 ore prima

export function cancellationPenalty(b: Booking, now = new Date()): number {
  const hoursLeft = (toDate(b.date, b.start).getTime() - now.getTime()) / 3_600_000;
  if (hoursLeft >= RULES.FREE_CANCEL_HOURS) return 0;
  return Math.round(b.price * RULES.PENALTY * 100) / 100;
}


export interface NewBookingInput {
  userId?: unknown;
  courtId?: unknown;
  date?: unknown;
  start?: unknown;
}

// Req. 3, 5, 6 e 8: tutti i controlli li fa il server
export function createBooking(db: Database, input: NewBookingInput, now = new Date()): Booking {
  const user = findUser(input.userId);

  const court = COURTS.find((c) => c.id === input.courtId);
  if (!court) throw new AppError(400, 'Campo non valido');

  const date = String(input.date ?? '');
  if (!bookableDays(user, now).includes(date)) throw new AppError(400, 'Giorno non prenotabile');

  const slot = slotTimes().find((s) => s.start === input.start);
  if (!slot) throw new AppError(400, 'Orario non valido');

  if (toDate(date, slot.start) <= now) throw new AppError(409, 'Lo slot è già iniziato o passato');

  const taken = db.bookings.some(
    (b) => b.status !== 'annullata' && b.courtId === court.id && b.date === date && b.start === slot.start,
  );
  if (taken) throw new AppError(409, 'Slot già occupato');

  const active = db.bookings.filter((b) => b.userId === user.id && isActive(b, now)).length;
  if (active >= RULES.MAX_ACTIVE) throw new AppError(409, `Hai già ${RULES.MAX_ACTIVE} prenotazioni attive`);

  const booking: Booking = {
    id: randomUUID(),
    userId: user.id,
    courtId: court.id,
    date,
    start: slot.start,
    end: slot.end,
    price: priceFor(date, slot.start, user),
    status: 'confermata',
    createdAt: now.toISOString(),
  };
  db.bookings.push(booking);
  return booking;
}

export function findBooking(db: Database, id: string): Booking {
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) throw new AppError(404, 'Prenotazione non trovata');
  return booking;
}

// Req. 7: annullamento, con la penale calcolata al momento
export function cancelBooking(db: Database, id: string, userId: unknown, now = new Date()): Booking {
  const booking = findBooking(db, id);
  if (booking.userId !== userId) throw new AppError(403, 'Non è una tua prenotazione');
  if (booking.status === 'annullata') throw new AppError(409, 'Prenotazione già annullata');
  if (toDate(booking.date, booking.start) <= now) throw new AppError(409, 'Lo slot è già iniziato');

  booking.penalty = cancellationPenalty(booking, now);
  booking.status = 'annullata';
  return booking;
}