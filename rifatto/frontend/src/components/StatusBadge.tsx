import { useStore } from '../context/StoreContext';
import type { OrderStatus } from '../types';

// Il colore dipende dalla POSIZIONE dello stato nella sequenza, non dal suo nome:
// così funziona con qualsiasi elenco di stati scritto nella config.
function useStatusClass(status: OrderStatus) {
  const { statusFlow, cancelledStatus } = useStore().config;
  if (status === cancelledStatus) return 'status--cancelled';
  const i = statusFlow.indexOf(status);
  return i === statusFlow.length - 1 ? 'status--done' : `status--${Math.min(i, 3)}`;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status ${useStatusClass(status)}`}>{status}</span>;
}

// Barra di avanzamento: stato 1 → stato 2 → ... → stato finale
export function StatusSteps({ status }: { status: OrderStatus }) {
  const { statusFlow } = useStore().config;
  const current = statusFlow.indexOf(status);
  if (current === -1) return null; // annullato
  return (
    <ol className="steps">
      {statusFlow.map((s, i) => (
        <li key={s} className={i <= current ? 'steps__done' : ''}>{s}</li>
      ))}
    </ol>
  );
}
