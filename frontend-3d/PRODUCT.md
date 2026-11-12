# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Soci del Centro Calatino Padel che prenotano un campo, spesso dal telefono. Utenti demo definiti nel backend (uno tesserato, due no). Pubblico secondario: chi guarda il progetto come pezzo da portfolio di Daniel (recruiter, clienti).

## Product Purpose
Prenotare in pochi tocchi uno slot da 90 minuti su uno dei tre campi, vedere e annullare le proprie prenotazioni. Deve essere comodo da usare davvero e allo stesso tempo memorabile da mostrare.

## Positioning
È il tabellone del circolo: un solo colpo d'occhio mostra tre campi × fasce orarie di un giorno, con il prezzo già calcolato dal server per quell'utente (sconto tesserato, maggiorazione sera/weekend).

## Capabilities and Constraints
- Stack fisso: React 18 + TypeScript + Vite + React Router (frontend), Node/Express + TypeScript con DB su file JSON (backend). Il backend e le API non cambiano.
- Regole (dal server, `backend/src/config.ts`): slot 90' dalle 8:00 alle 23:00; 40 €, +25% dalle 18:00 o nel weekend (non cumulabili); tesserati −20% e 14 giorni prenotabili (altri 7); massimo 2 prenotazioni attive; annullamento gratuito fino a 24 h prima, poi penale 50%.
- Campi: Campo 1 indoor, Campo 2 indoor, Campo 3 outdoor.
- Nessun login: l'utente si sceglie da una lista. I componenti non chiamano fetch: tutto passa da `src/api.ts`. Griglia aggiornata ogni 5 s (polling).

## Brand Commitments
- Nome: Centro Calatino Padel (da mantenere).
- Foto `public/img/padel-hero.png` (racchetta e pallina su campo indoor) da mantenere.
- Colori e font attuali non sono vincolanti.

## Evidence on Hand
Solo dati demo del backend. Nessuna recensione, numero di soci, indirizzo o orario reale da mostrare: non inventarli.

## Product Principles
- Prenotare viene prima dello spettacolo: la griglia è sempre a un tocco.
- I prezzi e le regole li decide il server; l'interfaccia li rende leggibili prima della conferma.
- Ogni azione (selezione, conferma, annullamento) ha un riscontro chiaro e immediato.
- Il movimento deve raccontare il padel (pallina, rimbalzo, campo), mai decorare a caso.

## Accessibility & Inclusion
Usabile da tastiera, rispetto di prefers-reduced-motion, target touch ≥44px su mobile.

Direzione scelta dall'utente (11/11/2026): "app sportiva moderna", lo standard di categoria eseguito al massimo livello; riferimenti di qualità Playtomic, Nike Run Club, Apple Fitness.
