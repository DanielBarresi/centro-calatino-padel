import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Database } from '../types.ts';
import { cancelBooking, cancellationPenalty, createBooking } from './bookings.ts';
import { bookableDays, priceFor, slotTimes } from './slots.ts';
import { USERS } from '../config.ts';

// "Adesso" fisso per i test: mercoledì 21 ottobre 2026, ore 10:00
const NOW = new Date(2026, 9, 21, 10, 0);
const member = USERS.find((u) => u.member)!;
const normal = USERS.find((u) => !u.member)!;
const other = USERS.filter((u) => !u.member)[1];
const emptyDb = (): Database => ({ bookings: [] });

const fails = (fn: () => unknown, status: number) =>
  assert.throws(fn, (e: Error & { status?: number }) => e.status === status);

test('req. 2: 10 slot da 90 minuti, l\'ultimo finisce alle 23:00', () => {
  const slots = slotTimes();
  assert.equal(slots.length, 10);
  assert.deepEqual(slots[0], { start: '08:00', end: '09:30' });
  assert.deepEqual(slots.at(-1), { start: '21:30', end: '23:00' });
});

test('req. 2 e 8: 7 giorni avanti, 14 per i tesserati', () => {
  assert.equal(bookableDays(normal, NOW).length, 8); // oggi + 7
  assert.equal(bookableDays(member, NOW).length, 15); // oggi + 14
});

test('req. 5 e 8: prezzi e maggiorazioni non cumulabili', () => {
  assert.equal(priceFor('2026-10-21', '09:30', normal), 40); // mercoledì mattina
  assert.equal(priceFor('2026-10-21', '18:30', normal), 50); // dalle 18:00
  assert.equal(priceFor('2026-10-24', '09:30', normal), 50); // sabato
  assert.equal(priceFor('2026-10-24', '20:00', normal), 50); // sabato sera: +25% una volta sola
  assert.equal(priceFor('2026-10-21', '09:30', member), 32); // -20%
  assert.equal(priceFor('2026-10-24', '20:00', member), 40);
});

test('req. 3: slot occupato o passato non prenotabile', () => {
  const db = emptyDb();
  createBooking(db, { userId: normal.id, courtId: 'c1', date: '2026-10-22', start: '09:30' }, NOW);
  fails(() => createBooking(db, { userId: other.id, courtId: 'c1', date: '2026-10-22', start: '09:30' }, NOW), 409);
  fails(() => createBooking(db, { userId: other.id, courtId: 'c1', date: '2026-10-21', start: '08:00' }, NOW), 409);
  // stesso orario ma altro campo: libero
  createBooking(db, { userId: other.id, courtId: 'c2', date: '2026-10-22', start: '09:30' }, NOW);
});

test('req. 6: massimo 2 prenotazioni attive', () => {
  const db = emptyDb();
  createBooking(db, { userId: normal.id, courtId: 'c1', date: '2026-10-22', start: '09:30' }, NOW);
  createBooking(db, { userId: normal.id, courtId: 'c1', date: '2026-10-23', start: '09:30' }, NOW);
  fails(() => createBooking(db, { userId: normal.id, courtId: 'c1', date: '2026-10-24', start: '09:30' }, NOW), 409);
});

test('req. 8: il tesserato prenota oltre i 7 giorni, gli altri no', () => {
  const db = emptyDb();
  fails(() => createBooking(db, { userId: normal.id, courtId: 'c3', date: '2026-10-31', start: '11:00' }, NOW), 400);
  createBooking(db, { userId: member.id, courtId: 'c3', date: '2026-10-31', start: '11:00' }, NOW);
});

test('req. 7: annullamento gratuito oltre 24 ore, penale 50% dopo', () => {
  const db = emptyDb();
  const far = createBooking(db, { userId: normal.id, courtId: 'c1', date: '2026-10-23', start: '09:30' }, NOW);
  const near = createBooking(db, { userId: normal.id, courtId: 'c2', date: '2026-10-21', start: '18:30' }, NOW);
  assert.equal(cancellationPenalty(far, NOW), 0);
  assert.equal(cancellationPenalty(near, NOW), 25); // 50% di 50 €
  fails(() => cancelBooking(db, near.id, other.id, NOW), 403); // non è sua
  assert.equal(cancelBooking(db, near.id, normal.id, NOW).penalty, 25);
  // annullata non conta più tra le attive: può prenotare di nuovo
  createBooking(db, { userId: normal.id, courtId: 'c3', date: '2026-10-22', start: '11:00' }, NOW);
});
