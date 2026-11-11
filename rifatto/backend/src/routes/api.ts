import { Router } from 'express';
import { getDb, reset, save } from '../repository.ts';
import { CANCELLED, CATEGORIES, LABELS, RULES, STATUS_FLOW } from '../config.ts';import { advanceOrder, cancelOrder, createOrder } from '../orders.ts';
import { buildSlots, slotStart } from '../slots.ts';


export const api = Router();

// ---------- LETTURA (GET = "dammi") ----------

// Regole, stati e categorie: il front end si adatta da solo
api.get('/config', (req, res) => {
  res.json({ labels: LABELS, rules: RULES, statusFlow: STATUS_FLOW, cancelledStatus: CANCELLED, categories: CATEGORIES });
});

// Il catalogo
api.get('/products', (req, res) => {
  res.json(getDb().products);
});

// Gli slot di oggi e domani, calcolati al volo
api.get('/slots', (req, res) => {
  res.json(buildSlots(getDb().orders));
});

// Tutti gli ordini (staff) oppure solo alcuni: /orders?ids=a,b (cliente)
api.get('/orders', (req, res) => {
  const all = getDb().orders;
  const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',') : null;
  const list = ids ? all.filter((o) => ids.includes(o.id)) : all;
  // ordinati per orario di ritiro, poi per numero
  const sorted = [...list].sort((a, b) => slotStart(a.slot).getTime() - slotStart(b.slot).getTime() || a.number - b.number);
  res.json(sorted);
});

// ---------- AZIONI (POST = "fai questa cosa") ----------

api.post('/orders', (req, res) => {
  const order = createOrder(getDb(), req.body);
  save();
  res.status(201).json(order);
});

api.post('/orders/:id/advance', (req, res) => {
  const order = advanceOrder(getDb(), req.params.id);
  save();
  res.json(order);
});

api.post('/orders/:id/cancel', (req, res) => {
  const order = cancelOrder(getDb(), req.params.id);
  save();
  res.json(order);
});

api.post('/reset', (req, res) => {
  reset();
  res.json({ ok: true });
});

