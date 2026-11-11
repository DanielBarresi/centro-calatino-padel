// avvia il server e gestisce tutti gli errori

import express, { type NextFunction, type Request, type Response } from 'express';
import { api } from './routes/api.ts';
import { AppError } from './services/bookings.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Trasforma il corpo JSON delle richieste in req.body
app.use(express.json());

// Log delle richieste che modificano i dati (i GET del polling intaserebbero il terminale)
app.use((req, _res, next) => {
  if (req.method !== 'GET') console.log(`${new Date().toLocaleTimeString('it-IT')}  ${req.method} ${req.url}`);
  next();
});

app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint non trovato' }));

// Gestione centralizzata degli errori: un solo punto decide cosa risponde il server.
// AppError → codice e messaggio scelti dal service; JSON malformato → 400; altro → 500
app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON non valido' });
  console.error(err);
  res.status(500).json({ error: 'Errore interno del server' });
});

app.listen(PORT, () => {
   console.log(`Prenotazione campi da padel — API su http://localhost:${PORT}`);});
