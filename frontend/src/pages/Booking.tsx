import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { usePolling } from '../hooks/usePolling';
import type { Booking as BookingType, GridRow } from '../types';
import { dayParts, formatDay, formatPrice, isWeekend } from '../utils';

// Lo slot cliccato: salvo solo "dove", i dati aggiornati li prendo dalla griglia
interface Selection { date: string; courtId: string; start: string; }

const LABELS = { free: '', booked: 'Occupato', mine: 'Tua', past: '—' };

export default function Booking() {
  const { config, user } = useApp();
  const { rules } = config;

  // Req. 2 e 8: i giorni dipendono dall'utente (7 o 14)
  const days = usePolling(() => api.getDays(user.id), [] as string[], 60000);
  const [chosenDay, setChosenDay] = useState('');
  const day = days.data.includes(chosenDay) ? chosenDay : (days.data[0] ?? '');

  // Griglia del giorno scelto, aggiornata ogni 5 secondi
  const grid = usePolling(() => (day ? api.getGrid(user.id, day) : Promise.resolve([])), [] as GridRow[], 5000);
  // Le mie prenotazioni, per mostrare quante sono attive (req. 6)
  const mine = usePolling(() => api.getBookings(user.id), [] as BookingType[], 5000);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Quando cambio utente o giorno ricarico subito, senza aspettare il prossimo giro
  const refreshDays = days.refresh;
  const refreshGrid = grid.refresh;
  const refreshMine = mine.refresh;
  useEffect(() => { refreshDays(); refreshMine(); }, [user.id, refreshDays, refreshMine]);
  useEffect(() => { refreshGrid(); }, [day, user.id, refreshGrid]);

  const activeCount = mine.data.filter((b) => b.active).length;
  const limitReached = activeCount >= rules.MAX_ACTIVE;

  // Stato DERIVATO: lo slot scelto vale solo se è ancora libero nella griglia attuale
  const row = grid.data.find((r) => r.court.id === selection?.courtId);
  const cell = row?.cells.find((c) => c.start === selection?.start);
  const selected = selection?.date === day && cell?.status === 'free' && row ? { court: row.court, cell } : null;

  const confirm = async () => {
    if (!selected) return;
    setSending(true);
    setError('');
    try {
      await api.book(user.id, selected.court.id, day, selected.cell.start);
      setMessage(`Prenotato ${selected.court.name}, ${formatDay(day)} alle ${selected.cell.start}`);
      setSelection(null);
    } catch (e) {
      setError((e as Error).message); // es. "Slot già occupato" se qualcuno ci ha preceduto
    } finally {
      setSending(false);
      await Promise.all([refreshGrid(), refreshMine()]);
    }
  };

  return (
    <section>
      <div className="intro">
        <div className="page-head">
        <h1>Prenota un campo</h1>
        <p className="muted">
          Slot da {rules.SLOT_MINUTES} minuti · {formatPrice(rules.BASE_PRICE)}, +{rules.SURCHARGE * 100}% dalle {rules.SURCHARGE_FROM} e nel weekend
          {user.member && ` · sconto tesserato −${rules.MEMBER_DISCOUNT * 100}%`}
        </p>
        <p className={limitReached ? 'warn' : 'muted'}>
          Prenotazioni attive: {activeCount}/{rules.MAX_ACTIVE}
          {limitReached && ' — limite raggiunto, annullane una per prenotare ancora'}
        </p>
        </div>
        <img className="hero" src="/img/padel-hero.png" alt="Racchetta e pallina su un campo da padel indoor" />
      </div>

      {/* Req. 2: da oggi a 7 giorni (14 per i tesserati) */}
      <div className="days" role="tablist">
        {days.data.map((d) => (
          <button key={d} role="tab" aria-selected={d === day}
            className={`day ${d === day ? 'day--on' : ''} ${isWeekend(d) ? 'day--weekend' : ''}`} onClick={() => setChosenDay(d)}>
            <span className="day__name">{dayParts(d).name}</span>
            <span className="day__num">{dayParts(d).num}</span>
          </button>
        ))}
      </div>

      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid-wrap">
        <table className={`grid ${isWeekend(day) ? 'grid--weekend' : ''}`}>
          <thead>
            <tr>
              <th>Orario</th>
              {grid.data.map((r) => (
                <th key={r.court.id}>
                  {r.court.name}
                  <span className={`court-type court-type--${r.court.type}`}>{r.court.type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {config.slots.map((s, i) => (
              // Fascia serale: dalle 18:00 scatta la maggiorazione (req. 5)
              <tr key={s.start} className={s.start >= rules.SURCHARGE_FROM ? 'row--peak' : ''}>
                <th>{s.start}–{s.end}</th>
                {grid.data.map((r) => {
                  const c = r.cells[i];
                  const isSel = selection?.date === day && selection.courtId === r.court.id && selection.start === c.start;
                  return (
                    <td key={r.court.id}>
                      <button
                        className={`cell cell--${c.status} ${isSel ? 'cell--sel' : ''}`}
                        disabled={c.status !== 'free' || limitReached}
                        onClick={() => { setSelection({ date: day, courtId: r.court.id, start: c.start }); setMessage(''); setError(''); }}>
                        {c.status === 'free' ? formatPrice(c.price) : LABELS[c.status]}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="legend">
        <li><span className="swatch swatch--free" /> Libero</li>
        <li><span className="swatch swatch--mine" /> Tua prenotazione</li>
        <li><span className="swatch swatch--booked" /> Occupato</li>
        <li><span className="swatch swatch--past" /> Passato</li>
        <li><span className="swatch swatch--peak" /> Sera e weekend: +{rules.SURCHARGE * 100}%</li>
      </ul>

      {/* Riepilogo prima della conferma: il prezzo lo ha calcolato il server */}
      {selected && (
        <div className="panel confirm">
          <p>
            <strong>{selected.court.name}</strong> ({selected.court.type}) · {formatDay(day)} · {selected.cell.start}–{selected.cell.end}
          </p>
          <p>Prezzo: <strong>{formatPrice(selected.cell.price)}</strong>{user.member && ' (sconto tesserato incluso)'}</p>
          <div className="actions">
            <button className="btn" disabled={sending} onClick={confirm}>
              {sending ? 'Invio…' : 'Conferma prenotazione'}
            </button>
            <button className="link-btn" onClick={() => setSelection(null)}>Annulla</button>
          </div>
        </div>
      )}
    </section>
  );
}