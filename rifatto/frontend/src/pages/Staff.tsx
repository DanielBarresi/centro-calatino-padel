import { useState } from 'react';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { useStore } from '../context/StoreContext';
import { usePolling } from '../hooks/usePolling';
import type { Order } from '../types';
import { formatPrice, formatSlot } from '../utils';

// Req. 7: ordini raggruppati per slot; il bottone porta SOLO allo stato successivo
export default function Staff() {
  // Lo staff vuole TUTTI gli ordini, aggiornati ogni 3 secondi
  const { data: orders, loading, refresh } = usePolling(api.getAllOrders, [] as Order[]);
  const { refreshAll, config } = useStore();
  const { labels, rules, statusFlow, cancelledStatus } = config;

  const [showClosed, setShowClosed] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  // Un ordine è "chiuso" se è ritirato o annullato
  const finalStatus = statusFlow[statusFlow.length - 1];
  const isClosed = (o: Order) => o.status === finalStatus || o.status === cancelledStatus;
  const visible = orders.filter((o) => showClosed || !isClosed(o));

  // Raggruppo gli ordini per slot: { "19:00": [ordine, ordine], "19:15": [...] }
  const groups = new Map<string, Order[]>();
  for (const o of visible) {
    groups.set(o.slot, [...(groups.get(o.slot) ?? []), o]);
  }

  // Quanti posti sono occupati in uno slot (gli annullati non contano)
  const occupied = (slot: string) => orders.filter((o) => o.slot === slot && o.status !== cancelledStatus).length;

  // SOLO per scrivere il testo del bottone: la decisione vera la prende il server
  const nextOf = (o: Order) => {
    const i = statusFlow.indexOf(o.status);
    return i >= 0 && i < statusFlow.length - 1 ? statusFlow[i + 1] : null;
  };

  // Lo staff preme "avanti"
  const advance = async (o: Order) => {
    setBusy(o.id);
    setError('');
    try {
      await api.advanceOrder(o.id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  // Ripristino dati demo
  const resetDemo = async () => {
    if (!confirm('Cancellare tutti gli ordini e ripristinare le scorte iniziali?')) return;
    await api.reset();
    await Promise.all([refresh(), refreshAll()]);
  };

    return (
    <section>
      <div className="page-head">
        <h1>{labels.staffTitle}</h1>
        <p className="muted">Vista staff · massimo {rules.SLOT_CAPACITY} per orario</p>
      </div>

      <label className="check">
        <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
        Mostra ritirati e annullati
      </label>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="empty">Caricamento…</p>
      ) : groups.size === 0 ? (
        <p className="empty">{labels.noOrders} da mostrare.</p>
      ) : (
        [...groups].map(([slot, list]) => (
          <div key={slot} className="group">
            <h2 className="group__head">
              {formatSlot(slot)}
              <span className={`group__cap ${occupied(slot) >= rules.SLOT_CAPACITY ? 'group__cap--full' : ''}`}>
                {occupied(slot)}/{rules.SLOT_CAPACITY}
              </span>
            </h2>
            <div className="group__grid">
              {list.map((o) => {
                const next = nextOf(o);
                return (
                  <article key={o.id} className={`panel order ${isClosed(o) ? 'order--off' : ''}`}>
                    <header className="order__head">
                      <div>
                        <span className="order__num">N. {o.number}</span>
                        <div className="muted small">{o.customerName}</div>
                      </div>
                      <StatusBadge status={o.status} />
                    </header>
                    <ul className="lines">
                      {o.lines.map((l) => (
                        <li key={l.productId}>
                          <span>{l.quantity} × {l.name}</span>
                          <span>{formatPrice(l.price * l.quantity)}</span>
                        </li>
                      ))}
                      <li className="lines__total"><span>Totale</span><span>{formatPrice(o.total)}</span></li>
                    </ul>
                    {next && (
                      <button className="btn btn--staff" disabled={busy === o.id} onClick={() => advance(o)}>
                        {busy === o.id ? '…' : `Segna come “${next}”`}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        ))
      )}

      <button className="link-btn reset" onClick={resetDemo}>Ripristina dati demo</button>
    </section>
  );
}