import { randomUUID } from 'node:crypto';
import { CANCELLED, RULES, STATUS_FLOW } from './config.ts';
import type { Database, Order, OrderLine } from './types.ts';
import { buildSlots } from './slots.ts';

// Il bigliettino del cliente: SOLO id e quantità, niente prezzi
interface NewOrderInput {
  customerName: string;
  slot: string;
  items: { productId: string; quantity: number }[];
}

export class AppError extends Error{
    status:number;
    constructor(status: number, message:string){
        super(message);
        this.status = status;
    }
}

export function createOrder(db: Database, input: NewOrderInput, now: Date= new Date()): Order{
      // PASSO 1 — il bigliettino è scritto bene?
    if (!input.customerName || input.customerName.trim().length < 2){
        throw new AppError(400, 'Inserisci il tuo nome');
    }

    if (!Array.isArray(input.items) || input.items.length === 0){
        throw new AppError(400, 'Il carrello è vuoto');
    }

  // PASSO 2 — scorte: preparo le righe con nome e prezzo DEL SERVER

    const lines: OrderLine[]= [];
    for (const item of input.items){
        const product = db.products.find((p) => p.id === item.productId);
        if( !product) throw new AppError(400, 'Prodotto inesistente');
        if (!Number.isInteger(item.quantity) || item.quantity <1) throw new AppError(400, 'Quantità non valida');
        if (product.stock === 0) throw new AppError (409, `${product.name} è esaurito `);
        if (item.quantity > product.stock) throw new AppError(409, `Di ${product.name} ne restano solo ${product.stock}`);
        lines.push({productId:product.id, name: product.name, price: product.price,quantity:item.quantity});
    }

    //passo 3 minimo d'ordine

  const total = Math.round(lines.reduce((sum, l) => sum + l.price * l.quantity, 0) * 100) / 100;
  if (total < RULES.MIN_TOTAL) throw new AppError(400, `L'ordine minimo è di ${RULES.MIN_TOTAL} €`);



//PASSO 4 LO SLOT ESISTE NON èP INIZIATO NON è PIENO?

const slot = buildSlots(db.orders, now).find((s) => s.id === input.slot);
  if (!slot) throw new AppError(400, 'Orario non valido');
  if (slot.started) throw new AppError(409, 'Questo orario è già iniziato');
  if (slot.full) throw new AppError(409, 'Questo orario è pieno');


  //passo 5 tutto ok, solo ORA MODIFICO I DATI
  for (const line of lines){
    const product = db.products.find((p) => p.id === line.productId)!;
    product.stock -= line.quantity;
  }


  const order:Order={
    id:randomUUID(),
    number:db.nextNumber++,
    customerName: input.customerName.trim(),
    slot: slot.id, lines,total,
    status: STATUS_FLOW[0],
    createdAt: now.toISOString(),
  };
  db.orders.push(order);
  return order;
}

//passo 6 funzione per cercare ordine per id se non ci sta errore 404

function findOrder(db: Database,id:string):Order{
  const order= db.orders.find((o) => o.id ===id);
  if (!order) throw new AppError(404, 'Ordine non trovato');
  return order;
}

export function advanceOrder(db: Database,id:string):Order{
  const order = findOrder(db,id);
  const index = STATUS_FLOW.indexOf(order.status);

  if (index===-1) throw new AppError(409, 'Un ordine annullato non può cambiare stato');
  if (index === STATUS_FLOW.length - 1) throw new AppError(409, "L'ordine è già nello stato finale");

  order.status = STATUS_FLOW[index + 1];
  return order;
}


// Il cliente annulla: solo se l'ordine è ancora nel PRIMO stato
export function cancelOrder(db: Database, id: string): Order {
  const order = findOrder(db, id);

  if (order.status !== STATUS_FLOW[0]) {
    throw new AppError(409, `Si può annullare solo nello stato "${STATUS_FLOW[0]}"`);
  }

  // Rimetto i prodotti in magazzino
  for (const line of order.lines) {
    const product = db.products.find((p) => p.id === line.productId);
    if (product) product.stock += line.quantity;
  }

  order.status = CANCELLED;
  return order;
}