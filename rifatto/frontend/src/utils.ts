export const formatPrice = (value: number): string =>
  value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "2026-10-21T16:20" → "Oggi 16:20" / "Domani 16:20" / "mer 21/10 16:20"
export function formatSlot(slotId: string): string {
  const [date, time] = slotId.split('T');
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (date === dateKey(now)) return `Oggi ${time}`;
  if (date === dateKey(tomorrow)) return `Domani ${time}`;
  const [y, m, d] = date.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' });
  return `${label} ${time}`;
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
    // storage pieno o non disponibile: ignoro, l'app funziona lo stesso
  }
}
