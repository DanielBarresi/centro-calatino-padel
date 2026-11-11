// unico punto che chiama il server (modulo dedicato richiesto dalla traccia)


import type { AppConfig, Booking, GridRow} from './types.ts';


async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });


  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Errore ${res.status}`);
  return data as T;
}

const post = <T>(url: string, body?: unknown) =>
  request<T>(url, { method: 'POST', body: JSON.stringify(body ?? {}) });


export const api = {
  getConfig: () => request<AppConfig>('/config'),
  getDays: (userId: string) => request<string[]>(`/days?userId=${userId}`),
  getGrid: (userId: string, date: string) => request<GridRow[]>(`/grid?userId=${userId}&date=${date}`),
  getBookings: (userId: string) => request<Booking[]>(`/bookings?userId=${userId}`),
  getPenalty: (id: string) => request<{ penalty: number }>(`/bookings/${id}/penalty`),
  book: (userId: string, courtId: string, date: string, start: string) =>
    post<Booking>('/bookings', { userId, courtId, date, start }),
  cancel: (id: string, userId: string) => post<Booking>(`/bookings/${id}/cancel`, { userId }),
  reset: () => post<{ ok: boolean }>('/reset'),
};