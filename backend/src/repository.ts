// l’unico che legge e scrive db.json

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Database } from './types.ts';

// Modulo dedicato alla persistenza: è l'unico file che legge e scrive i dati.
// Il resto del server usa solo getDb() e save().
const DB_PATH =
  process.env.DB_PATH ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'db.json');

export const createSeed = (): Database => ({
  bookings: [],
});

function load(): Database {
  try {
    if (existsSync(DB_PATH)) return JSON.parse(readFileSync(DB_PATH, 'utf-8')) as Database;
  } catch {
    console.warn('Database non leggibile: riparto dai dati iniziali');
  }
  return createSeed();
}

// I dati stanno in memoria e vengono riscritti su file a ogni modifica
const db: Database = load();

export function getDb(): Database {
  return db;
}

// Scrittura atomica: scrivo su un file temporaneo e poi lo rinomino.
// Se il server si blocca a metà, il file vero resta integro.
export function save(): void {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(db, null, 2));
  renameSync(tmp, DB_PATH);
}

export function reset(): void {
  Object.assign(db, createSeed());
  save();
}

save(); // crea il file al primo avvio