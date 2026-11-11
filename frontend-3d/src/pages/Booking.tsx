import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api';
import { AlertIcon, ArrowIcon, CheckIcon, ClockIcon, CloseIcon, CourtIcon, MoonIcon, RoofIcon, SunIcon, TagIcon } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { usePolling } from '../hooks/usePolling';
import type { Booking as BookingType, CellStatus, GridRow } from '../types';
import { dayParts, formatDay, formatPrice, isWeekend } from '../utils';

// Il campo 3D si carica a parte: la griglia è subito usabile anche se Three.js arriva dopo
const CourtScene = lazy(() => import('../components/CourtScene'));

// Lo slot cliccato: salvo solo "dove", i dati aggiornati li prendo dalla griglia
interface Selection { date: string; courtId: string; start: string; }

const LABELS: Record<CellStatus, string> = { free: '', booked: 'Occupato', mine: 'Tuo', past: '—' };
const EASE = [0.16, 1, 0.3, 1] as const;

// Prezzo che "scorre" dal valore vecchio al nuovo quando cambi slot
function AnimatedPrice({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => formatPrice(Math.round(v * 100) / 100));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.45, ease: EASE });
    return () => c.stop();
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

export default function Booking() {
  const { config, user } = useApp();
  const { rules } = config;

  // Req. 2 e 8: i giorni dipendono dall'utente (7 o 14)
  const days = usePolling(() => api.getDays(user.id), [] as string[], 60000);
  const [chosenDay, setChosenDay] = useState('');
  const day = days.data.includes(chosenDay) ? chosenDay : (days.data[0] ?? '');

  // Griglia del giorno scelto, aggiornata ogni 5 secondi
  // Ogni risposta la confronto con la precedente: se un altro socio ha preso uno slot, lampeggia una volta
  const previous = useRef(new Map<string, CellStatus>());
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const grid = usePolling(async () => {
    if (!day) return [] as GridRow[];
    const rows = await api.getGrid(user.id, day);
    const now = new Map<string, CellStatus>();
    const diff = new Set<string>();
    for (const r of rows) {
      for (const c of r.cells) {
        const key = `${day}|${r.court.id}|${c.start}`;
        now.set(key, c.status);
        const before = previous.current.get(key);
        if (before && before !== c.status && c.status === 'booked') diff.add(key);
      }
    }
    previous.current = now;
    if (diff.size > 0) setChanged(diff);
    return rows;
  }, [] as GridRow[], 5000);
  // Le mie prenotazioni, per mostrare quante sono attive (req. 6)
  const mine = usePolling(() => api.getBookings(user.id), [] as BookingType[], 5000);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [justBooked, setJustBooked] = useState('');

  // Quando cambio utente o giorno ricarico subito, senza aspettare il prossimo giro
  const refreshDays = days.refresh;
  const refreshGrid = grid.refresh;
  const refreshMine = mine.refresh;
  useEffect(() => { refreshDays(); refreshMine(); }, [user.id, refreshDays, refreshMine]);
  useEffect(() => { refreshGrid(); }, [day, user.id, refreshGrid]);

  useEffect(() => {
    if (changed.size === 0) return;
    const t = setTimeout(() => setChanged(new Set()), 1400);
    return () => clearTimeout(t);
  }, [changed]);

  useEffect(() => {
    if (!justBooked) return;
    const t = setTimeout(() => setJustBooked(''), 1600);
    return () => clearTimeout(t);
  }, [justBooked]);

  const activeCount = mine.data.filter((b) => b.active).length;
  const limitReached = activeCount >= rules.MAX_ACTIVE;
  const weekend = isWeekend(day);

  // Stato DERIVATO: lo slot scelto vale solo se è ancora libero nella griglia attuale
  const row = grid.data.find((r) => r.court.id === selection?.courtId);
  const cell = row?.cells.find((c) => c.start === selection?.start);
  const selected = selection?.date === day && cell?.status === 'free' && row ? { court: row.court, cell } : null;

  const pick = (courtId: string, start: string) => {
    setSelection({ date: day, courtId, start });
    setMessage('');
    setError('');
  };

  const confirm = async () => {
    if (!selected) return;
    setSending(true);
    setError('');
    try {
      await api.book(user.id, selected.court.id, day, selected.cell.start);
      setMessage(`${selected.court.name} prenotato · ${formatDay(day)} alle ${selected.cell.start}`);
      setJustBooked(`${day}|${selected.court.id}|${selected.cell.start}`);
      setSelection(null);
    } catch (e) {
      setError((e as Error).message); // es. "Slot già occupato" se qualcuno ci ha preceduto
    } finally {
      setSending(false);
      await Promise.all([refreshGrid(), refreshMine()]);
    }
  };

  return (
    <section className="booking-page">
      {/* ===== Hero: titolo e regole a sinistra, campo 3D a destra ===== */}
      <div className="hero">
        <div className="hero__court">
          <Suspense fallback={<div className="court-scene court-scene--loading" />}>
            <CourtScene />
          </Suspense>
        </div>
        <div className="container hero__inner">
          <div className="hero__copy">
            <h1 className="hero__title">
              {['Prenota', 'un campo'].map((w, i) => (
                <span key={w} className="hero__line">
                  <motion.span
                    className="hero__word"
                    initial={{ y: '105%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 0.7, delay: 0.08 + i * 0.09, ease: EASE }}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </h1>

            <ul className="rules">
              <li><ClockIcon /> Slot da {rules.SLOT_MINUTES} minuti</li>
              <li><TagIcon /> {formatPrice(rules.BASE_PRICE)} a partita</li>
              <li><MoonIcon /> +{rules.SURCHARGE * 100}% dalle {rules.SURCHARGE_FROM} e nel weekend</li>
              {user.member && <li className="rules__member"><CheckIcon /> Tesserato: −{rules.MEMBER_DISCOUNT * 100}% e {rules.MEMBER_DAYS_AHEAD} giorni</li>}
            </ul>

            {/* Req. 6: le prenotazioni attive come palline sul segnapunti */}
            <div className={`quota ${limitReached ? 'quota--full' : ''}`} aria-live="polite">
              <span className="quota__balls" aria-hidden="true">
                {Array.from({ length: rules.MAX_ACTIVE }, (_, i) => (
                  <span key={i} className={`quota__ball ${i < activeCount ? 'quota__ball--on' : ''}`} />
                ))}
              </span>
              <span>
                <strong>{activeCount} di {rules.MAX_ACTIVE}</strong> prenotazioni attive
                {limitReached && <span className="quota__note"> · limite raggiunto: annullane una per prenotare ancora</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Req. 2: da oggi a 7 giorni (14 per i tesserati) */}
        <div className="days-head">
          <h2>Scegli il giorno</h2>
          <span className="muted small">{days.data.length} giorni prenotabili</span>
        </div>
        <div className="days" role="tablist" aria-label="Giorno">
          {days.data.map((d) => {
            const on = d === day;
            return (
              <button key={d} role="tab" aria-selected={on}
                className={`day ${on ? 'day--on' : ''} ${isWeekend(d) ? 'day--weekend' : ''}`}
                onClick={() => setChosenDay(d)}>
                {on && <motion.span layoutId="day-pill" className="day__pill" transition={{ type: 'spring', stiffness: 480, damping: 38 }} />}
                <span className="day__name">{dayParts(d).name}</span>
                <span className="day__num">{dayParts(d).num.slice(0, 2)}</span>
                {isWeekend(d) && <span className="day__dot" aria-label="weekend, tariffa maggiorata" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {message && (
            <motion.p key="ok" className="alert alert--ok" role="status"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}>
              <svg className="alert__check" viewBox="0 0 24 24" aria-hidden="true">
                <motion.path d="m4.5 12.5 5 5 10-11" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.15, ease: EASE }} />
              </svg>
              {message}
              <button className="alert__close" onClick={() => setMessage('')} aria-label="Chiudi"><CloseIcon width={16} height={16} /></button>
            </motion.p>
          )}
          {error && (
            <motion.p key="err" className="alert alert--error" role="alert"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}>
              <AlertIcon /> {error}
              <button className="alert__close" onClick={() => setError('')} aria-label="Chiudi"><CloseIcon width={16} height={16} /></button>
            </motion.p>
          )}
        </AnimatePresence>

        {weekend && (
          <p className="notice"><MoonIcon width={18} height={18} /> Weekend: tariffa +{rules.SURCHARGE * 100}% su tutti gli slot</p>
        )}

        {/* ===== Griglia campi × orari (req. 2) ===== */}
        <div className="grid-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th scope="col" className="grid__corner">Orario</th>
                {grid.data.map((r) => (
                  <th key={r.court.id} scope="col">
                    <span className="court-head">
                      <CourtIcon className="court-head__icon" />
                      <span className="court-head__name">{r.court.name}</span>
                      <span className={`court-type court-type--${r.court.type}`}>
                        {r.court.type === 'indoor' ? <RoofIcon width={13} height={13} /> : <SunIcon width={13} height={13} />}
                        {r.court.type}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            {/* tbody nuovo a ogni giorno/utente: le celle entrano a cascata */}
            <tbody key={`${day}-${user.id}`}>
              {config.slots.map((s, i) => {
                const peak = s.start >= rules.SURCHARGE_FROM;
                const firstPeak = peak && (i === 0 || config.slots[i - 1].start < rules.SURCHARGE_FROM);
                return (
                  // Fascia serale: dalle 18:00 scatta la maggiorazione (req. 5)
                  <tr key={s.start} className={`${peak || weekend ? 'row--peak' : ''} ${firstPeak && !weekend ? 'row--peak-start' : ''}`}>
                    <th scope="row">
                      <span className="slot-time">{s.start}<span className="slot-time__end">{s.end}</span></span>
                      {(peak || weekend) && <span className="peak-tag">+{rules.SURCHARGE * 100}%</span>}
                    </th>
                    {grid.data.map((r, col) => {
                      const c = r.cells[i];
                      const key = `${day}|${r.court.id}|${c.start}`;
                      const isSel = selection?.date === day && selection.courtId === r.court.id && selection.start === c.start && c.status === 'free';
                      const label = c.status === 'free' ? `${r.court.name}, ${s.start}, ${formatPrice(c.price)}` : `${r.court.name}, ${s.start}, ${LABELS[c.status]}`;
                      return (
                        <td key={r.court.id}>
                          <motion.button
                            className={`cell cell--${c.status} ${isSel ? 'cell--sel' : ''} ${changed.has(key) ? 'cell--changed' : ''} ${justBooked === key ? 'cell--just' : ''}`}
                            disabled={c.status !== 'free' || limitReached}
                            aria-pressed={isSel}
                            aria-label={label}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(i * 0.022 + col * 0.03, 0.3), ease: EASE }}
                            whileTap={c.status === 'free' && !limitReached ? { scale: 0.96 } : undefined}
                            onClick={() => pick(r.court.id, c.start)}
                          >
                            {/* Il momento firma: la pallina cade sullo slot scelto e lo "colora" */}
                            {isSel && (
                              <>
                                <motion.span className="cell__fill" aria-hidden="true"
                                  initial={{ clipPath: 'circle(0% at 22px 50%)' }} animate={{ clipPath: 'circle(150% at 22px 50%)' }}
                                  transition={{ duration: 0.5, delay: 0.22, ease: EASE }} />
                                <motion.span className="cell__ball" aria-hidden="true"
                                  initial={{ y: -34, scaleX: 1, scaleY: 1 }}
                                  animate={{ y: [-34, 0, -9, 0], scaleX: [1, 1.25, 1, 1.08, 1], scaleY: [1, 0.72, 1, 0.9, 1] }}
                                  transition={{ duration: 0.6, times: [0, 0.4, 0.68, 1], ease: 'easeOut' }} />
                              </>
                            )}
                            <span className="cell__text">{c.status === 'free' ? formatPrice(c.price) : LABELS[c.status]}</span>
                          </motion.button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ul className="legend" aria-label="Legenda">
          <li><span className="swatch swatch--free" /> Libero</li>
          <li><span className="swatch swatch--sel" /> Selezionato</li>
          <li><span className="swatch swatch--mine" /> Tuo</li>
          <li><span className="swatch swatch--booked" /> Occupato</li>
          <li><span className="peak-tag">+{rules.SURCHARGE * 100}%</span> Sera e weekend</li>
        </ul>
      </div>

      {/* Riepilogo prima della conferma: il prezzo lo ha calcolato il server */}
      {/* Portal: il pannello sta su <body>, così resta fisso in basso anche durante le transizioni di pagina */}
      {createPortal(
        <AnimatePresence>
          {selected && (
            <motion.div className="sheet" role="region" aria-label="Riepilogo prenotazione"
              initial={{ y: '120%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '120%', opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
              <div className="sheet__info">
                <span className="sheet__court"><CourtIcon /> {selected.court.name} <span className="muted">· {selected.court.type}</span></span>
                <span className="sheet__when">{formatDay(day)} · {selected.cell.start}–{selected.cell.end}</span>
              </div>
              <div className="sheet__price">
                <span className="sheet__amount"><AnimatedPrice value={selected.cell.price} /></span>
                {user.member && <span className="sheet__note">sconto tesserato incluso</span>}
              </div>
              <div className="sheet__actions">
                <button className="link-btn" onClick={() => setSelection(null)}>Annulla</button>
                <button className="btn btn--ball" disabled={sending} onClick={confirm}>
                  {sending ? 'Invio…' : <>Conferma <ArrowIcon width={18} height={18} /></>}
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
