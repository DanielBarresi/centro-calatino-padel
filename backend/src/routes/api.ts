// riceve la richiesta, chiama il regolamento, salva, risponde

import { Router } from 'express';
import { COURTS, RULES, USERS } from '../config.ts';
import { getDb, reset, save } from '../repository.ts';
import { cancelBooking, cancellationPenalty, createBooking, findBooking, findUser, isActive } from '../services/bookings.ts';
import { bookableDays, priceFor, slotTimes, toDate } from '../services/slots.ts';

// Rotte "sottili": leggono la richiesta, chiamano il service, salvano e rispondono
export const api = Router();

// Dati fissi: campi, utenti e regole
api.get('/config', (_req, res) => {
  res.json({ courts: COURTS, users: USERS, rules: RULES, slots: slotTimes() });
});

// Req. 2: giorni prenotabili per l'utente (7 o 14)
api.get('/days', (req, res) => {
  res.json(bookableDays(findUser(req.query.userId)));
});

// Req. 2: griglia di un giorno, con stato e prezzo di ogni slot per ogni campo
api.get('/grid', (req, res) => {
  const user = findUser(req.query.userId);
  const date = String(req.query.date ?? '');
  const now = new Date();
  const booked = getDb().bookings.filter((b) => b.date === date && b.status !== 'annullata');

  const grid = COURTS.map((court) => ({
    court,
    cells: slotTimes().map((s) => {
      const b = booked.find((x) => x.courtId === court.id && x.start === s.start);
      const status = b ? (b.userId === user.id ? 'mine' : 'booked') : toDate(date, s.start) <= now ? 'past' : 'free';
      return { ...s, status, price: priceFor(date, s.start, user) };
    }),
  }));
  res.json(grid);
});

// Req. 7: le prenotazioni dell'utente, con quelle attive in evidenza
api.get('/bookings', (req, res) => {
  const user = findUser(req.query.userId);
  const now = new Date();
  const list = getDb()
    .bookings.filter((b) => b.userId === user.id)
    .map((b) => ({ ...b, active: isActive(b, now) }))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  res.json(list);
});

// Req. 7: anteprima della penale, da mostrare PRIMA della conferma
api.get('/bookings/:id/penalty', (req, res) => {
  res.json({ penalty: cancellationPenalty(findBooking(getDb(), req.params.id)) });
});

api.post('/bookings', (req, res) => {
  const booking = createBooking(getDb(), req.body ?? {});
  save();
  res.status(201).json(booking);
});

api.post('/bookings/:id/cancel', (req, res) => {
  const booking = cancelBooking(getDb(), req.params.id, req.body?.userId);
  save();
  res.json(booking);
});

// Ripristina i dati (comodo per la demo)
api.post('/reset', (_req, res) => {
  reset();
  res.json({ ok: true });
});