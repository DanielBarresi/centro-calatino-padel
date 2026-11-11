import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StatusBadge, StatusSteps } from '../components/StatusBadge';
import { useStore } from '../context/StoreContext';
import { formatPrice, formatSlot } from '../utils';

// Req. 3 (l'ordine resta dopo il ricaricamento) e req. 8 (annullamento)
export default function MyOrders() {
  const { myOrders, cancelOrder, config } = useStore();
  const { labels, statusFlow, cancelledStatus } = config;
  const location = useLocation();
  const justCreated = (location.state as { justCreated?: string } | null)?.justCreated;
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const handleCancel = async (id: string, number: number) => {
    if (!confirm(`${labels.cancelButton} n. ${number}?`)) return;
    setBusy(id);
    setError('');
    try {
      await cancelOrder(id);
    } catch (e) {
      setError((e as Error).message); // es. lo staff ha appena cambiato stato
    } finally {
      setBusy('');
    }
  };

  if (myOrders.length === 0) {
    return (
      <section className="empty-state">
        <h1>{labels.noOrders}</h1>
        <p className="muted">Quelli fatti da questo browser compariranno qui.</p>
        <Link to="/" className="btn">Vai a: {labels.catalogTitle}</Link>
      </section>
    );
  }

  const list = [...myOrders].sort((a, b) => b.number - a.number); // i più recenti in alto

  return (
    <section className="my">
      <h1>{labels.myOrdersTitle}</h1>
      {error && <p className="error" role="alert">{error}</p>}

      {list.map((o) => (
        <article key={o.id} className={`panel order ${o.id === justCreated ? 'order--new' : ''} ${o.status === cancelledStatus ? 'order--off' : ''}`}>
          {o.id === justCreated && <p className="order__new">{labels.orderConfirmed}</p>}
          <header className="order__head">
            <div>
              <span className="order__num">N. {o.number}</span>
              <div className="muted small">Ritiro {formatSlot(o.slot)} · {o.customerName}</div>
            </div>
            <StatusBadge status={o.status} />
          </header>

          <StatusSteps status={o.status} />

          <ul className="lines">
            {o.lines.map((l) => (
              <li key={l.productId}>
                <span>{l.quantity} × {l.name}</span>
                <span>{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
            <li className="lines__total"><span>Totale</span><span>{formatPrice(o.total)}</span></li>
          </ul>

          {/* Req. 8: annullabile solo nel primo stato */}
          {o.status === statusFlow[0] && (
            <button className="btn btn--ghost" disabled={busy === o.id} onClick={() => handleCancel(o.id, o.number)}>
              {busy === o.id ? 'Annullamento…' : labels.cancelButton}
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
