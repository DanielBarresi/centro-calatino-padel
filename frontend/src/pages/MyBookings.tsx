import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { usePolling } from '../hooks/usePolling';
import type { Booking } from '../types';
import { formatDay, formatPrice } from '../utils';

// Req. 7: le mie prenotazioni, annullabili. La penale si vede PRIMA di confermare.
export default function MyBookings() {
  const { config, user } = useApp();
  const { rules } = config;
  const { data: bookings, refresh } = usePolling(() => api.getBookings(user.id), [] as Booking[], 5000);

  // Cambiando utente ricarico subito
  useEffect(() => {
    refresh();
  }, [user.id, refresh]);

  const [pending, setPending] = useState<{ booking: Booking; penalty: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const courtName = (id: string) => config.courts.find((c) => c.id === id)?.name ?? id;
  const started = (b: Booking) => new Date(`${b.date}T${b.start}`) <= new Date();

  // 1° passo: chiedo al server quanto costa annullare e lo mostro
  const askCancel = async (b: Booking) => {
    setError('');
    setMessage('');
    try {
      const { penalty } = await api.getPenalty(b.id);
      setPending({ booking: b, penalty });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 2° passo: l'utente ha visto la penale e conferma
  const confirmCancel = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const done = await api.cancel(pending.booking.id, user.id);
      setMessage(done.penalty ? `Prenotazione annullata, penale di ${formatPrice(done.penalty)}` : 'Prenotazione annullata gratuitamente');
      setPending(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  // Se cambio utente, la conferma aperta non vale più
  const open = pending && pending.booking.userId === user.id ? pending : null;

  const active = bookings.filter((b) => b.active);
  const others = bookings.filter((b) => !b.active).reverse(); // passate e annullate, le più recenti prima

  const card = (b: Booking) => {
    const label = b.status === 'annullata' ? 'annullata' : b.active ? 'attiva' : 'conclusa';
    const badge = b.status === 'annullata' ? 'status--cancelled' : b.active ? 'status--2' : 'status--done';
    return (
      <article key={b.id} className={`panel booking ${b.status === 'annullata' ? 'booking--off' : ''}`}>
        <div className="booking__head">
          <strong>{courtName(b.courtId)}</strong>
          <span className={`status ${badge}`}>{label}</span>
        </div>
        <p>
          {formatDay(b.date)} · {b.start}–{b.end}
        </p>
        <p>
          Prezzo: <strong>{formatPrice(b.price)}</strong>
          {b.status === 'annullata' && ` · penale ${formatPrice(b.penalty ?? 0)}`}
        </p>
        {b.active && !started(b) && (
          <button className="btn btn--ghost" onClick={() => askCancel(b)}>
            Annulla prenotazione
          </button>
        )}
      </article>
    );
  };

  return (
    <section className="my">
      <h1>Le mie prenotazioni</h1>
      <p className="muted">
        {user.name} · annullamento gratuito fino a {rules.FREE_CANCEL_HOURS} ore prima, poi penale del {rules.PENALTY * 100}%
      </p>
      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}

      {/* Conferma annullamento con la penale ben visibile */}
      {open && (
        <div className="panel confirm">
          <p>
            Annullare <strong>{courtName(open.booking.courtId)}</strong>, {formatDay(open.booking.date)} alle {open.booking.start}?
          </p>
          <p>
            {open.penalty > 0 ? (
              <>
                Mancano meno di {rules.FREE_CANCEL_HOURS} ore: penale di <strong>{formatPrice(open.penalty)}</strong>.
              </>
            ) : (
              <>
                Annullamento <strong>gratuito</strong>.
              </>
            )}
          </p>
          <div className="actions">
            <button className="btn btn--ghost" disabled={busy} onClick={confirmCancel}>
              {busy ? 'Annullamento…' : 'Conferma annullamento'}
            </button>
            <button className="link-btn" onClick={() => setPending(null)}>
              Indietro
            </button>
          </div>
        </div>
      )}

      <h2>
        Attive ({active.length}/{rules.MAX_ACTIVE})
      </h2>
      {active.length === 0 ? <p className="muted">Nessuna prenotazione attiva.</p> : active.map(card)}

      {others.length > 0 && (
        <>
          <h2>Passate e annullate</h2>
          {others.map(card)}
        </>
      )}
    </section>
  );
}
