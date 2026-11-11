// Ogni categoria è una "linea" della metro con un colore fisso.
// Il colore dipende dalla posizione della categoria nella config, non dal nome:
// così funziona con qualsiasi negozio.
const LINE_COLORS = ['#00843d', '#0064b0', '#f2a900', '#8e5ba8', '#e06b00', '#00888a'];

export function lineColor(categories: string[], category: string): string {
  const i = categories.indexOf(category);
  return LINE_COLORS[(i < 0 ? 0 : i) % LINE_COLORS.length];
}
