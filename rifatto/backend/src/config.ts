import type {Product,Rules} from './types.ts';

//numeri della traccia

export const RULES: Rules = {
  SLOT_MINUTES: 15,      // ogni slot dura 15 minuti
  FIRST_SLOT: '19:00',   // il primo slot inizia alle 19:00
  LAST_SLOT: '20:45',    // l'ultimo slot INIZIA alle 20:45
  SLOT_CAPACITY: 5,      // massimo 5 ordini per slot
  MIN_TOTAL: 10,         // ordine minimo 10 €
  MAX_PER_ITEM: null,    // nessun limite per prodotto
};


//gli stati in ordine il primo e quello iniziale


export const STATUS_FLOW=['ricevuto', 'in preparazione','pronto','ritirato'];
export const CANCELLED: string = 'annullato';

export const CATEGORIES = ['Rosticceria', 'Primi', 'Bevande'];


//i prodotti iniziali.. vengono copiati nel database solo la prima volta

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Arancino', category: 'Rosticceria', price: 2.5, stock: 20, icon: '🍙' },
  { id: 'p2', name: 'Cartocciata', category: 'Rosticceria', price: 2.2, stock: 3, icon: '🥐' },
  { id: 'p3', name: 'Pasta alla Norma', category: 'Primi', price: 8, stock: 10, icon: '🍝' },
  { id: 'p4', name: 'Lasagna', category: 'Primi', price: 9, stock: 0, icon: '🥘' },
  { id: 'p5', name: 'Acqua', category: 'Bevande', price: 1, stock: 40, icon: '💧' },
];


export const LABELS={
   shopName: 'Rosticceria Da Samuele',
  tagline: 'Ordina da asporto e scegli quando ritirare.',
  catalogTitle: 'Menu',
  searchPlaceholder: 'Cerca nel menu…',
  allCategories: 'Tutti',
  noProducts: 'Nessun prodotto trovato.',
  slotTitle: 'Orario di ritiro',
  confirmButton: 'Conferma ordine',
  orderConfirmed: 'Ordine confermato',
  cancelButton: 'Annulla ordine',
  myOrdersTitle: 'I miei ordini',
  staffTitle: 'Ordini',
  noOrders: 'Nessun ordine',
  
}