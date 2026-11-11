import { useCallback, useEffect, useRef, useState } from 'react';

// Carica dati da una funzione asincrona e li ricarica ogni "intervalMs".
// Usato per tenere aggiornati catalogo, fasce e prenotazioni senza ricaricare la pagina.
export function usePolling<T>(load: () => Promise<T>, initial: T, intervalMs = 3000) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadRef = useRef(load);
  // Aggiorno il ref DOPO il render, mai durante
  useEffect(() => {
    loadRef.current = load;
  });

  const refresh = useCallback(async () => {
    try {
      setData(await loadRef.current());
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  return { data, loading, error, refresh };
}
