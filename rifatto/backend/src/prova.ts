import { getDb, save } from './repository.ts';
import { buildSlots } from './slots.ts';
   import { createOrder, advanceOrder, cancelOrder, AppError } from './orders.ts';
const db= getDb();


//vado a prendere il primo slot libero

const slotLibero = buildSlots (db.orders).find((s) => s.available)!;
console.log('Slot scelto:', slotLibero.id);

//1 ordine giusto 2 x pasta ecc ecc

const ordine = createOrder(db,{
    customerName: 'Giulia',
    slot:slotLibero.id, 
    items:[{productId: 'p3', quantity:2}],
});

save();
console.log('Creato! Numero:', ordine.number, '| Totale:', ordine.total, '| Stato:', ordine.status);
console.log('Pasta rimasta in magazzino:', db.products.find((p) => p.id === 'p3')!.stock);


//ordine sbagliato tipo pasta esaurita

try {
  createOrder(db, {
    customerName: 'Marco',
    slot: slotLibero.id,
    items: [{ productId: 'p4', quantity: 1 }],
  });
} catch (e) {
  const errore = e as AppError;
  console.log('Rifiutato!', errore.status, '-', errore.message);
}

// 3) Avanzo l'ordine di Giulia
advanceOrder(db, ordine.id);
console.log('Dopo avanti:', ordine.status);

// 4) Provo ad annullarlo: deve essere RIFIUTATO
try {
  cancelOrder(db, ordine.id);
} catch (e) {
  console.log('Annullamento rifiutato!', (e as AppError).status, '-', (e as AppError).message);
}
save();