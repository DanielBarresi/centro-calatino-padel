import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { AlertIcon, ArrowIcon, BallIcon, CloseIcon, CourtIcon } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { usePolling } from '../hooks/usePolling';
import type { Booking } from '../types';
import { formatDay, formatPrice } from '../utils';

const EASE = [0.16, 1, 0.3, 1] as const;

// "tra 2 g 5 h", "tra 3 h", "tra 40 min" fino all'inizio della partita
function countdown(date: string, start: string): string {
  const ms = new Date(`${date}T${start}`).getTime() - Date.now();
  if (ms <= 0) return 'in corso';
  const min = Math.round(ms / 60000);
  if (min < 60) return `tra ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `tra ${h} h`;
  return `tra ${Math.floor(h / 24)} g ${h % 24} h`;
}

const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

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
  const courtType = (id: string) => config.courts.find((c) => c.id === id)?.type ?? '';
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

  const ticket = (b: Booking, i: number) => {
    const off = b.status === 'annullata';
    const label = off ? 'Annullata' : b.active ? 'Attiva' : 'Conclusa';
    const badge = off ? 'status--cancelled' : b.active ? 'status--active' : 'status--done';
    const [, m, d] = b.date.split('-').map(Number);
    return (
      // layoutId: quando la annulli, la stessa card scivola in "Passate e annullate"
      <motion.article key={b.id} layoutId={b.id} layout
        className={`ticket ${off ? 'ticket--off' : ''} ${b.active ? 'ticket--active' : ''} ${open?.booking.id === b.id ? 'ticket--pending' : ''}`}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.25), ease: EASE }}>
        <div className="ticket__date" aria-hidden="true">
          <span className="ticket__day">{String(d).padStart(2, '0')}</span>
          <span className="ticket__month">{MONTHS[m - 1]}</span>
        </div>
        <div className="ticket__body">
          <div className="ticket__head">
            <h3 className="ticket__court"><CourtIcon width={18} height={18} /> {courtName(b.courtId)} <span className="ticket__type">{courtType(b.courtId)}</span></h3>
            <span className={`status ${badge}`}>{label}</span>
          </div>
          <p className="ticket__when">
            {formatDay(b.date)} · {b.start}–{b.end}
            {b.active && <span className="ticket__count"> · {countdown(b.date, b.start)}</span>}
          </p>
          <p className="ticket__price">
            {formatPrice(b.price)}
            {off && <span className="muted"> · penale {formatPrice(b.penalty ?? 0)}</span>}
          </p>
        </div>
        {b.active && !started(b) && (
          <button className="btn btn--danger-ghost ticket__cancel" onClick={() => askCancel(b)}>
            Annulla
          </button>
        )}
      </motion.article>
    );
  };

  return (
    <section className="my-page">
      {/* Fascia con la foto del circolo, che si avvicina piano */}
      <div className="my-hero">
        <img className="my-hero__img" src="/img/padel-hero.png" alt="" />
        <div className="container my-hero__inner">
          <h1>Le mie prenotazioni</h1>
          <p>
            {user.name} · annullamento gratuito fino a {rules.FREE_CANCEL_HOURS} ore prima, poi penale del {rules.PENALTY * 100}%
          </p>
        </div>
      </div>

      <div className="container my">
        <AnimatePresence initial={false}>
          {message && (
            <motion.p key="ok" className="alert alert--ok" role="status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <svg className="alert__check" viewBox="0 0 24 24" aria-hidden="true">
                <motion.path d="m4.5 12.5 5 5 10-11" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.15, ease: EASE }} />
              </svg>
              {message}
              <button className="alert__close" onClick={() => setMessage('')} aria-label="Chiudi"><CloseIcon width={16} height={16} /></button>
            </motion.p>
          )}
          {error && (
            <motion.p key="err" className="alert alert--error" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <AlertIcon /> {error}
              <button className="alert__close" onClick={() => setError('')} aria-label="Chiudi"><CloseIcon width={16} height={16} /></button>
            </motion.p>
          )}
        </AnimatePresence>

        <LayoutGroup>
          <h2 className="section-title">
            Attive <span className="section-title__count">{active.length}/{rules.MAX_ACTIVE}</span>
          </h2>
          <div className="tickets">
            <AnimatePresence mode="popLayout">
              {active.length === 0 ? (
                <motion.div key="empty" className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <BallIcon className="empty__ball" width={36} height={36} />
                  <p>Nessuna prenotazione attiva. Il campo ti aspetta.</p>
                  <Link to="/" className="btn btn--ball">Prenota un campo <ArrowIcon width={18} height={18} /></Link>
                </motion.div>
              ) : (
                active.map(ticket)
              )}
            </AnimatePresence>
          </div>

          {others.length > 0 && (
            <>
              <h2 className="section-title">Passate e annullate</h2>
              <div className="tickets">
                <AnimatePresence mode="popLayout">{others.map(ticket)}</AnimatePresence>
              </div>
            </>
          )}
        </LayoutGroup>
      </div>

      {/* Conferma annullamento con la penale ben visibile */}
      {/* Portal: il pannello sta su <body>, così resta fisso in basso anche durante le transizioni di pagina */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="sheet sheet--danger" role="alertdialog" aria-label="Conferma annullamento"
              initial={{ y: '120%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '120%', opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
              <div className="sheet__info">
                <span className="sheet__court">Annullare {courtName(open.booking.courtId)}?</span>
                <span className="sheet__when">{formatDay(open.booking.date)} · {open.booking.start}–{open.booking.end}</span>
              </div>
              <div className="sheet__price">
                {open.penalty > 0 ? (
                  <>
                    <span className="sheet__amount sheet__amount--danger">{formatPrice(open.penalty)}</span>
                    <span className="sheet__note">penale: mancano meno di {rules.FREE_CANCEL_HOURS} ore</span>
                  </>
                ) : (
                  <>
                    <span className="sheet__amount">Gratis</span>
                    <span className="sheet__note">nessuna penale</span>
                  </>
                )}
              </div>
              <div className="sheet__actions">
                <button className="link-btn" onClick={() => setPending(null)}>Indietro</button>
                <button className="btn btn--danger" disabled={busy} onClick={confirmCancel}>
                  {busy ? 'Annullamento…' : 'Conferma annullamento'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}
