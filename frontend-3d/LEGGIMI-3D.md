# Frontend 3D animato

Copia di `frontend/` con grafica nuova. **Il codice della versione d'esame (`frontend/`) e il backend non sono stati toccati.**
Stesso stack: React 18 + TypeScript + Vite + React Router. Stesse chiamate in `src/api.ts`, stesse regole lato server.

## Avvio
Dalla cartella del progetto (quella con `backend/`):

```bash
npm install --prefix frontend-3d   # solo la prima volta
npm run dev --prefix backend       # terminale 1: API su :3001
npm run dev --prefix frontend-3d   # terminale 2: app su http://localhost:5173
```

## Librerie aggiunte
| Libreria | Perché |
|---|---|
| `three` + `@react-three/fiber` | il campo da padel 3D nella pagina Prenota |
| `motion` (ex Framer Motion) | animazioni: pillole che scivolano, pallina sullo slot, riepilogo che sale, transizioni di pagina |

## File principali
- `src/components/CourtScene.tsx` — campo 3D: misure reali 10×20 m, vetri, rete, pallina che palleggia. Caricato a parte (lazy), si ferma quando non è visibile.
- `src/pages/Booking.tsx` — hero, giorni, griglia, riepilogo in basso.
- `src/pages/MyBookings.tsx` — prenotazioni come "biglietti", annullamento con penale.
- `src/components/Icons.tsx` — icone SVG disegnate a mano.
- `DESIGN.md` — colori, font, componenti, regole del movimento.
