import { useState } from 'react';
import type { Slot } from '../types';

interface Props {
  title: string;
  slots: Slot[];
  value: string;
  onChange: (slotId: string) => void;
}

// Req. 3 e 4: gli orari sono le "fermate" di una linea.
// Quelli già iniziati o pieni sono disabilitati.
export default function SlotPicker({ title, slots, value, onChange }: Props) {
  const todayHasFree = slots.some((s) => s.day === 'oggi' && s.available);
  // Finché l'utente non sceglie, mostro "oggi" se ha posti, altrimenti "domani"
  const [chosenDay, setDay] = useState<Slot['day'] | null>(null);
  const day = chosenDay ?? (todayHasFree ? 'oggi' : 'domani');
  const visible = slots.filter((s) => s.day === day);

  const hint = (s: Slot) => (s.started ? 'Passato' : s.full ? 'Pieno' : `${s.capacity - s.booked} posti`);

  return (
    <fieldset className="slots">
      <legend>{title}</legend>
      <div className="tabs" role="tablist">
        {(['oggi', 'domani'] as const).map((d) => (
          <button type="button" key={d} role="tab" aria-selected={day === d}
            className={`tab ${day === d ? 'tab--on' : ''}`} onClick={() => setDay(d)}>
            {d === 'oggi' ? 'Oggi' : 'Domani'}
          </button>
        ))}
      </div>

      {!visible.some((s) => s.available) && <p className="muted small">Nessun orario disponibile per {day}.</p>}

      <div className="track">
        {visible.map((s) => (
          <button type="button" key={s.id} disabled={!s.available}
            className={`stop ${value === s.id ? 'stop--on' : ''} ${s.full ? 'stop--full' : ''} ${s.started ? 'stop--past' : ''}`}
            onClick={() => onChange(s.id)} aria-pressed={value === s.id}>
            <span className="stop__dot" aria-hidden />
            <strong className="stop__time">{s.time}</strong>
            <span className="stop__hint">{hint(s)}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
