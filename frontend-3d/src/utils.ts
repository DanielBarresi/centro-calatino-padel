// formattazione di prezzi e date, localStorage protetto


export const formatPrice = (value: number): string =>
  value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

// '2026-10-21' → 'Oggi' / 'Domani' / 'ven 23/10'
export function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Oggi';
  if (diff === 1) return 'Domani';
  return day.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

// '2026-10-23' → { name: 'ven', num: '23/10' } per le schede dei giorni
export function dayParts(date: string): { name: string; num: string } {
  const [y, m, d] = date.split('-').map(Number);
  const label = formatDay(date);
  const name = label === 'Oggi' || label === 'Domani' ? label : new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'short' });
  return { name, num: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}` };
}

// Sabato o domenica: nel weekend scatta la maggiorazione (req. 5)
export function isWeekend(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
}

// localStorage protetto: se non è disponibile l'app funziona lo stesso
export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // spazio pieno o modalità privata: ignoro
  }
}