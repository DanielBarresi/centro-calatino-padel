import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import type { Database } from './types.ts';
import { PRODUCTS } from './config.ts';

const FILE = 'data/db.json';

// Il quaderno nuovo: prodotti iniziali, nessun ordine, si parte dal numero 1
function createSeed(): Database {
  return { products: structuredClone(PRODUCTS), orders: [], nextNumber: 1 };
}

// All'avvio: se il quaderno esiste lo leggo, altrimenti ne creo uno nuovo
function load(): Database {
  if (existsSync(FILE)) {
    return JSON.parse(readFileSync(FILE, 'utf-8'));
  }
  return createSeed();
}

// Il database vive in memoria mentre il server è acceso
const db: Database = load();

// Gli altri file chiedono i dati da qui
export function getDb(): Database {
  return db;
}

// Ricopio il quaderno: prima su un foglio di brutta, poi lo sostituisco
export function save(): void {
  mkdirSync('data', { recursive: true });
  writeFileSync(FILE + '.tmp', JSON.stringify(db, null, 2));
  renameSync(FILE + '.tmp', FILE);
}

// Ricomincio da capo (bottone "Ripristina dati demo")
export function reset(): void {
  Object.assign(db, createSeed());
  save();
}